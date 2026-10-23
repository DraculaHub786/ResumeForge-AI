import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startServer, stopServer, api, signUp } from './helpers.js';
import { resetDatabase } from './setup.js';

describe('AI endpoints (no provider configured)', () => {
  beforeAll(async () => {
    await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('requires a session', async () => {
    const res = await api('POST', '/api/v1/ai/enhance', {
      body: { sectionId: 'summary', content: 'Engineer.' },
    });

    expect(res.status).toBe(401);
  });

  it('rejects a request that is missing required fields', async () => {
    const cookie = await signUp('ai@example.com');

    const res = await api('POST', '/api/v1/ai/enhance', {
      cookie,
      body: { sectionId: 'summary' },
    });

    expect(res.status).toBe(400);
  });

  it('falls back to a deterministic rewrite when no provider is configured', async () => {
    const cookie = await signUp('ai@example.com');

    const res = await api<{ enhanced: string }>(
      'POST',
      '/api/v1/ai/rewrite-summary',
      { cookie, body: { content: 'Built things.', targetJobTitle: 'Staff Engineer' } }
    );

    expect(res.status).toBe(200);
    expect(typeof res.body.enhanced).toBe('string');
    expect(res.body.enhanced.length).toBeGreaterThan(0);

    // The fallback must not depend on a provider, so the same input always
    // produces the same output.
    const again = await api<{ enhanced: string }>(
      'POST',
      '/api/v1/ai/rewrite-summary',
      { cookie, body: { content: 'Built things.', targetJobTitle: 'Staff Engineer' } }
    );
    expect(again.body.enhanced).toBe(res.body.enhanced);
  });

  it('scores a resume locally when the provider is unavailable', async () => {
    const cookie = await signUp('ai@example.com');

    const res = await api<{ score: number; issues: string[] }>(
      'POST',
      '/api/v1/ai/ats-check',
      { cookie, body: { content: 'Jane Doe. Engineer at Acme. Built a system.' } }
    );

    expect(res.status).toBe(200);
    expect(res.body.score).toBeGreaterThanOrEqual(0);
    expect(res.body.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(res.body.issues)).toBe(true);
  });
});
