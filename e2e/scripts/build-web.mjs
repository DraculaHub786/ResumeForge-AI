#!/usr/bin/env node
/**
 * Standalone build script for the end-to-end web client.
 *
 * Runs before Playwright starts its web servers so that:
 * 1. Webpack build runs in a clean, dedicated process without Playwright stdio pipes.
 * 2. Next.js inlines the test API server port (5001) into client-side bundles.
 * 3. Playwright test execution starts immediately without build-time timeouts.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const webDir = path.join(root, 'apps', 'web');

const API_PORT = process.env.E2E_API_PORT ?? '5001';
const WEB_PORT = process.env.E2E_WEB_PORT ?? '3100';

const env = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}`,
  NEXT_PUBLIC_BASE_URL: `http://localhost:${WEB_PORT}`,
};

import fs from 'node:fs';

const isWindows = process.platform === 'win32';

console.log(`[e2e] Cleaning and building web app (API: http://localhost:${API_PORT}, Web: http://localhost:${WEB_PORT})…`);

try {
  fs.rmSync(path.join(webDir, '.next'), { recursive: true, force: true });
} catch {
  /* best effort */
}

const build = spawnSync(isWindows ? 'pnpm.cmd' : 'pnpm', ['--filter=@resume-builder/web', 'build'], {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: isWindows,
});

if (build.status !== 0) {
  console.error('[e2e] Web build failed with exit code', build.status);
  process.exit(build.status ?? 1);
}

try {
  fs.writeFileSync(path.join(webDir, '.next', 'e2e-built-api-url.txt'), env.NEXT_PUBLIC_API_URL, 'utf8');
} catch {}

console.log('[e2e] Web build completed successfully.');
