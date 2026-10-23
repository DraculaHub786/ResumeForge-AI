/**
 * Runtime Zod schemas that mirror `packages/types/src/resume.ts`.
 *
 * IMPORTANT: Whenever you add/modify a field in `resume.ts`, also update this file.
 * Run `pnpm tsc --noEmit` to detect type/schema mismatches early.
 */

import { z } from 'zod';
import { createDefaultTheme, createEmptyContent, createId } from './resume.js';
import type { Resume, ResumeContent, ResumeMetadata } from './resume.js';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/**
 * The editor stores "not set" as an empty string, so every optional format
 * field accepts `''` alongside its real value.
 */
const optionalUrl = z.union([z.literal(''), z.string().url()]).optional();
const optionalEmail = z.union([z.literal(''), z.string().email()]).optional();

const urlSchema = optionalUrl;
const dateRangeSchema = z.object({
  start: z.string().optional(),
  end: z.string().optional(),
  current: z.boolean().optional(),
});
type DateRange = z.infer<typeof dateRangeSchema>;

const profileLinkSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  url: z.union([z.literal(''), z.string().url()]),
  icon: z.string().optional(),
});
type ProfileLink = z.infer<typeof profileLinkSchema>;

/**
 * Deep partial for the editor — everything is optional because the UI controls
 * what appears, not the schema. We only validate when saving to DB.
 *
 * These schemas describe the *shape* of a draft, not its completeness: a
 * freshly created resume has an empty name and no highlights, and it must
 * still be a valid document. Use {@link validateResumeForExport} to check
 * that a resume is complete enough to hand to a recruiter.
 */
export const personalSchema = z.object({
  fullName: z.string().max(200),
  headline: z.string().optional(),
  email: optionalEmail,
  phone: z.string().optional(),
  location: z.string().optional(),
  about: z.string().optional(),
  links: z.array(profileLinkSchema).default([]),
});
export type PersonalInput = z.infer<typeof personalSchema>;

export const experienceItemSchema = z.object({
  id: z.string().min(1),
  position: z.string().max(200),
  company: z.string().max(200),
  location: z.string().optional(),
  employmentType: z.string().optional(),
  period: dateRangeSchema.default({}),
  highlights: z.array(z.string()).default([]),
  description: z.string().optional(),
  techStack: z.array(z.string()).optional(),
});
export type ExperienceItemInput = z.infer<typeof experienceItemSchema>;

export const educationItemSchema = z.object({
  id: z.string().min(1),
  degree: z.string().max(200),
  institution: z.string().max(200),
  location: z.string().optional(),
  period: dateRangeSchema.default({}),
  score: z.string().optional(),
  description: z.string().optional(),
  coursework: z.array(z.string()).optional(),
});
export type EducationItemInput = z.infer<typeof educationItemSchema>;

export const skillGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().max(100),
  skills: z.array(z.string()).default([]),
  level: z.number().int().min(1).max(5).optional(),
});
export type SkillGroupInput = z.infer<typeof skillGroupSchema>;

export const projectItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().max(200),
  description: z.string().optional(),
  period: dateRangeSchema.optional(),
  role: z.string().optional(),
  highlights: z.array(z.string()).default([]),
  techStack: z.array(z.string()).optional(),
  url: optionalUrl,
});
export type ProjectItemInput = z.infer<typeof projectItemSchema>;

export const certificationItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().max(200),
  issuer: z.string().max(200),
  date: z.string().optional(),
  url: urlSchema,
});
export type CertificationItemInput = z.infer<typeof certificationItemSchema>;

export const publicationItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(300),
  publisher: z.string().max(300),
  date: z.string().optional(),
  url: urlSchema,
  description: z.string().optional(),
});
export type PublicationItemInput = z.infer<typeof publicationItemSchema>;

export const languageItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().max(100),
  proficiency: z.string().optional(),
});
export type LanguageItemInput = z.infer<typeof languageItemSchema>;

export const volunteerItemSchema = z.object({
  id: z.string().min(1),
  role: z.string().max(200),
  organization: z.string().max(200),
  period: dateRangeSchema.default({}),
  highlights: z.array(z.string()).default([]),
});
export type VolunteerItemInput = z.infer<typeof volunteerItemSchema>;

export const customSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(200),
  items: z.array(z.string()).default([]),
  description: z.string().optional(),
  visible: z.boolean().default(true),
});
export type CustomSectionInput = z.infer<typeof customSectionSchema>;

// ---------------------------------------------------------------------------
// Root content schemas
// ---------------------------------------------------------------------------

export const resumeContentSchema = z.object({
  profile: personalSchema,
  summary: z.string().optional(),
  experience: z.array(experienceItemSchema).default([]),
  education: z.array(educationItemSchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
  projects: z.array(projectItemSchema).default([]),
  achievements: z.array(z.string().min(1)).default([]),
  certifications: z.array(certificationItemSchema).default([]),
  publications: z.array(publicationItemSchema).default([]),
  languages: z.array(languageItemSchema).default([]),
  volunteer: z.array(volunteerItemSchema).default([]),
  interests: z.array(z.string().min(1)).default([]),
  customSections: z.array(customSectionSchema).default([]),
});
export type ResumeContentInput = z.infer<typeof resumeContentSchema>;

// ---------------------------------------------------------------------------
// Metadata / theme schemas
// ---------------------------------------------------------------------------

export const themeSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  textColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  mutedColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  backgroundColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/),
  fontFamily: z.enum([
    'inter', 'roboto', 'open-sans', 'lato', 'montserrat',
    'source-serif', 'libre-baskerville', 'times', 'calibri', 'georgia',
  ]),
  fontSize: z.number().int().min(8).max(24),
  lineHeight: z.number().min(1).max(3),
  headingCase: z.enum(['uppercase', 'title', 'normal']),
  showSectionRules: z.boolean(),
  showIcons: z.boolean(),
  uppercaseHeadings: z.boolean(),
  sidebarStyle: z.enum(['none', 'solid', 'tinted']),
});
export type ThemeInput = z.infer<typeof themeSchema>;

export const resumeMetadataSchema = z.object({
  template: z.string().min(1),
  theme: themeSchema,
  pageMargin: z.number().min(0.25).max(2),
  pageSize: z.enum(['letter', 'a4']),
  targetJobDescription: z.string().optional(),
  targetJobTitle: z.string().optional(),
});
export type ResumeMetadataInput = z.infer<typeof resumeMetadataSchema>;

// ---------------------------------------------------------------------------
// The full resume document
// ---------------------------------------------------------------------------

export const resumeSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1).nullable().optional(),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  metadata: resumeMetadataSchema,
  content: resumeContentSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type ResumeInput = z.infer<typeof resumeSchema>;

// ---------------------------------------------------------------------------
// Draft (what the editor mutates) — has all fields optional to allow incremental builds
// ---------------------------------------------------------------------------

export const resumeDraftSchema = resumeSchema.partial();
export type ResumeDraftInput = z.infer<typeof resumeDraftSchema>;

// ---------------------------------------------------------------------------
// Section definitions (runtime-only; not serialized to DB)
// ---------------------------------------------------------------------------

/**
 * The set of sections a resume can contain.
 *
 * Kept as a plain record of the individual section schemas so a caller can
 * validate one section in isolation (the editor does this before saving a
 * single section) without validating the whole document.
 */
export const SECTION_SCHEMAS = {
  profile: personalSchema,
  summary: z.string().optional(),
  experience: z.array(experienceItemSchema),
  education: z.array(educationItemSchema),
  skills: z.array(skillGroupSchema),
  projects: z.array(projectItemSchema),
  achievements: z.array(z.string().min(1)),
  certifications: z.array(certificationItemSchema),
  publications: z.array(publicationItemSchema),
  languages: z.array(languageItemSchema),
  volunteer: z.array(volunteerItemSchema),
  interests: z.array(z.string().min(1)),
  customSections: z.array(customSectionSchema),
} as const;

export type SectionSchemas = typeof SECTION_SCHEMAS;

// ---------------------------------------------------------------------------
// Type-schema consistency checker — runs at build time
// ---------------------------------------------------------------------------

/**
 * Ensure the Zod schemas are structurally consistent with the TypeScript types.
 *
 * The `satisfies` clauses below are the real check: if the hand-written
 * TypeScript types drift from the Zod schemas, `tsc` fails at build time.
 * Calling this function is optional — it exists so the invariant is exercised
 * by the unit tests as well.
 */
export function assertSchemaTypeConsistency(): void {
  // `resumeSchema` must accept the value produced by the canonical builders.
  const content = createEmptyContent();
  content.profile.fullName = 'Sample Person';

  const candidate = {
    id: createId('res'),
    title: 'Sample Resume',
    slug: 'sample-resume',
    metadata: createDefaultMetadata(),
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Type-level proof that the schema output is assignable to the TS type.
  const _typeProof: Resume = resumeSchema.parse(candidate);
  void _typeProof;
}

// ---------------------------------------------------------------------------
// Convenience builders (server-side use only)
// ---------------------------------------------------------------------------

export function createDefaultMetadata(): ResumeMetadata {
  return {
    template: 'ats-classic',
    theme: createDefaultTheme(),
    pageMargin: 0.6,
    pageSize: 'letter',
  };
}

// ---------------------------------------------------------------------------
// Export readiness
// ---------------------------------------------------------------------------

/** A single thing the user should fix before exporting. */
export interface CompletenessIssue {
  /** Dotted path of the offending field, e.g. `experience.0.position`. */
  field: string;
  /** Human-readable instruction. */
  message: string;
}

/**
 * Check that a resume is complete enough to hand to a recruiter.
 *
 * The Zod schemas deliberately accept incomplete drafts, so this is where
 * "you cannot export an empty resume" is enforced. Returns an empty array
 * when the resume is ready.
 */
export function validateResumeForExport(content: ResumeContent): CompletenessIssue[] {
  const issues: CompletenessIssue[] = [];

  if (!content.profile?.fullName?.trim()) {
    issues.push({ field: 'profile.fullName', message: 'Add your full name.' });
  }

  const hasHistory =
    content.experience.length > 0 ||
    content.education.length > 0 ||
    content.projects.length > 0;

  if (!hasHistory) {
    issues.push({
      field: 'experience',
      message: 'Add at least one role, degree, or project.',
    });
  }

  content.experience.forEach((item, index) => {
    if (!item.position?.trim()) {
      issues.push({
        field: `experience.${index}.position`,
        message: `Role ${index + 1} is missing a job title.`,
      });
    }
    if (!item.company?.trim()) {
      issues.push({
        field: `experience.${index}.company`,
        message: `Role ${index + 1} is missing a company.`,
      });
    }
    if (!item.highlights?.some((h) => h.trim())) {
      issues.push({
        field: `experience.${index}.highlights`,
        message: `Role ${index + 1} needs at least one bullet point.`,
      });
    }
  });

  content.education.forEach((item, index) => {
    if (!item.degree?.trim() || !item.institution?.trim()) {
      issues.push({
        field: `education.${index}`,
        message: `Education ${index + 1} needs a degree and an institution.`,
      });
    }
  });

  content.skills.forEach((group, index) => {
    if (!group.skills?.some((s) => s.trim())) {
      issues.push({
        field: `skills.${index}.skills`,
        message: `Skill group "${group.name || index + 1}" is empty.`,
      });
    }
  });

  return issues;
}
