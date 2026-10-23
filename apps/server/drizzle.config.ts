import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit configuration.
 *
 * `pnpm --filter=@resume-builder/server db:push` reads this file to sync the
 * SQLite schema in `src/db/schema.ts` into the database at `DATABASE_URL`.
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  },
});
