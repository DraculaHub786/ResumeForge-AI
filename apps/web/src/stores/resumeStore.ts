/**
 * Zustand resume builder store.
 *
 * The editor reads from this store; mutations trigger autosave and optimistic
 * UI updates. Persists to localStorage so the editor works offline.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ResumeType,
  ResumeContent,
  ResumeDraft,
  Theme,
  SectionId,
} from '@resume-builder/types';

export interface ResumeBuilderState {
  resume: ResumeType;
  /** The editor draft — what the user mutates. */
  draft: ResumeDraft;
  /** Sections visible in the sidebar. */
  sectionVisibilities: Record<SectionId, boolean>;
  /** Currently selected template id. */
  template: string;
  /** Theme configuration. */
  theme: Theme;
  /** Whether the resume is currently autosaving. */
  isSaving: boolean;
  /** Set when the AI fallback was used, so the UI can warn the user. */
  aiFallbackUsed: boolean;

  // --- Actions ---
  setResume: (resume: ResumeType) => void;
  updateDraft: (patch: Partial<ResumeDraft>) => void;
  updateContent: (patch: Partial<ResumeContent>) => void;
  setSectionVisibility: (sectionId: SectionId, visible: boolean) => void;
  toggleSectionVisibility: (sectionId: SectionId) => void;
  setTemplate: (templateId: string) => void;
  setTheme: (patch: Partial<Theme>) => void;
  setSaving: (value: boolean) => void;
  setAiFallbackUsed: (value: boolean) => void;
  resetDraft: () => void;
}

/** Default theme applied to a new resume. */
export function defaultTheme(): Theme {
  return {
    primaryColor: '#1e40af',
    textColor: '#111827',
    mutedColor: '#6b7280',
    backgroundColor: '#ffffff',
    fontFamily: 'inter',
    fontSize: 11,
    lineHeight: 1.35,
    headingCase: 'uppercase',
    showSectionRules: true,
    showIcons: false,
    uppercaseHeadings: true,
    sidebarStyle: 'none',
  };
}

/** Empty resume content. */
export function emptyContent(): ResumeContent {
  return {
    profile: {
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      about: '',
      links: [],
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    achievements: [],
    certifications: [],
    publications: [],
    languages: [],
    volunteer: [],
    interests: [],
    customSections: [],
  };
}

/** Empty resume draft. */
export function emptyDraft(): ResumeDraft {
  const now = new Date().toISOString();
  return {
    id: '',
    title: 'New Resume',
    slug: 'new-resume',
    metadata: {
      template: 'ats-classic',
      theme: defaultTheme(),
      pageMargin: 0.6,
      pageSize: 'letter',
    },
    content: emptyContent(),
    createdAt: now,
    updatedAt: now,
  };
}

const DEFAULT_VISIBILITIES: Record<SectionId, boolean> = {
  profile: true,
  summary: true,
  experience: true,
  education: true,
  skills: true,
  projects: true,
  achievements: false,
  certifications: false,
  publications: false,
  languages: false,
  volunteer: false,
  interests: false,
  custom: false,
};

export const useResumeStore = create<ResumeBuilderState>()(
  persist(
    (set) => ({
      resume: {
        id: '',
        title: 'New Resume',
        slug: 'new-resume',
        metadata: {
          template: 'ats-classic',
          theme: defaultTheme(),
          pageMargin: 0.6,
          pageSize: 'letter',
        },
        content: emptyContent(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      draft: emptyDraft(),
      sectionVisibilities: { ...DEFAULT_VISIBILITIES },
      template: 'ats-classic',
      theme: defaultTheme(),
      isSaving: false,
      aiFallbackUsed: false,

      setResume: (resume) =>
        set({
          resume,
          draft: {
            id: resume.id,
            userId: resume.userId,
            title: resume.title,
            slug: resume.slug,
            metadata: resume.metadata,
            content: resume.content,
            createdAt: resume.createdAt,
            updatedAt: resume.updatedAt,
          },
          template: resume.metadata?.template ?? 'ats-classic',
          theme: resume.metadata?.theme ?? defaultTheme(),
        }),

      updateDraft: (patch) =>
        set((state) => ({
          draft: {
            ...state.draft,
            ...patch,
            updatedAt: new Date().toISOString(),
          },
        })),

      updateContent: (patch) =>
        set((state) => ({
          draft: {
            ...state.draft,
            content: { ...(state.draft.content ?? emptyContent()), ...patch },
            updatedAt: new Date().toISOString(),
          },
        })),

      setSectionVisibility: (sectionId, visible) =>
        set((state) => ({
          sectionVisibilities: { ...state.sectionVisibilities, [sectionId]: visible },
        })),

      toggleSectionVisibility: (sectionId) =>
        set((state) => ({
          sectionVisibilities: {
            ...state.sectionVisibilities,
            [sectionId]: !state.sectionVisibilities[sectionId],
          },
        })),

      setTemplate: (templateId) =>
        set((state) => ({
          template: templateId,
          draft: {
            ...state.draft,
            metadata: { ...state.draft.metadata, template: templateId },
          },
        })),

      setTheme: (patch) =>
        set((state) => {
          const theme = { ...state.theme, ...patch };
          return {
            theme,
            draft: {
              ...state.draft,
              metadata: { ...state.draft.metadata, theme },
            },
          };
        }),

      setSaving: (isSaving) => set({ isSaving }),

      setAiFallbackUsed: (aiFallbackUsed) => set({ aiFallbackUsed }),

      resetDraft: () =>
        set({
          draft: emptyDraft(),
          theme: defaultTheme(),
          template: 'ats-classic',
          sectionVisibilities: { ...DEFAULT_VISIBILITIES },
        }),
    }),
    {
      name: 'resume-builder-state',
      version: 1,
      partialize: (state) => ({
        draft: state.draft,
        template: state.template,
        theme: state.theme,
        sectionVisibilities: state.sectionVisibilities,
      }),
    }
  )
);
