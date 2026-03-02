const knex = require('../db/knex');
const { buildResponse } = require('../utils/responseBuilder');

async function reconcile({ email, phoneNumber }) {
  // Normalize inputs
  let normEmail = email ? email.trim().toLowerCase() : null;
  if (normEmail === '') normEmail = null;

  let normPhone = phoneNumber ? String(phoneNumber).trim() : null;
  if (normPhone === '') normPhone = null;

  if (!normEmail && !normPhone) {
    throw new Error('Email or phoneNumber is required');
  }

  const trx = await knex.transaction();
  try {
    // Step 1: Find initial matches (non-deleted)
    const initialMatches = await trx('contacts')
      .whereNull('deleted_at')
      .andWhere(function() {
        if (normEmail) this.orWhere('email', normEmail);
        if (normPhone) this.orWhere('phone_number', normPhone);
      })
      .forUpdate();

    if (initialMatches.length === 0) {
      // Insert new primary
      const [newContact] = await trx('contacts')
        .insert({
          email: normEmail,
          phone_number: normPhone,
          link_precedence: 'primary',
        })
        .returning('*');

      await trx.commit();
      return buildResponse(newContact, []);
    }

    // Step 2: Expand to full connected component via iterative closure
    let idsSeen = new Set(initialMatches.map((c) => c.id));
    let emailsSeen = new Set(initialMatches.map((c) => c.email).filter(Boolean));
    let phonesSeen = new Set(initialMatches.map((c) => c.phone_number).filter(Boolean));

    let componentContacts = [...initialMatches];
    let sizeBefore = 0;

    while (idsSeen.size > sizeBefore) {
      sizeBefore = idsSeen.size;

      const expanded = await trx('contacts')
        .whereNull('deleted_at')
        .andWhere(function () {
          if (emailsSeen.size > 0) this.orWhereIn('email', Array.from(emailsSeen));
          if (phonesSeen.size > 0) this.orWhereIn('phone_number', Array.from(phonesSeen));
          if (idsSeen.size > 0) {
            this.orWhereIn('id', Array.from(idsSeen));
            this.orWhereIn('linked_id', Array.from(idsSeen));
          }
        })
        .forUpdate();

      for (const c of expanded) {
        if (!idsSeen.has(c.id)) {
          idsSeen.add(c.id);
          if (c.email) emailsSeen.add(c.email);
          if (c.phone_number) phonesSeen.add(c.phone_number);
          
          if (c.linked_id) idsSeen.add(c.linked_id);
          componentContacts.push(c);
        }
      }
    }

    // Step 3: Determine true primary
    componentContacts.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.id - b.id;
    });

    const truePrimary = componentContacts[0];

    // Step 4: Demote other primaries and re-point secondaries
    const idsToDemote = [];
    const idsToRepoint = [];

    for (const c of componentContacts) {
      if (c.id === truePrimary.id) continue;

      if (c.link_precedence === 'primary') {
         idsToDemote.push(c.id);
      } else if (c.linked_id !== truePrimary.id) {
         idsToRepoint.push(c.id);
      }
    }

    if (idsToDemote.length > 0) {
      await trx('contacts')
        .whereIn('id', idsToDemote)
        .update({
          link_precedence: 'secondary',
          linked_id: truePrimary.id,
          updated_at: knex.fn.now()
        });
    }

    if (idsToRepoint.length > 0) {
      await trx('contacts')
        .whereIn('id', idsToRepoint)
        .update({
          linked_id: truePrimary.id,
          updated_at: knex.fn.now()
        });
    }

    // Calculate component's existing emails and phones
    const componentEmails = new Set(componentContacts.map(c => c.email).filter(Boolean));
    const componentPhones = new Set(componentContacts.map(c => c.phone_number).filter(Boolean));

    // Step 5: Evaluate if should create secondary
    const isNewEmail = normEmail && !componentEmails.has(normEmail);
    const isNewPhone = normPhone && !componentPhones.has(normPhone);

    const shouldCreateSecondary = isNewEmail || isNewPhone;

    if (shouldCreateSecondary) {
      await trx('contacts')
        .insert({
          email: normEmail,
          phone_number: normPhone,
          linked_id: truePrimary.id,
          link_precedence: 'secondary'
        });
    }

    // Step 6: Reload the final component and build response
    const finalComponent = await trx('contacts')
      .whereNull('deleted_at')
      .andWhere(function() {
        this.where('id', truePrimary.id).orWhere('linked_id', truePrimary.id);
      })
      .orderBy('created_at', 'asc')
      .orderBy('id', 'asc');

    await trx.commit();

    return buildResponse(truePrimary, finalComponent);
  } catch (error) {
    await trx.rollback();
    throw error;
  }
}

module.exports = { reconcile };
