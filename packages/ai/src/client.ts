/**
 * OpenRouter client wrapper.
 *
 * Provides a simple `complete` function that calls OpenRouter's chat API and
 * returns streamed text chunks. Falls back to a deterministic rule-based
 * enhancer when no API key is configured — or when the provider is slow,
 * unreachable, or errors — so the feature never blocks the request.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

export type ModelConfig = {
  model?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  /** Hard timeout for the provider call, in milliseconds. */
  timeoutMs?: number;
};

export interface ActiveProvider {
  client: ReturnType<typeof createOpenAI>;
  defaultModel: string;
  name: 'Groq' | 'OpenRouter';
}

export function getActiveAiProvider(): ActiveProvider | null {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    const groqBase = process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1';
    return {
      client: createOpenAI({
        baseURL: groqBase,
        apiKey: groqKey,
      }),
      defaultModel: process.env.GROQ_DEFAULT_MODEL ?? 'openai/gpt-oss-20b',
      name: 'Groq',
    };
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    const openrouterBase = process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1';
    return {
      client: createOpenAI({
        baseURL: openrouterBase,
        apiKey: openrouterKey,
        headers: {
          'HTTP-Referer': 'https://resumeforge.ai',
          'X-Title': 'ResumeForge AI',
        },
      }),
      defaultModel: process.env.OPENROUTER_DEFAULT_MODEL ?? 'openai/gpt-4o-mini',
      name: 'OpenRouter',
    };
  }

  return null;
}

/** Result of a completion call. */
export type CompleteResult = {
  text: string;
  stream?: AsyncGenerator<string>;
  /** True when the deterministic fallback produced the text. */
  fallback?: boolean;
  provider?: string;
  model?: string;
};

/** Default provider timeout. */
const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Circuit breaker.
 *
 * When the provider is down, every request would otherwise pay the full
 * timeout before degrading. After a few consecutive failures we stop calling
 * the provider for a cool-down window and answer from the local fallback
 * immediately — the user still gets a result, just without the wait.
 */
const BREAKER = {
  failures: 0,
  openedAt: 0,
  threshold: 3,
  coolDownMs: 60_000,
};

function isProviderAvailable(): boolean {
  if (BREAKER.failures < BREAKER.threshold) return true;
  const elapsed = Date.now() - BREAKER.openedAt;
  if (elapsed >= BREAKER.coolDownMs) {
    // Cool-down elapsed — let the next request probe the provider again.
    BREAKER.failures = 0;
    return true;
  }
  return false;
}

function recordProviderSuccess(): void {
  BREAKER.failures = 0;
  BREAKER.openedAt = 0;
}

function recordProviderFailure(): void {
  BREAKER.failures += 1;
  if (BREAKER.failures >= BREAKER.threshold) BREAKER.openedAt = Date.now();
}

/**
 * Reject with a `TimeoutError` if `promise` has not settled within `ms`.
 *
 * The provider SDK aborts its own fetch when the signal fires, but aborting is
 * best-effort: a socket stuck in DNS or a stalled TLS handshake can outlive the
 * signal. Racing against a timer guarantees the HTTP request always completes
 * on our terms instead of hanging the caller.
 */
function withDeadline<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout | undefined;

  const guard = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    // Never keep the event loop alive just for the watchdog.
    timer.unref?.();
  });

  // The losing promise is ignored, but it may still reject later — swallow it
  // so an abort after the race does not surface as an unhandled rejection.
  promise.catch(() => undefined);

  return Promise.race([promise, guard]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/** Call Groq or OpenRouter (or the deterministic fallback). */
export async function complete(
  messages: Array<{ role: 'system' | 'user'; content: string }>,
  config: ModelConfig = {}
): Promise<CompleteResult> {
  const active = getActiveAiProvider();
  const userContent = messages[messages.length - 1]?.content ?? '';

  if (!active) {
    // No key — deterministic fallback so the feature still works locally.
    return { text: fallbackComplete(userContent, config), fallback: true, provider: 'local', model: 'heuristic' };
  }

  if (!isProviderAvailable()) {
    // Provider is known to be down — answer immediately from the fallback.
    return { text: fallbackComplete(userContent, config), fallback: true, provider: 'local', model: 'heuristic' };
  }

  const model = config.model ?? active.defaultModel;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), timeoutMs);
  abortTimer.unref?.();

  try {
    const result = await withDeadline(
      generateText({
        model: active.client(model),
        system: messages[0]?.role === 'system' ? messages[0].content : undefined,
        messages: messages.filter((m) => m.role !== 'system'),
        temperature: config.temperature ?? 0.6,
        topP: config.topP ?? 0.9,
        maxTokens: config.maxTokens ?? 1500,
        abortSignal: controller.signal,
      }),
      timeoutMs,
      `${active.name} completion`
    );

    recordProviderSuccess();

    return {
      text: result.text,
      fallback: false,
      provider: active.name,
      model,
    };
  } catch {
    // The provider timed out or errored — degrade to the local enhancer
    // rather than failing the user's request.
    recordProviderFailure();
    return { text: fallbackComplete(userContent, config), fallback: true, provider: 'local', model: 'heuristic' };
  } finally {
    clearTimeout(abortTimer);
  }
}

/** Deterministic rule-based fallback enhancer. */
export function fallbackComplete(content: string, _config: ModelConfig = {}): string {
  if (!content.trim()) return content;

  const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];

  const actionVerbs = [
    'Led', 'Developed', 'Implemented', 'Designed', 'Built', 'Managed',
    'Created', 'Improved', 'Reduced', 'Increased', 'Coordinated',
    'Executed', 'Optimized', 'Spearheaded', 'Automated',
  ];

  for (const line of lines) {
    let enhanced = line;
    // Capitalise first letter.
    if (enhanced && enhanced[0] === enhanced[0].toLowerCase()) {
      enhanced = enhanced[0].toUpperCase() + enhanced.slice(1);
    }
    // Ensure ending punctuation for bullets.
    if (!enhanced.match(/[.!?]$/)) enhanced += '.';
    // Prepend an action verb if missing.
    const startsWithVerb = actionVerbs.some((v) => enhanced.startsWith(v));
    if (!startsWithVerb && !enhanced.match(/^\d/)) {
      enhanced = 'Contributed to ' + enhanced[0].toLowerCase() + enhanced.slice(1);
    }
    out.push(enhanced);
  }

  return out.join('\n');
}
