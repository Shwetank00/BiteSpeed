const knex = require('../db/knex');

async function reconcile({ email, phoneNumber }) {
  const trx = await knex.transaction();
  try {
    // Step 1: Find initial matches (non-deleted)
    const initialMatches = await trx('contacts')
      .whereNull('deleted_at')
      .andWhere(function() {
        if (email) this.orWhere('email', email);
        if (phoneNumber) this.orWhere('phone_number', phoneNumber);
      })
      .forUpdate();

    if (initialMatches.length === 0) {
      // Insert new primary
      const [newContact] = await trx('contacts')
        .insert({
          email,
          phone_number: phoneNumber,
          link_precedence: 'primary',
        })
        .returning('*');

      await trx.commit();

      return {
        contact: {
          primaryContatctId: newContact.id,
          emails: newContact.email ? [newContact.email] : [],
          phoneNumbers: newContact.phone_number ? [newContact.phone_number] : [],
          secondaryContactIds: []
        }
      };
    }

    // Advanced logic to be added here
    
    await trx.commit();
    return {};
  } catch (error) {
    await trx.rollback();
    throw error;
  }
}

module.exports = { reconcile };
