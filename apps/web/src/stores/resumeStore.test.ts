import { describe, it, expect, beforeEach } from 'vitest';

import { useResumeStore, emptyContent, emptyDraft, defaultTheme } from './resumeStore';

const sampleResume = {
  id: 'res_1',
  title: 'Jane Doe — Resume',
  slug: 'jane-doe-resume',
  metadata: {
    template: 'modern-sidebar',
    theme: { ...defaultTheme(), primaryColor: '#ff0000' },
    pageMargin: 0.8,
    pageSize: 'a4' as const,
  },
  content: {
    ...emptyContent(),
    profile: {
      fullName: 'Jane Doe',
      headline: 'Staff Engineer',
      email: 'jane@example.com',
      phone: '',
      location: 'Berlin',
      about: '',
      links: [],
    },
    experience: [
      {
        id: 'e1',
        position: 'Engineer',
        company: 'Acme',
        period: { start: '2020-01' },
        highlights: ['Shipped it.'],
      },
    ],
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('resumeStore', () => {
  beforeEach(() => {
    useResumeStore.getState().resetDraft();
    useResumeStore.setState({ isSaving: false, aiFallbackUsed: false });
  });

  it('starts with a blank draft', () => {
    const state = useResumeStore.getState();
    expect(state.draft.title).toBe('New Resume');
    expect(state.draft.content.experience).toEqual([]);
    expect(state.template).toBe('ats-classic');
  });

  it('loads a resume into the draft, template, and theme', () => {
    useResumeStore.getState().setResume(sampleResume);
    const state = useResumeStore.getState();
    expect(state.draft.id).toBe('res_1');
    expect(state.draft.content.profile.fullName).toBe('Jane Doe');
    expect(state.template).toBe('modern-sidebar');
    expect(state.theme.primaryColor).toBe('#ff0000');
  });

  it('merges a draft patch without dropping other fields', () => {
    useResumeStore.getState().setResume(sampleResume);
    useResumeStore.getState().updateDraft({ title: 'Renamed' });
    const state = useResumeStore.getState();
    expect(state.draft.title).toBe('Renamed');
    expect(state.draft.content.profile.fullName).toBe('Jane Doe');
  });

  it('bumps updatedAt on every draft mutation', () => {
    useResumeStore.getState().setResume(sampleResume);
    const before = useResumeStore.getState().draft.updatedAt ?? '';
    useResumeStore.getState().updateDraft({ title: 'Changed' });
    expect(
      new Date(useResumeStore.getState().draft.updatedAt ?? '').getTime(),
    ).toBeGreaterThanOrEqual(new Date(before).getTime());
  });

  it('merges content patches', () => {
    useResumeStore.getState().updateContent({ summary: 'A summary' });
    const state = useResumeStore.getState();
    expect(state.draft.content.summary).toBe('A summary');
    expect(state.draft.content.experience).toEqual([]);
  });

  it('keeps the template and the draft metadata in sync', () => {
    useResumeStore.getState().setTemplate('ats-classic');
    const state = useResumeStore.getState();
    expect(state.template).toBe('ats-classic');
    expect(state.draft.metadata.template).toBe('ats-classic');
  });

  it('keeps the theme and the draft metadata in sync', () => {
    useResumeStore.getState().setTheme({ fontSize: 14 });
    const state = useResumeStore.getState();
    expect(state.theme.fontSize).toBe(14);
    expect(state.draft.metadata.theme.fontSize).toBe(14);
  });

  it('toggles section visibility', () => {
    const before = useResumeStore.getState().sectionVisibilities.achievements;
    useResumeStore.getState().toggleSectionVisibility('achievements');
    expect(useResumeStore.getState().sectionVisibilities.achievements).toBe(!before);
  });

  it('resets back to a blank draft', () => {
    useResumeStore.getState().setResume(sampleResume);
    useResumeStore.getState().resetDraft();
    const state = useResumeStore.getState();
    expect(state.draft.title).toBe('New Resume');
    expect(state.draft.content.profile.fullName).toBe('');
    expect(state.template).toBe('ats-classic');
  });

  it('produces a draft that satisfies the shared schema', async () => {
    const { resumeContentSchema } = await import('@resume-builder/types');
    expect(resumeContentSchema.safeParse(emptyDraft().content).success).toBe(true);
  });
});
