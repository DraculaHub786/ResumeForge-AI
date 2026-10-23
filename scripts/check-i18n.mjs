/**
 * Translation catalogue check.
 *
 * Every locale must expose exactly the same message keys as the English
 * catalogue, and every ICU placeholder must survive translation. A missing
 * key renders as an error in the UI, and a dropped placeholder renders as
 * "{title}" in a button label — both are silent until a user hits them.
 *
 * Usage:  node scripts/check-i18n.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MESSAGES_DIR = path.join(ROOT, 'apps', 'web', 'src', 'i18n', 'messages');
const SOURCE = 'en.json';

/** Flatten a nested catalogue into `a.b.c` → value. */
function flatten(node, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(node)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, full, out);
    } else {
      out[full] = value;
    }
  }
  return out;
}

/** The ICU placeholders used in a message: `{name}`. */
function placeholders(value) {
  return new Set(String(value).match(/\{(\w+)\}/g) ?? []);
}

function readCatalogue(file) {
  return JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, file), 'utf8'));
}

if (!fs.existsSync(path.join(MESSAGES_DIR, SOURCE))) {
  console.error(`Missing ${SOURCE} in ${MESSAGES_DIR}`);
  process.exit(1);
}

const source = flatten(readCatalogue(SOURCE));
const sourceKeys = Object.keys(source);
const problems = [];

const localeFiles = fs
  .readdirSync(MESSAGES_DIR)
  .filter((file) => file.endsWith('.json') && file !== SOURCE)
  .sort();

if (localeFiles.length === 0) {
  problems.push('No translation catalogues were found.');
}

for (const file of localeFiles) {
  const locale = path.basename(file, '.json');
  const target = flatten(readCatalogue(file));
  const targetKeys = Object.keys(target);

  const missing = sourceKeys.filter((key) => !(key in target));
  const extra = targetKeys.filter((key) => !(key in source));

  if (missing.length > 0) {
    problems.push(
      `${locale}: missing ${missing.length} key(s):\n` +
        missing.map((key) => `      ${key}`).join('\n')
    );
  }
  if (extra.length > 0) {
    problems.push(
      `${locale}: ${extra.length} key(s) that do not exist in ${SOURCE}:\n` +
        extra.map((key) => `      ${key}`).join('\n')
    );
  }

  // Placeholders must match one-for-one on both sides.
  for (const key of sourceKeys) {
    if (!(key in target)) continue;
    const expected = placeholders(source[key]);
    const actual = placeholders(target[key]);
    if (expected.size !== actual.size || [...expected].some((p) => !actual.has(p))) {
      problems.push(
        `${locale}: placeholder mismatch at "${key}" — ` +
          `expected {${[...expected].join('}{')}}, found {${[...actual].join('}{')}}`
      );
    }
  }

  // An empty translation is worse than a missing one: it renders as a blank.
  for (const key of sourceKeys) {
    if (key in target && typeof target[key] === 'string' && target[key].trim() === '') {
      problems.push(`${locale}: "${key}" is empty.`);
    }
  }
}

if (problems.length > 0) {
  console.error('\nTranslation check failed:\n');
  for (const problem of problems) console.error(`  - ${problem}`);
  console.error('');
  process.exit(1);
}

console.log(
  `Translation check passed — ${localeFiles.length} locale(s), ${sourceKeys.length} messages each.`
);
