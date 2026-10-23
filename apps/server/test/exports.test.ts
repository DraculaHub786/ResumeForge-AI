import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startServer, stopServer, api } from './helpers.js';
import { resetDatabase } from './setup.js';
import { createEmptyContent } from '@resume-builder/types';

function exportableContent() {
  const content = createEmptyContent();
  content.profile.fullName = 'Jane Doe';
  content.profile.email = 'jane@example.com';
  content.experience.push({
    id: 'e1',
    position: 'Engineer',
    company: 'Acme',
    period: { start: '2020-01', current: true },
    highlights: ['Shipped the thing.'],
  });
  return content;
}

describe('export endpoints', () => {
  beforeAll(async () => {
    await resetDatabase();
    await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  it('rejects an export with no content', async () => {
    const res = await api('POST', '/api/v1/export/latex', { body: {} });

    expect(res.status).toBe(400);
  });

  it('refuses to export a resume with no name or history', async () => {
    const res = await api<{ error: string }>('POST', '/api/v1/export/latex', {
      body: { content: createEmptyContent() },
    });

    expect(res.status).toBe(422);
    expect(res.body.error).toBeTruthy();
  });

  it('emits a LaTeX document for a complete resume', async () => {
    const res = await api<string>('POST', '/api/v1/export/latex', {
      body: { content: exportableContent() },
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    expect(res.body).toContain('\\documentclass');
    expect(res.body).toContain('Jane Doe');
    expect(res.body).toContain('Acme');
  });
});
