import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { startServer, stopServer, api, signUp } from './helpers.js';
import { resetDatabase } from './setup.js';
import { createEmptyContent, createDefaultTheme } from '@resume-builder/types';

const draftBody = () => ({
  title: 'Jane Doe — Resume',
  metadata: {
    template: 'ats-classic',
    theme: createDefaultTheme(),
    pageMargin: 0.6,
    pageSize: 'letter',
  },
  content: createEmptyContent(),
});

describe('resumes API', () => {
  beforeAll(async () => {
    await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('rejects anonymous access to every resume route', async () => {
    const list = await api('GET', '/api/v1/resumes');
    expect(list.status).toBe(401);

    const create = await api('POST', '/api/v1/resumes', { body: draftBody() });
    expect(create.status).toBe(401);

    const get = await api('GET', '/api/v1/resumes/res_1');
    expect(get.status).toBe(401);

    const patch = await api('PATCH', '/api/v1/resumes/res_1', {
      body: { title: 'nope' },
    });
    expect(patch.status).toBe(401);

    const remove = await api('DELETE', '/api/v1/resumes/res_1');
    expect(remove.status).toBe(401);
  });

  it('creates, reads, updates and deletes a resume', async () => {
    const cookie = await signUp('crud@example.com');

    const created = await api<{ id: string; title: string; slug: string }>(
      'POST',
      '/api/v1/resumes',
      { cookie, body: draftBody() }
    );
    expect(created.status).toBe(201);
    expect(created.body.title).toBe('Jane Doe — Resume');
    expect(created.body.slug).toBeTruthy();

    const list = await api<{ items: unknown[]; total: number }>(
      'GET',
      '/api/v1/resumes',
      { cookie }
    );
    expect(list.status).toBe(200);
    expect(list.body.total).toBe(1);
    expect(list.body.items).toHaveLength(1);

    const fetched = await api<{ id: string; title: string }>(
      'GET',
      `/api/v1/resumes/${created.body.id}`,
      { cookie }
    );
    expect(fetched.status).toBe(200);
    expect(fetched.body.id).toBe(created.body.id);

    const updated = await api<{ title: string }>(
      'PATCH',
      `/api/v1/resumes/${created.body.id}`,
      { cookie, body: { title: 'Jane Doe — Updated' } }
    );
    expect(updated.status).toBe(200);
    expect(updated.body.title).toBe('Jane Doe — Updated');

    const removed = await api('DELETE', `/api/v1/resumes/${created.body.id}`, {
      cookie,
    });
    expect(removed.status).toBe(204);

    const afterDelete = await api('GET', `/api/v1/resumes/${created.body.id}`, {
      cookie,
    });
    expect(afterDelete.status).toBe(404);
  });

  it('keeps one account out of another account’s resumes', async () => {
    const ownerCookie = await signUp('owner@example.com');
    const otherCookie = await signUp('intruder@example.com');

    const created = await api<{ id: string }>('POST', '/api/v1/resumes', {
      cookie: ownerCookie,
      body: draftBody(),
    });
    expect(created.status).toBe(201);

    const stolen = await api('GET', `/api/v1/resumes/${created.body.id}`, {
      cookie: otherCookie,
    });
    expect(stolen.status).toBe(404);

    const otherList = await api<{ total: number }>('GET', '/api/v1/resumes', {
      cookie: otherCookie,
    });
    expect(otherList.body.total).toBe(0);
  });

  it('disambiguates slugs so two resumes with the same title both get one', async () => {
    const cookie = await signUp('slug@example.com');

    const first = await api<{ slug: string }>('POST', '/api/v1/resumes', {
      cookie,
      body: { ...draftBody(), title: 'New Resume' },
    });
    const second = await api<{ slug: string }>('POST', '/api/v1/resumes', {
      cookie,
      body: { ...draftBody(), title: 'New Resume' },
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.slug).not.toBe(second.body.slug);
  });

  it('rejects a create payload without a title', async () => {
    const cookie = await signUp('invalid@example.com');

    const res = await api('POST', '/api/v1/resumes', {
      cookie,
      body: { ...draftBody(), title: '' },
    });

    expect(res.status).toBe(400);
  });
});
