require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './src/db/migrations'
    }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './src/db/migrations'
    }
  },
  test: {
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgres://bitespeed:password@localhost:5432/bitespeed_identity',
    migrations: {
      directory: './src/db/migrations'
    }
  }
};
