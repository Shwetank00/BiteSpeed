exports.up = function(knex) {
  return knex.schema.createTable('contacts', (table) => {
    table.increments('id').primary();
    table.string('phone_number').nullable();
    table.string('email').nullable();
    table.integer('linked_id').nullable();
    table.string('link_precedence').notNullable().checkIn(['primary', 'secondary']);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true }).nullable();

    table.index(['email', 'phone_number', 'linked_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('contacts');
};
