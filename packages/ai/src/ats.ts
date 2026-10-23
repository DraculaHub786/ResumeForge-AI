/**
 * Deterministic ATS (Applicant Tracking System) analysis.
 *
 * This is the offline counterpart to the LLM-backed ATS check: it applies the
 * same rules an ATS parser cares about — structure, action verbs, quantified
 * impact, keyword coverage — without calling a provider. It is used when no
 * API key is configured, when the provider is unreachable, and as the final
 * fallback so the user always gets actionable feedback.
 *
 * The analysis is fully deterministic: the same resume always produces the
 * same score, which makes it testable and trustworthy.
 */

import type { AtsCheckResult } from '@resume-builder/types';

/** Strong action verbs that recruiters and ATS parsers look for. */
export const ACTION_VERBS = [
  'accelerated', 'achieved', 'architected', 'authored', 'automated', 'built',
  'coordinated', 'created', 'cut', 'delivered', 'deployed', 'designed',
  'developed', 'drove', 'eliminated', 'engineered', 'established', 'executed',
  'expanded', 'generated', 'grew', 'headed', 'implemented', 'improved',
  'increased', 'introduced', 'launched', 'led', 'managed', 'migrated',
  'negotiated', 'optimized', 'orchestrated', 'overhauled', 'pioneered',
  'reduced', 'refactored', 'resolved', 'restructured', 'scaled', 'shipped',
  'spearheaded', 'standardized', 'streamlined', 'trained', 'transformed',
];

/** Words that suggest the writer leaned on "I" instead of describing impact. */
const FIRST_PERSON = /\b(i|me|my|mine|myself|we|our|ours)\b/i;

/** Common filler that adds no information to a bullet. */
const FILLER_PHRASES = [
  'responsible for',
  'helped with',
  'worked on',
  'involved in',
  'part of a team',
  'duties included',
];

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE_RE = /(\+?\d[\d\s().-]{7,}\d)/;

export interface AtsCheckOptions {
  /** Target job description used to derive expected keywords. */
  targetJobDescription?: string;
  /** Explicit keyword list; overrides keyword extraction from the description. */
  targetKeywords?: string[];
}

/**
 * Extract candidate keywords from free text.
 *
 * Frequency-based, stop-word filtered, and biased toward multi-word and
 * capitalised terms — which is roughly how ATS keyword matching behaves.
 */
export function extractKeywords(text: string, limit = 15): string[] {
  if (!text.trim()) return [];

  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'for',
    'from', 'has', 'have', 'he', 'her', 'his', 'in', 'into', 'is', 'it', 'its',
    'of', 'on', 'or', 'our', 'that', 'the', 'their', 'them', 'they', 'this',
    'to', 'was', 'we', 'were', 'will', 'with', 'you', 'your', 'who', 'will',
    'would', 'should', 'could', 'about', 'across', 'all', 'also', 'any',
    'ability', 'work', 'working', 'experience', 'strong', 'excellent', 'good',
    'need', 'like', 'etc', 'must', 'well', 'new', 'one', 'two', 'role',
    'position', 'candidate', 'team', 'teams', 'job', 'company', 'years',
  ]);

  const counts = new Map<string, { count: number; firstIndex: number }>();
  const spellings = new Map<string, Map<string, number>>();

  const tokens = text.split(/[^A-Za-z0-9+#.]+/).filter(Boolean);

  for (let index = 0; index < tokens.length; index += 1) {
    // Trim trailing sentence punctuation so "experience." matches the
    // stop-word list and does not look like a distinct keyword. Internal dots
    // are preserved so "Node.js" survives intact.
    const word = tokens[index].replace(/\.+$/, '');
    if (word.length < 3) continue;
    if (stopWords.has(word.toLowerCase())) continue;
    if (/^\d+$/.test(word)) continue;

    const key = word.toLowerCase();
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { count: 1, firstIndex: index });
    }

    const variants = spellings.get(key) ?? new Map<string, number>();
    variants.set(word, (variants.get(word) ?? 0) + 1);
    spellings.set(key, variants);
  }

  // Rank by frequency, then by first appearance — so a keyword list reads in
  // the order the job description mentioned it.
  const ranked = [...counts.entries()].sort(
    ([, a], [, b]) => b.count - a.count || a.firstIndex - b.firstIndex
  );

  const out: string[] = [];
  for (const [key] of ranked) {
    out.push(preferredSpelling(spellings.get(key)!));
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Pick the nicest spelling of a keyword.
 *
 * ATS matching is case-insensitive, but the keyword is shown to the user, so
 * "TypeScript" beats "typescript" and "React" beats "REACT".
 */
function preferredSpelling(variants: Map<string, number>): string {
  let best = '';
  let bestScore = -1;
  let bestCount = -1;

  for (const [spelling, count] of variants) {
    const score = spellingScore(spelling);
    if (
      score > bestScore ||
      (score === bestScore && count > bestCount) ||
      (score === bestScore && count === bestCount && spelling < best)
    ) {
      best = spelling;
      bestScore = score;
      bestCount = count;
    }
  }
  return best;
}

/** Higher is nicer to display. */
function spellingScore(word: string): number {
  if (/^[A-Z][a-z0-9+#.]*$/.test(word)) return 4; // TypeScript, Kubernetes, Node.js
  if (/^[A-Z]{2,}$/.test(word)) return 3; // AWS, API, GPU
  if (/^[a-z0-9+#.]+$/.test(word)) return 1; // java, node.js
  return 2; // anything else
}

interface Check {
  /** Points deducted when the check fails. */
  weight: number;
  passed: boolean;
  issue?: string;
  suggestion?: string;
}

/**
 * Run the local ATS analysis over a resume's plain-text content.
 */
export function runLocalAtsCheck(content: string, options: AtsCheckOptions = {}): AtsCheckResult {
  const text = content ?? '';
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const bullets = lines.filter((l) => l.length > 20);
  const targetKeywords =
    options.targetKeywords?.length
      ? options.targetKeywords
      : extractKeywords(options.targetJobDescription ?? '');

  const lowerText = text.toLowerCase();
  const missingKeywords = targetKeywords.filter(
    (kw) => !lowerText.includes(kw.toLowerCase())
  );

  const startsWithVerb = bullets.filter((b) => {
    const first = b.split(/\s+/)[0]?.replace(/[^A-Za-z]/g, '').toLowerCase() ?? '';
    return ACTION_VERBS.includes(first);
  });
  const quantified = bullets.filter((b) => /\d/.test(b));
  const overlong = bullets.filter((b) => b.split(/\s+/).length > 32);
  const tooShort = bullets.filter((b) => b.split(/\s+/).length < 6);
  const withFiller = lines.filter((l) =>
    FILLER_PHRASES.some((phrase) => l.toLowerCase().includes(phrase))
  );
  const withFirstPerson = lines.filter((l) => FIRST_PERSON.test(l));

  const checks: Check[] = [
    {
      weight: 25,
      passed: bullets.length > 0,
      issue: 'No experience bullets were detected.',
      suggestion: 'Add bullet points describing what you did in each role.',
    },
    {
      weight: 15,
      passed: bullets.length === 0 || startsWithVerb.length / bullets.length >= 0.6,
      issue: 'Many bullets do not start with a strong action verb.',
      suggestion:
        'Start at least 60% of your bullets with verbs like Led, Built, Reduced, or Designed.',
    },
    {
      weight: 20,
      passed: bullets.length === 0 || quantified.length / bullets.length >= 0.5,
      issue: 'Bullets lack measurable results.',
      suggestion:
        'Add numbers, percentages, revenue, or time saved to at least half of your bullets.',
    },
    {
      weight: 10,
      passed: EMAIL_RE.test(text),
      issue: 'No email address found.',
      suggestion: 'Add a professional email address to your contact details.',
    },
    {
      weight: 10,
      passed: PHONE_RE.test(text),
      issue: 'No phone number found.',
      suggestion: 'Add a phone number so recruiters can reach you.',
    },
    {
      weight: 8,
      passed: withFirstPerson.length === 0,
      issue: 'Bullets use first-person pronouns.',
      suggestion: 'Rewrite "I led…" as "Led…" — ATS parsers prefer implied subjects.',
    },
    {
      weight: 6,
      passed: withFiller.length === 0,
      issue: 'Filler phrases dilute your impact.',
      suggestion:
        'Replace phrases like "responsible for" with the action you actually took.',
    },
    {
      weight: 6,
      passed: overlong.length === 0,
      issue: 'Some bullets are too long to be skimmed.',
      suggestion: 'Keep each bullet under 32 words — split long ones into two.',
    },
    {
      weight: 5,
      passed: tooShort.length === 0,
      issue: 'Some bullets are too short to show impact.',
      suggestion: 'Aim for 6+ words per bullet so the outcome is clear.',
    },
    {
      weight: 15,
      passed: targetKeywords.length === 0 || missingKeywords.length / targetKeywords.length <= 0.4,
      issue: 'Important job keywords are missing.',
      suggestion:
        'Mirror the wording from the job description in your summary and bullets.',
    },
  ];

  const failed = checks.filter((c) => !c.passed);
  const deducted = failed.reduce((sum, c) => sum + c.weight, 0);
  const score = Math.max(20, Math.min(100, 100 - deducted));

  return {
    score,
    issues: failed.map((c) => c.issue!).filter(Boolean),
    suggestions: failed.map((c) => c.suggestion!).filter(Boolean),
    missingKeywords,
  };
}
