const knex = require('../src/db/knex');
const { reconcile } = require('../src/services/identityService');

describe('IdentityService Unit Tests', () => {
  beforeAll(async () => {
    await knex.migrate.latest();
  });

  beforeEach(async () => {
    await knex('contacts').del();
  });

  afterAll(async () => {
    // Wait slightly to ensure connections finish
    await new Promise(resolve => setTimeout(resolve, 500));
    await knex.destroy();
  });

  it('A) No existing -> creates primary', async () => {
    const res = await reconcile({ email: 'test@bitespeed.com', phoneNumber: '123456' });
    expect(res.contact.primaryContatctId).toBeDefined();
    expect(res.contact.emails).toEqual(['test@bitespeed.com']);
    expect(res.contact.phoneNumbers).toEqual(['123456']);
    expect(res.contact.secondaryContactIds).toEqual([]);
  });

  it('B) Same phone, new email -> creates secondary', async () => {
    const p1 = await reconcile({ email: 'old@bitespeed.com', phoneNumber: '123456' });
    const p2 = await reconcile({ email: 'new@bitespeed.com', phoneNumber: '123456' });
    
    expect(p2.contact.primaryContatctId).toBe(p1.contact.primaryContatctId);
    expect(p2.contact.emails).toEqual(['old@bitespeed.com', 'new@bitespeed.com']);
    expect(p2.contact.phoneNumbers).toEqual(['123456']);
    expect(p2.contact.secondaryContactIds.length).toBe(1);
  });

  it('C) Two primaries exist, request bridges -> merge and demote newer primary', async () => {
    const p1 = await reconcile({ email: 'first@bitespeed.com', phoneNumber: '111' });
    await new Promise((r) => setTimeout(r, 50));
    const p2 = await reconcile({ email: 'second@bitespeed.com', phoneNumber: '222' });
    
    const p3 = await reconcile({ email: 'first@bitespeed.com', phoneNumber: '222' });

    expect(p3.contact.primaryContatctId).toBe(p1.contact.primaryContatctId);
    expect(p3.contact.emails).toEqual(['first@bitespeed.com', 'second@bitespeed.com']);
    expect(p3.contact.phoneNumbers).toEqual(['111', '222']);
    expect(p3.contact.secondaryContactIds).toContain(p2.contact.primaryContatctId);
  });

  it('D) Repeat request no new info -> no new row', async () => {
    const p1 = await reconcile({ email: 'repeat@test.com', phoneNumber: '999' });
    const p2 = await reconcile({ email: 'repeat@test.com', phoneNumber: '999' });
    
    expect(p1).toEqual(p2);
    const countResult = await knex('contacts').count('* as count').first();
    expect(parseInt(countResult.count, 10)).toBe(1);
  });

  it('E) Email-only and phone-only produce same consolidated response', async () => {
    await reconcile({ email: 'only@test.com', phoneNumber: '666' });
    
    const rEmail = await reconcile({ email: 'only@test.com' });
    const rPhone = await reconcile({ phoneNumber: '666' });
    
    expect(rEmail).toEqual(rPhone);
  });
});
