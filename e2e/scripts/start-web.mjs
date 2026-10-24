#!/usr/bin/env node
/**
 * Builds and starts the Next.js app for the end-to-end suite.
 *
 * The suite runs against a production build — not `next dev` — so the tests
 * exercise the same bundle that ships to production. `NEXT_PUBLIC_API_URL` is
 * inlined at build time, so the build has to happen with the API URL of the
 * e2e server in scope.
 */

import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const webDir = path.join(root, 'apps', 'web');

const API_PORT = process.env.E2E_API_PORT ?? '5001';
const WEB_PORT = process.env.E2E_WEB_PORT ?? '3100';

const isWindows = process.platform === 'win32';

const env = {
  ...process.env,
  NODE_ENV: 'production',
  NEXT_PUBLIC_API_URL: `http://localhost:${API_PORT}`,
  NEXT_PUBLIC_BASE_URL: `http://localhost:${WEB_PORT}`,
};

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nextBin = require.resolve('next/dist/bin/next', { paths: [webDir] });

import fs from 'node:fs';

const targetMarker = path.join(webDir, '.next', 'e2e-built-api-url.txt');
let currentBuiltTarget = null;
if (fs.existsSync(targetMarker)) {
  try {
    currentBuiltTarget = fs.readFileSync(targetMarker, 'utf8').trim();
  } catch {}
}

const hasBuild =
  fs.existsSync(path.join(webDir, '.next', 'BUILD_ID')) &&
  currentBuiltTarget === env.NEXT_PUBLIC_API_URL;

if (!hasBuild && process.env.E2E_SKIP_BUILD !== '1') {
  console.log(`[e2e] Building the web app for API at ${env.NEXT_PUBLIC_API_URL}…`);
  const build = spawnSync(isWindows ? 'pnpm.cmd' : 'pnpm', ['--filter=@resume-builder/web', 'build'], {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: isWindows,
  });
  if (build.status !== 0) {
    console.error('[e2e] Web build failed.');
    process.exit(build.status ?? 1);
  }
  try {
    fs.writeFileSync(targetMarker, env.NEXT_PUBLIC_API_URL, 'utf8');
  } catch {}
}

console.log(`[e2e] Web app starting on http://localhost:${WEB_PORT}`);

const web = spawn(isWindows ? 'pnpm.cmd' : 'pnpm', ['exec', 'next', 'start', '--port', String(WEB_PORT)], {
  cwd: webDir,
  env,
  stdio: 'inherit',
  shell: isWindows,
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => web.kill('SIGTERM'));
}

web.on('exit', (code, signal) => {
  process.exit(signal ? 1 : (code ?? 0));
});
