/**
 * Production smoke test.
 *
 * Builds nothing — it assumes `pnpm build` has already run — but it does
 * exercise the *built* artefacts the way production does:
 *
 *   1. creates a throwaway SQLite database from the Drizzle schema
 *   2. boots the compiled API server (`apps/server/dist/index.js`)
 *   3. signs up over the real auth endpoints, then creates, reads, updates
 *      and deletes a resume
 *   4. exports LaTeX over HTTP and a PDF through the server-side writer
 *   5. boots the compiled Next app and checks the public routes
 *
 * Nothing here touches the development database or spends a cent on AI: the
 * OpenRouter key is deliberately blank.
 *
 * Usage:  node scripts/smoke.mjs [--skip-web]
 */

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API_PORT = Number(process.env.SMOKE_API_PORT ?? 5099);
const WEB_PORT = Number(process.env.SMOKE_WEB_PORT ?? 3099);
const API_URL = `http://127.0.0.1:${API_PORT}`;
const WEB_URL = `http://127.0.0.1:${WEB_PORT}`;
const SKIP_WEB = process.argv.includes('--skip-web');

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resumeforge-smoke-'));
const dbFile = path.join(workDir, 'smoke.db');

/**
 * libsql only understands `file:` URLs, and a Windows path has to be written
 * with forward slashes — a backslash is swallowed as an escape character and
 * the client ends up opening a different file than the one that was pushed.
 */
const dbUrl = `file:${dbFile.replace(/\\/g, '/')}`;

const children = [];
let failures = 0;
let checks = 0;

// ---------------------------------------------------------------------------
// Tiny assertion helpers
// ---------------------------------------------------------------------------

function ok(label, condition, detail) {
  checks += 1;
  if (condition) {
    console.log(`  [32m✓[0m ${label}`);
  } else {
    failures += 1;
    console.log(`  [31m✗[0m ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title) {
  console.log(`\n[1m${title}[0m`);
}

function fatal(message) {
  console.error(`\n[31mSmoke test aborted:[0m ${message}`);
  cleanup();
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Process helpers
// ---------------------------------------------------------------------------

/**
 * Windows shells split a command line on whitespace, so an argument that
 * contains a space has to be quoted before it is handed to `cmd.exe`. The
 * repository path itself contains a space ("resume builder"), which is
 * exactly what breaks the spawned server entry point.
 */
function quoteArgs(args) {
  return args.map((arg) =>
    /\s/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg
  );
}

function run(command, args, options = {}) {
  const useShell = process.platform === 'win32';
  const result = spawnSync(command, useShell ? quoteArgs(args) : args, {
    cwd: options.cwd ?? ROOT,
    encoding: 'utf8',
    shell: useShell,
    env: { ...process.env, ...options.env },
    stdio: options.stdio ?? 'pipe',
  });
  if (result.status !== 0 && !options.allowFailure) {
    fatal(
      `\`${command} ${args.join(' ')}\` failed (exit ${result.status})\n` +
        `${result.stdout ?? ''}\n${result.stderr ?? ''}`
    );
  }
  return result;
}

function start(command, args, options = {}) {
  const useShell = process.platform === 'win32';
  const child = spawn(command, useShell ? quoteArgs(args) : args, {
    cwd: options.cwd ?? ROOT,
    shell: useShell,
    env: { ...process.env, ...options.env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => {
    if (process.env.SMOKE_VERBOSE) process.stdout.write(`[${options.name}] ${chunk}`);
  });
  child.stderr.on('data', (chunk) => {
    if (process.env.SMOKE_VERBOSE) process.stderr.write(`[${options.name}] ${chunk}`);
  });
  children.push(child);
  return child;
}

function cleanup() {
  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      /* already gone */
    }
  }
  try {
    fs.rmSync(workDir, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
}

process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(130);
});

async function waitFor(url, { timeoutMs = 60_000, label = url } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'no response';
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  fatal(`${label} did not become ready within ${timeoutMs}ms (${lastError})`);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const resumeContent = {
  profile: {
    fullName: 'Grace Hopper',
    headline: 'Compiler Engineer',
    email: 'grace@example.com',
    phone: '+1 555 0100',
    location: 'New York, NY',
    about: 'Compiler pioneer with 40 years of experience.',
    links: [{ id: 'link_1', label: 'GitHub', url: 'https://github.com/example' }],
  },
  summary: 'Compiler pioneer with 40 years of experience.',
  experience: [
    {
      id: 'exp_1',
      position: 'Staff Engineer',
      company: 'Acme Corp',
      period: { start: '2020-01', current: true },
      highlights: ['Cut infrastructure costs by 30%.', 'Shipped the platform.'],
    },
  ],
  education: [
    {
      id: 'edu_1',
      degree: 'MSc',
      institution: 'Yale University',
      period: { start: '1928-01', end: '1930-01' },
    },
  ],
  skills: [{ id: 'sk_1', name: 'Languages', skills: ['COBOL', 'Fortran'] }],
  projects: [],
  achievements: [],
  certifications: [],
  publications: [],
  languages: [],
  volunteer: [],
  interests: [],
  customSections: [],
};

// ---------------------------------------------------------------------------
// 1. API smoke test
// ---------------------------------------------------------------------------

async function smokeApi() {
  section('1. Database');

  const serverDir = path.join(ROOT, 'apps', 'server');
  run('pnpm', ['exec', 'drizzle-kit', 'push', '--force'], {
    cwd: serverDir,
    env: { DATABASE_URL: dbUrl },
  });
  ok('schema pushed to a throwaway database', fs.existsSync(dbFile));

  section('2. API server');

  const apiEnv = {
    NODE_ENV: 'production',
    PORT: String(API_PORT),
    DATABASE_URL: dbUrl,
    BETTER_AUTH_SECRET: 'smoke-test-secret-not-for-production',
    BETTER_AUTH_URL: API_URL,
    FRONTEND_URL: WEB_URL,
    CORS_ORIGIN: WEB_URL,
    TRUSTED_ORIGINS: WEB_URL,
    // Deliberately blank: the smoke test must never call a paid model.
    OPENROUTER_API_KEY: '',
    LOG_LEVEL: 'error',
  };

  const serverEntry = path.join(serverDir, 'dist', 'index.js');
  if (!fs.existsSync(serverEntry)) {
    fatal(`${serverEntry} is missing — run \`pnpm build\` first.`);
  }
  start('node', [serverEntry], { cwd: serverDir, env: apiEnv, name: 'api' });

  const health = await waitFor(`${API_URL}/api/v1/health`, { label: 'API server' });
  const healthBody = await health.json();
  ok('GET /api/v1/health returns ok', healthBody.status === 'ok', JSON.stringify(healthBody));

  section('3. Authentication');

  const email = `smoke-${Date.now()}@example.com`;
  const signUp = await fetch(`${API_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: WEB_URL },
    body: JSON.stringify({ name: 'Smoke Test', email, password: 'correct-horse-battery' }),
  });
  ok('POST /api/auth/sign-up/email succeeds', signUp.ok, `HTTP ${signUp.status}`);

  const setCookie = signUp.headers.get('set-cookie') ?? '';
  const cookie = setCookie.split(';')[0];
  ok('sign-up returns a session cookie', cookie.length > 0);

  const authHeaders = { 'content-type': 'application/json', cookie, origin: WEB_URL };

  section('4. Resume CRUD');

  const created = await fetch(`${API_URL}/api/v1/resumes`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      title: 'Smoke Test Resume',
      metadata: { template: 'ats-classic' },
      content: resumeContent,
    }),
  });
  ok('POST /api/v1/resumes returns 201', created.status === 201, `HTTP ${created.status}`);
  const resume = await created.json();
  ok('created resume has an id', typeof resume.id === 'string' && resume.id.length > 0);
  ok('created resume has a slug', typeof resume.slug === 'string' && resume.slug.length > 0);

  const listed = await fetch(`${API_URL}/api/v1/resumes`, { headers: authHeaders });
  const listBody = await listed.json();
  ok(
    'GET /api/v1/resumes lists the new resume',
    Array.isArray(listBody.items) && listBody.items.some((item) => item.id === resume.id)
  );

  const fetched = await fetch(`${API_URL}/api/v1/resumes/${resume.id}`, { headers: authHeaders });
  const fetchedBody = await fetched.json();
  ok(
    'GET /api/v1/resumes/:id returns the resume',
    fetched.ok && fetchedBody.content?.profile?.fullName === 'Grace Hopper'
  );

  const patched = await fetch(`${API_URL}/api/v1/resumes/${resume.id}`, {
    method: 'PATCH',
    headers: authHeaders,
    body: JSON.stringify({
      content: { ...resumeContent, summary: 'Updated by the smoke test.' },
    }),
  });
  const patchedBody = await patched.json();
  ok(
    'PATCH /api/v1/resumes/:id persists the change',
    patched.ok && patchedBody.content?.summary === 'Updated by the smoke test.'
  );

  section('5. Exports');

  const latex = await fetch(`${API_URL}/api/v1/export/latex`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ content: resumeContent }),
  });
  const latexText = await latex.text();
  ok('POST /api/v1/export/latex returns 200', latex.ok, `HTTP ${latex.status}`);
  ok('LaTeX output contains a document preamble', latexText.includes('\\documentclass'));
  ok('LaTeX output contains the candidate name', latexText.includes('Grace Hopper'));

  const pdfEntry = path.join(ROOT, 'packages', 'pdf', 'dist', 'server.js');
  if (!fs.existsSync(pdfEntry)) {
    fatal(`${pdfEntry} is missing — run \`pnpm build\` first.`);
  }
  const { resumeToPdf } = await import(`file://${pdfEntry.replace(/\\/g, '/')}`);
  const pdfBytes = await resumeToPdf(resumeContent);
  const pdfHead = Buffer.from(pdfBytes.slice(0, 5)).toString('latin1');
  ok('server-side PDF is a real PDF', pdfHead === '%PDF-', pdfHead);
  ok('server-side PDF is not empty', pdfBytes.length > 1000, `${pdfBytes.length} bytes`);

  section('6. AI endpoints (no key configured)');

  const ats = await fetch(`${API_URL}/api/v1/ai/ats-check`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      content: 'Led a team of 5 engineers. Cut costs by 30%. Shipped the platform.',
    }),
  });
  const atsBody = await ats.json();
  ok(
    'POST /api/v1/ai/ats-check degrades to the deterministic analyser',
    ats.ok && typeof atsBody.score === 'number' && Array.isArray(atsBody.issues)
  );

  section('7. Deletion');

  const removed = await fetch(`${API_URL}/api/v1/resumes/${resume.id}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  ok('DELETE /api/v1/resumes/:id returns 204', removed.status === 204, `HTTP ${removed.status}`);

  const gone = await fetch(`${API_URL}/api/v1/resumes/${resume.id}`, { headers: authHeaders });
  ok('the deleted resume is no longer readable', gone.status === 404, `HTTP ${gone.status}`);
}

// ---------------------------------------------------------------------------
// 2. Web smoke test
// ---------------------------------------------------------------------------

async function smokeWeb() {
  section('8. Web app');

  const webDir = path.join(ROOT, 'apps', 'web');
  const serverEntry = path.join(webDir, '.next', 'standalone', 'apps', 'web', 'server.js');
  const fallbackEntry = path.join(webDir, '.next', 'server.js');

  const entry = fs.existsSync(serverEntry) ? serverEntry : fallbackEntry;
  if (!fs.existsSync(entry)) {
    fatal(`${fallbackEntry} is missing — run \`pnpm build\` first.`);
  }

  start('node', [entry], {
    cwd: webDir,
    env: {
      NODE_ENV: 'production',
      PORT: String(WEB_PORT),
      HOSTNAME: '127.0.0.1',
      NEXT_PUBLIC_API_URL: API_URL,
      NEXT_PUBLIC_BASE_URL: WEB_URL,
    },
    name: 'web',
  });

  await waitFor(`${WEB_URL}/auth/login`, { label: 'web app' });

  const home = await fetch(`${WEB_URL}/`, { redirect: 'manual' });
  ok('GET / responds', home.status === 200, `HTTP ${home.status}`);

  const login = await fetch(`${WEB_URL}/auth/login`);
  const loginHtml = await login.text();
  ok('GET /auth/login responds', login.ok, `HTTP ${login.status}`);
  ok('the sign-in page renders its copy', loginHtml.includes('Welcome back'));

  const localised = await fetch(`${WEB_URL}/auth/login`, {
    headers: { cookie: 'locale=fr' },
  });
  const localisedHtml = await localised.text();
  ok(
    'the locale cookie switches the rendered language',
    localisedHtml.includes('Bon retour'),
    'expected the French copy'
  );

  const sitemap = await fetch(`${WEB_URL}/sitemap.xml`);
  const sitemapXml = await sitemap.text();
  ok('GET /sitemap.xml responds', sitemap.ok, `HTTP ${sitemap.status}`);
  ok('the sitemap lists the home page', sitemapXml.includes('<urlset'));

  const robots = await fetch(`${WEB_URL}/robots.txt`);
  const robotsTxt = await robots.text();
  ok('GET /robots.txt responds', robots.ok, `HTTP ${robots.status}`);
  ok('the robots policy points at the sitemap', robotsTxt.includes('sitemap.xml'));

  const og = await fetch(`${WEB_URL}/opengraph-image`);
  ok('GET /opengraph-image responds', og.ok, `HTTP ${og.status}`);
}

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

console.log('[1mResumeForge AI — production smoke test[0m');
console.log(`workspace: ${ROOT}`);
console.log(`scratch:   ${workDir}`);

try {
  await smokeApi();
  if (!SKIP_WEB) {
    await smokeWeb();
  }
} catch (error) {
  fatal(error instanceof Error ? (error.stack ?? error.message) : String(error));
}

console.log(
  `\n${failures === 0 ? '[32m' : '[31m'}${checks - failures}/${checks} checks passed[0m`
);
cleanup();
process.exit(failures === 0 ? 0 : 1);
