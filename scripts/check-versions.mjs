/**
 * Version consistency check.
 *
 * The monorepo ships as one product: `@resume-builder/types` is the shared
 * wire contract, and the server and the web app both compile against it. If
 * one package is released at a different version than the rest, a consumer
 * can end up with a server that speaks a contract its client does not know.
 *
 * So all workspace packages are **fixed** in `.changeset/config.json` and must
 * always carry the same version. This script fails the build when they drift.
 *
 * Usage:  node scripts/check-versions.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const WORKSPACE_DIRS = ['packages', 'apps'];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** Every workspace package manifest. */
function collectPackages() {
  const packages = [];
  for (const dir of WORKSPACE_DIRS) {
    const base = path.join(ROOT, dir);
    if (!fs.existsSync(base)) continue;
    for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const manifest = path.join(base, entry.name, 'package.json');
      if (!fs.existsSync(manifest)) continue;
      const pkg = readJson(manifest);
      if (!pkg.name) continue;
      packages.push({ name: pkg.name, version: pkg.version, dir: path.join(dir, entry.name) });
    }
  }
  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

const packages = collectPackages();
const problems = [];

if (packages.length === 0) {
  problems.push('No workspace packages were found.');
}

const versions = new Set(packages.map((p) => p.version));
if (versions.size > 1) {
  problems.push(
    `Workspace packages do not share a single version:\n` +
      packages.map((p) => `    ${p.name}@${p.version}`).join('\n')
  );
}

// Every package must be listed in the `fixed` group of the changeset config,
// otherwise `changeset version` will bump them independently.
const changesetConfigPath = path.join(ROOT, '.changeset', 'config.json');
if (!fs.existsSync(changesetConfigPath)) {
  problems.push('.changeset/config.json is missing — run `pnpm changeset init`.');
} else {
  const config = readJson(changesetConfigPath);
  const fixed = (config.fixed ?? []).flat();
  const missing = packages.map((p) => p.name).filter((name) => !fixed.includes(name));
  if (missing.length > 0) {
    problems.push(
      `These packages are not in the "fixed" group of .changeset/config.json:\n` +
        missing.map((name) => `    ${name}`).join('\n')
    );
  }
}

// The root manifest is not published, but its version is what `pnpm changeset`
// bumps for the workspace — keep it in step.
const rootPkg = readJson(path.join(ROOT, 'package.json'));
if (versions.size === 1) {
  const workspaceVersion = [...versions][0];
  if (rootPkg.version !== workspaceVersion) {
    problems.push(
      `The root package.json is at ${rootPkg.version} but the workspace packages are at ${workspaceVersion}.`
    );
  }
}

if (problems.length > 0) {
  console.error('\nVersion check failed:\n');
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error('');
  process.exit(1);
}

console.log(
  `Version check passed — ${packages.length} workspace packages are all at ${[...versions][0]}.`
);
