import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, api } from './helpers.js';
import { resetDatabase } from './setup.js';

describe('health & error handling', () => {
  beforeAll(async () => {
    await resetDatabase();
    await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  it('reports a healthy service', async () => {
    const res = await api<{ status: string; timestamp: string }>(
      'GET',
      '/api/v1/health'
    );

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Number.isNaN(Date.parse(res.body.timestamp))).toBe(false);
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await api<{ error?: string }>('GET', '/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
