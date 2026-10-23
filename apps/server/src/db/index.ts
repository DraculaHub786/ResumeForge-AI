/**
 * Database connection.
 *
 * The ORM schema in `schema.ts` is written against SQLite's dialect, which is
 * the zero-config default for local development. For production, point
 * `DATABASE_URL` at a PostgreSQL instance and swap the table definitions for
 * the `pg-core` equivalents (see `schema.pg.ts` for the reference mapping).
 *
 * The rest of the server only ever talks to the database through the helpers
 * exported here, so the driver is a single, swappable seam.
 */

import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';
import { env } from '../config/index.js';

type Database = ReturnType<typeof drizzleLibsql>;

let dbInstance: Database | null = null;

export function getDb(): Database {
  if (dbInstance) return dbInstance;

  const url = env.DATABASE_URL;

  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    throw new Error(
      'PostgreSQL requires the postgres dialect. Update `src/db/schema.ts` to use ' +
        'drizzle-orm/pg-core and switch `getDb()` to drizzle-orm/postgres-js. ' +
        'The SQLite schema is the supported default for this build.'
    );
  }

  const client = createClient({ url });
  dbInstance = drizzleLibsql(client, { schema });
  return dbInstance;
}

export { schema };
export * from './schema.js';
