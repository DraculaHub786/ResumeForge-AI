/**
 * AI enhancement service — wraps the OpenRouter SDK with prompt templates,
 * streaming responses, and a deterministic fallback.
 */

import { complete, AI_PROMPTS, runLocalAtsCheck } from '@resume-builder/ai';
import { z } from 'zod';

import type { AtsCheckResult } from '@resume-builder/types';

// Type guard for ATS-check response
const atsCheckSchema = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  missingKeywords: z.array(z.string()).default([]),
});

export type { AtsCheckResult };

export async function enhanceContent(
  ctx: {
    sectionId: string;
    content: string;
    targetJobTitle?: string;
    targetJobDescription?: string;
    language?: string;
  },
  config?: {
    model?: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
  }
): Promise<{ enhanced: string; fallback?: boolean }> {
  const systemMsg = AI_PROMPTS.enhance(ctx);
  const userMsg = {
    role: 'user' as const,
    content: `SECTION: ${ctx.sectionId}\n\nCURRENT CONTENT:\n${ctx.content}\n${ctx.targetJobTitle || ctx.targetJobDescription ? `\nTARGET JOB:\n${ctx.targetJobTitle || ''}\n${ctx.targetJobDescription || ''}` : ''}\n\nReturn ONLY the improved content in plain text.`,
  };

  const { text, fallback } = await complete([systemMsg, userMsg], config);

  return { enhanced: text, fallback };
}

export async function rewriteSummary(
  content: string,
  targetJobTitle?: string,
  config?: { model?: string; temperature?: number; topP?: number; maxTokens?: number }
): Promise<{ enhanced: string }> {
  const systemMsg = AI_PROMPTS['rewrite-summary']({ sectionId: 'summary' });
  const userMsg = {
    role: 'user' as const,
    content: `CURRENT SUMMARY:\n${content}\n${targetJobTitle ? `\nTARGET ROLE: ${targetJobTitle}` : ''}\n\nRewrite as a compelling professional summary. Return only the summary text.`,
  };

  const { text } = await complete([systemMsg, userMsg], config);
  return { enhanced: text };
}

export async function generateAchievements(
  content: string,
  targetJobTitle?: string,
  config?: { model?: string; temperature?: number; topP?: number; maxTokens?: number }
): Promise<{ enhanced: string }> {
  const systemMsg = AI_PROMPTS['achievement-generator']({ sectionId: 'achievements' });
  const userMsg = {
    role: 'user' as const,
    content: `JOB TITLE: ${content}\n${targetJobTitle ? `\nTARGET ROLE: ${targetJobTitle}` : ''}\n\nGenerate 4-6 strong achievement bullets with metrics. Return only the bullets.`,
  };

  const { text } = await complete([systemMsg, userMsg], config);
  return { enhanced: text };
}

export async function checkAts(
  content: string,
  targetJobDescription?: string
): Promise<AtsCheckResult> {
  const systemMsg = AI_PROMPTS['ats-check']({ sectionId: 'content' });
  const userMsg = {
    role: 'user' as const,
    content: `CONTENT:\n${content}\n\nReturn a JSON object with the specified fields.`,
  };

  const { text, fallback } = await complete([systemMsg, userMsg]);

  if (!fallback) {
    // The provider replied with JSON — validate it before trusting it.
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return atsCheckSchema.parse(parsed);
      }
    } catch {
      // Malformed provider output — fall through to the local analysis.
    }
  }

  // Deterministic local analysis. Always available, never random, and it
  // gives the user concrete actions rather than a generic apology.
  return runLocalAtsCheck(content, { targetJobDescription });
}