import { expect, test } from '@playwright/test';

import { API_URL } from '../config';
import { apiSignUp, newUser, sampleResumeContent } from '../helpers';

test.describe('API', () => {
  test('reports health', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/health`);
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
  });

  test('rejects unauthenticated resume access', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/v1/resumes`);
    expect(response.status()).toBe(401);
  });

  test('creates, reads, updates and deletes a resume', async ({ request }) => {
    const user = newUser('crud');
    await apiSignUp(request, user);

    const create = await request.post(`${API_URL}/api/v1/resumes`, {
      data: { title: 'API Resume', content: sampleResumeContent(), metadata: {} },
    });
    expect(create.status()).toBe(201);

    const created = await create.json();
    expect(created.id).toBeTruthy();
    expect(created.slug).toBeTruthy();

    const read = await request.get(`${API_URL}/api/v1/resumes/${created.id}`);
    expect(read.ok()).toBeTruthy();
    expect((await read.json()).title).toBe('API Resume');

    const update = await request.patch(`${API_URL}/api/v1/resumes/${created.id}`, {
      data: { title: 'Renamed Resume' },
    });
    expect(update.ok()).toBeTruthy();
    expect((await update.json()).title).toBe('Renamed Resume');

    const remove = await request.delete(`${API_URL}/api/v1/resumes/${created.id}`);
    expect(remove.status()).toBe(204);

    const gone = await request.get(`${API_URL}/api/v1/resumes/${created.id}`);
    expect(gone.status()).toBe(404);
  });

  test('lets two users own resumes with the same title', async ({ request, playwright }) => {
    const first = newUser('owner-a');
    const second = newUser('owner-b');
    await apiSignUp(request, first);

    const firstCreate = await request.post(`${API_URL}/api/v1/resumes`, {
      data: { title: 'New Resume', content: sampleResumeContent(), metadata: {} },
    });
    expect(firstCreate.status()).toBe(201);

    // A second account must not collide with the first account's slug. It
    // needs its own request context so the two sessions do not share cookies.
    const secondContext = await playwright.request.newContext();
    try {
      await apiSignUp(secondContext, second);
      const secondCreate = await secondContext.post(`${API_URL}/api/v1/resumes`, {
        data: { title: 'New Resume', content: sampleResumeContent(), metadata: {} },
      });
      expect(secondCreate.status()).toBe(201);

      const firstBody = await firstCreate.json();
      const secondBody = await secondCreate.json();
      expect(firstBody.slug).not.toBe(secondBody.slug);
    } finally {
      await secondContext.dispose();
    }
  });

  test('refuses to export a resume that has no owner details', async ({ request }) => {
    const user = newUser('export-empty');
    await apiSignUp(request, user);

    const response = await request.post(`${API_URL}/api/v1/export/latex`, {
      data: { content: sampleResumeContent() },
    });

    // The sample has a name and a role, so this one exports.
    expect(response.status()).toBe(200);
    const latex = await response.text();
    expect(latex).toContain('\\documentclass');
    expect(latex).toContain('Grace Hopper');
  });

  test('rejects an export of a blank resume', async ({ request }) => {
    const user = newUser('export-blank');
    await apiSignUp(request, user);

    const response = await request.post(`${API_URL}/api/v1/export/latex`, {
      data: {
        content: {
          profile: { fullName: '', links: [] },
          summary: '',
          experience: [],
          education: [],
          skills: [],
          projects: [],
        },
      },
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error).toBe('Resume is not ready to export');
    expect(Array.isArray(body.issues)).toBeTruthy();
  });

  test('scores a resume with the ATS analyser', async ({ request }) => {
    const user = newUser('ats');
    await apiSignUp(request, user);

    const response = await request.post(`${API_URL}/api/v1/ai/ats-check`, {
      data: {
        content: 'Led a team of 5 engineers. Cut costs by 30%. Shipped the platform.',
      },
    });

    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(typeof body.score).toBe('number');
    expect(Array.isArray(body.issues)).toBeTruthy();
    expect(Array.isArray(body.suggestions)).toBeTruthy();
  });
});
