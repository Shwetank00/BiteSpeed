# Bitespeed Backend Task: Identity Reconciliation

This repository contains the backend service for identifying and reconciling customer contact data (Email & Phone Numbers) based on a Postgres database. Built using Node.js, Express, and Knex.js.

## Requirements
- Node.js (v18+ recommended)
- PostgreSQL
- Docker & Docker Compose (optional for local deployment)

## Local Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```
2. **Setup environment variables**
   Rename `.env.example` to `.env` and fill the variables:
   ```env
   DATABASE_URL=postgres://bitespeed:password@localhost:5432/bitespeed_identity
   PORT=3000
   NODE_ENV=development
   ```
3. **Run database locally via Docker**
   ```bash
   docker-compose up -d db
   ```
4. **Run Migrations**
   ```bash
   npm run migrate
   ```
5. **Start the server**
   ```bash
   npm run dev
   # or
   npm start
   ```

## Example `cURL` Requests
Create/identify a user (returns a consolidated component):
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu", "phoneNumber": "123456"}'
```

Returns:
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

## Running Tests
To run the automated unit and integration tests, use the following command:
```bash
npm test
```

## Reconciliation Algorithm & Edge Cases

When the endpoint `/identify` receives a request payload:
1. **Initial matches**: We look up all contacts with the given `email` or `phoneNumber`.
2. **New Entry**: If no contacts exist, we create a new `primary` contact and return it.
3. **Expansion Strategy**: If there are matches, we extract all known elements (either from the query or from the found rows), and use an iterative BFS-like expansion `SELECT` loop. We query by IDs, linked IDs, and known emails/phones until no new rows are brought into our identity "component". This properly aggregates distinct accounts that should be linked.
4. **Primary Selection**: The oldest (`created_at` ASC, then `id` ASC) contact is selected as the "True Primary".
5. **Merging**: If multiple `primary` rows exist in the connected subset, the newer ones are demoted to `secondary`, referencing the True Primary in `linked_id`. All rows referencing the demoted primaries are also updated to reference the True Primary.
6. **Secondary Creation**: If the provided `email` or `phoneNumber` represents *new* information not currently existing in the component network, a new `secondary` contact is appended directly to the True Primary.
7. **Consolidation**: A consolidated `{ contact: { ... }}` payload is aggregated, maintaining chronological uniqueness, with the True Primary's emails and phoneNumbers guaranteed to be at the zero-index respectively.

## Render Deployment Instructions

### Environment Variables
Configure the following in the Render settings pane on an _Express_ or _Web Service_:
- `DATABASE_URL` (Internal or External Postgres connection string).
- `PORT` (e.g. 3000).
- `NODE_ENV` = `production`.

### Build & Start Commands
- **Build Command**: `npm install && npm run migrate` (This ensures migrations run before spinning up).
- **Start Command**: `npm start` (Which runs `node src/server.js`).

### Postgres on Render
Create a Postgres instance on Render. Ensure the connection string translates directly into your backend's Environment variables. In `production`, connections leverage Knex with `pg` directly via the URL spec.
