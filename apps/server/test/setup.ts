/**
 * Test bootstrap.
 *
 * Every server test runs against its own SQLite file so the development
 * database is never touched. The schema is created from the same DDL the
 * Drizzle schema describes, and it is rebuilt before each test so the suite
 * is order-independent.
 */

import { fileURLToPath } from 'node:url';
import { createClient } from '@libsql/client';

/**
 * The database lives next to the server package.
 *
 * libsql only understands `file:` URLs, and a Windows path has to be written
 * with forward slashes — a backslash is swallowed as an escape character and
 * the client ends up opening a file with the separators removed.
 *
 * Each Vitest worker gets its own file: test files run in parallel, and two
 * processes dropping the same tables at the same time would deadlock SQLite.
 */
const WORKER_ID = process.env.VITEST_WORKER_ID ?? '0';
const TEST_DB_PATH = fileURLToPath(
  new URL(`../test.${WORKER_ID}.db`, import.meta.url)
).replace(/\\/g, '/');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

// Set before any module reads the environment — `src/config/index.ts` and
// `src/db/index.ts` both capture `process.env` at import time.
process.env.DATABASE_URL = TEST_DB_URL;
process.env.NODE_ENV = 'test';
process.env.BETTER_AUTH_SECRET = 'test-secret-not-used-in-production';
process.env.BETTER_AUTH_URL = 'http://localhost:5000';
process.env.OPENROUTER_API_KEY = '';
process.env.GROQ_API_KEY = '';

const DDL = [
  'DROP TABLE IF EXISTS resumes',
  'DROP TABLE IF EXISTS verifications',
  'DROP TABLE IF EXISTS accounts',
  'DROP TABLE IF EXISTS sessions',
  'DROP TABLE IF EXISTS users',
  `CREATE TABLE users (
     id             text PRIMARY KEY NOT NULL,
     name           text,
     email          text NOT NULL UNIQUE,
     email_verified integer DEFAULT 0,
     image          text,
     created_at     integer NOT NULL,
     updated_at     integer NOT NULL
   )`,
  `CREATE TABLE sessions (
     id         text PRIMARY KEY NOT NULL,
     expires_at integer NOT NULL,
     token      text NOT NULL UNIQUE,
     created_at integer NOT NULL,
     updated_at integer NOT NULL,
     ip_address text,
     user_agent text,
     user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE
   )`,
  `CREATE TABLE accounts (
     id                       text PRIMARY KEY NOT NULL,
     account_id               text NOT NULL,
     provider_id              text NOT NULL,
     user_id                  text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     access_token             text,
     refresh_token            text,
     id_token                 text,
     access_token_expires_at  integer,
     refresh_token_expires_at integer,
     scope                    text,
     password                 text,
     created_at               integer NOT NULL,
     updated_at               integer NOT NULL
   )`,
  `CREATE TABLE verifications (
     id         text PRIMARY KEY NOT NULL,
     identifier text NOT NULL,
     value      text NOT NULL,
     expires_at integer NOT NULL,
     created_at integer NOT NULL,
     updated_at integer NOT NULL
   )`,
  `CREATE TABLE resumes (
     id         text PRIMARY KEY NOT NULL,
     user_id    text REFERENCES users(id) ON DELETE CASCADE,
     title      text NOT NULL,
     slug       text NOT NULL,
     metadata   text NOT NULL,
     content    text NOT NULL,
     created_at integer NOT NULL,
     updated_at integer NOT NULL
   )`,
  'CREATE UNIQUE INDEX resumes_slug_unique ON resumes(slug)',
];

const client = createClient({ url: TEST_DB_URL });

/** Rebuild the schema so every test starts from a known state. */
export async function resetDatabase(): Promise<void> {
  // The local driver executes one statement per call, so the DDL is applied
  // statement by statement.
  for (const statement of DDL) {
    await client.execute(statement);
  }
}

export { TEST_DB_PATH, TEST_DB_URL };
