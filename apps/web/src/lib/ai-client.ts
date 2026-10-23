/**
 * Client-side AI helpers.
 *
 * Thin wrappers over the backend AI endpoints with graceful degradation: if
 * the server is unreachable, a local rule-based enhancer is used so the
 * feature still works in an offline / demo environment.
 */

import { runLocalAtsCheck } from '@resume-builder/ai/ats';
import type { AtsCheckResult } from '@resume-builder/types';

import { API_URL as BASE_URL } from './env';

export interface EnhanceArgs {
  sectionId: string;
  content: string;
  targetJobTitle?: string;
  targetJobDescription?: string;
}

export interface EnhanceResult {
  enhanced: string;
  /** True when the result came from the local fallback rather than the API. */
  fallback?: boolean;
}

const ACTION_VERBS = [
  'Led', 'Developed', 'Implemented', 'Designed', 'Built', 'Managed',
  'Created', 'Improved', 'Reduced', 'Increased', 'Coordinated',
  'Executed', 'Optimized', 'Spearheaded', 'Automated',
];

/**
 * Local, deterministic enhancer. Used when the AI backend is unavailable so
 * the "AI Enhance" button always does something useful.
 */
export function localEnhance(content: string): string {
  if (!content.trim()) return content;

  return content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      let enhanced = line;
      if (enhanced[0] === enhanced[0].toLowerCase()) {
        enhanced = enhanced[0].toUpperCase() + enhanced.slice(1);
      }
      if (!/[.!?]$/.test(enhanced)) enhanced += '.';
      const startsWithVerb = ACTION_VERBS.some((v) => enhanced.startsWith(v));
      if (!startsWithVerb && !/^\d/.test(enhanced)) {
        enhanced = `Contributed to ${enhanced[0].toLowerCase()}${enhanced.slice(1)}`;
      }
      return enhanced;
    })
    .join('\n');
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/v1/ai/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`AI request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Enhance a section's content. Falls back to the local enhancer on failure. */
export async function aiEnhance(args: EnhanceArgs): Promise<EnhanceResult> {
  try {
    const result = await post<{ enhanced: string }>('enhance', args);
    if (result?.enhanced) return { enhanced: result.enhanced };
    throw new Error('Empty response');
  } catch {
    return { enhanced: localEnhance(args.content), fallback: true };
  }
}

/** Rewrite the professional summary. */
export async function aiRewriteSummary(
  content: string,
  targetJobTitle?: string
): Promise<EnhanceResult> {
  try {
    const result = await post<{ enhanced: string }>('rewrite-summary', { content, targetJobTitle });
    if (result?.enhanced) return { enhanced: result.enhanced };
    throw new Error('Empty response');
  } catch {
    return { enhanced: localEnhance(content), fallback: true };
  }
}

/** Generate achievement bullets for a role. */
export async function aiGenerateAchievements(
  jobTitle: string,
  targetJobTitle?: string
): Promise<EnhanceResult> {
  try {
    const result = await post<{ enhanced: string }>('achievement-generator', {
      content: jobTitle,
      targetJobTitle,
    });
    if (result?.enhanced) return { enhanced: result.enhanced };
    throw new Error('Empty response');
  } catch {
    return {
      enhanced: `Contributed to ${jobTitle} delivery across the team.`,
      fallback: true,
    };
  }
}

export type { AtsCheckResult };

/** Analyse the resume for ATS compatibility. */
export async function aiAtsCheck(
  content: string,
  targetJobDescription?: string
): Promise<AtsCheckResult> {
  try {
    return await post<AtsCheckResult>('ats-check', { content, targetJobDescription });
  } catch {
    // Server unreachable — run the same deterministic analysis locally so the
    // user still gets concrete feedback instead of an error.
    return runLocalAtsCheck(content, { targetJobDescription });
  }
}
