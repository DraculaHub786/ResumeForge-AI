#!/usr/bin/env node
/**
 * Boots the API server for the end-to-end suite.
 *
 * The suite gets its own port and its own SQLite file, so a developer's
 * running dev server and dev database are never touched. The schema is
 * created from the Drizzle models on every run, which keeps the suite
 * deterministic and independent of local migrations.
 */

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const serverDir = path.join(root, 'apps', 'server');

const API_PORT = process.env.E2E_API_PORT ?? '5001';
const WEB_PORT = process.env.E2E_WEB_PORT ?? '3100';
const WEB_URL = `http://localhost:${WEB_PORT}`;

const isWindows = process.platform === 'win32';

const env = {
  ...process.env,
  // `development` keeps the session cookie non-secure so it can travel over
  // plain http on localhost.
  NODE_ENV: 'development',
  PORT: API_PORT,
  FRONTEND_URL: WEB_URL,
  DATABASE_URL: 'file:./e2e.db',
  BETTER_AUTH_SECRET:
    process.env.BETTER_AUTH_SECRET ?? 'e2e-only-secret-0123456789abcdefghijkl',
  BETTER_AUTH_URL: `http://localhost:${API_PORT}`,
  CORS_ORIGIN: `${WEB_URL},http://localhost:${API_PORT}`,
  // The suite must never call a paid model.
  OPENROUTER_API_KEY: '',
  LOG_LEVEL: 'warn',
};

// Start from a clean database on every run.
for (const file of ['e2e.db', 'e2e.db-journal', 'e2e.db-wal', 'e2e.db-shm']) {
  fs.rmSync(path.join(serverDir, file), { force: true });
}

// Create the schema from the Drizzle models.
const push = spawnSync('pnpm exec drizzle-kit push --force', {
  cwd: serverDir,
  env,
  stdio: 'inherit',
  shell: isWindows,
});

if (push.status !== 0) {
  console.error('[e2e] Failed to prepare the e2e database.');
  process.exit(push.status ?? 1);
}

console.log(`[e2e] API server starting on http://localhost:${API_PORT}`);

const server = spawn('pnpm exec tsx src/index.ts', {
  cwd: serverDir,
  env,
  stdio: 'inherit',
  shell: isWindows,
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill('SIGTERM'));
}

server.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0));
});
