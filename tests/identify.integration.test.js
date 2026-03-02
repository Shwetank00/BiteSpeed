const request = require('supertest');
const app = require('../src/app');
const knex = require('../src/db/knex');

describe('Identify Route Integration Tests', () => {
  beforeAll(async () => {
    await knex.migrate.latest();
  });

  beforeEach(async () => {
    await knex('contacts').del();
  });

  afterAll(async () => {
    await knex.destroy();
  });

  it('Returns 400 when missing both email and phone', async () => {
    const res = await request(app).post('/identify').send({});
    expect(res.statusCode).toEqual(400);
  });

  it('Creates primary on new request and returns 200', async () => {
    const res = await request(app).post('/identify').send({
      email: 'hello@world.com',
      phoneNumber: '12345'
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.contact.emails).toEqual(['hello@world.com']);
    expect(res.body.contact.phoneNumbers).toEqual(['12345']);
  });

  it('Links new info to existing primary', async () => {
    await request(app).post('/identify').send({
      email: 'lorraine@mcfly.com',
      phoneNumber: '123456'
    });
    
    const res = await request(app).post('/identify').send({
      email: 'mcfly@hillvalley.edu',
      phoneNumber: '123456'
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body.contact.emails).toEqual(['lorraine@mcfly.com', 'mcfly@hillvalley.edu']);
    expect(res.body.contact.secondaryContactIds.length).toBe(1);
  });
});
