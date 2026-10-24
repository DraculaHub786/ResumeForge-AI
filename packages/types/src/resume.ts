/**
 * Canonical Resume data model.
 *
 * This is the single source of truth for the shape of a resume across the
 * entire monorepo: the web editor, the API server, the AI pipeline, and every
 * export format (PDF / DOCX / PNG / LaTeX) read from these types.
 *
 * Design rules:
 *  - Every field is optional or defaulted so a brand new resume is valid.
 *  - Arrays are always present (never `undefined`) to avoid null checks
 *    throughout the render tree.
 *  - `id` fields are client-generated ULIDs so items can be created
 *    optimistically without a server round-trip.
 */

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

/** A sortable, human-readable date range. Either endpoint may be empty. */
export interface DateRange {
  /** ISO-ish date, e.g. "2023-08" or "2023". */
  start?: string;
  /** ISO-ish date, or "present" for ongoing roles. */
  end?: string;
  /** When true the end date renders as "Present". */
  current?: boolean;
}

/** A labelled hyperlink shown in the profile header. */
export interface ProfileLink {
  id: string;
  /** Display label, e.g. "GitHub". */
  label: string;
  /** Absolute URL. */
  url: string;
  /** Optional icon key resolved by the UI layer. */
  icon?: string;
}

// ---------------------------------------------------------------------------
// Section items
// ---------------------------------------------------------------------------

export interface Personal {
  fullName: string;
  /** Headline shown under the name, e.g. "Senior Backend Engineer". */
  headline?: string;
  email?: string;
  phone?: string;
  location?: string;
  /** Short intro line rendered in two-column templates. */
  about?: string;
  links: ProfileLink[];
}

export interface ExperienceItem {
  id: string;
  /** Job title, e.g. "Backend Engineer". */
  position: string;
  company: string;
  location?: string;
  employmentType?: string;
  period: DateRange;
  /** Bullet points describing impact. */
  highlights: string[];
  /** Free-form body for templates that support a paragraph. */
  description?: string;
  /** Technologies used, rendered as tags. */
  techStack?: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  location?: string;
  period: DateRange;
  /** GPA, percentage, or honours. */
  score?: string;
  description?: string;
  /** Relevant coursework. */
  coursework?: string[];
}

export interface SkillGroup {
  id: string;
  /** Category name, e.g. "Languages", "Frameworks". */
  name: string;
  skills: string[];
  /** Optional proficiency, 1-5. Omitted hides the indicator. */
  level?: number;
}

export interface ProjectItem {
  id: string;
  name: string;
  /** One-line description under the project name. */
  description?: string;
  period?: DateRange;
  role?: string;
  highlights: string[];
  techStack?: string[];
  /** Link to the repository, demo, or case study. */
  url?: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date?: string;
  /** Credential URL or credential ID. */
  url?: string;
}

export interface PublicationItem {
  id: string;
  title: string;
  publisher: string;
  date?: string;
  url?: string;
  description?: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  /** "Native", "Fluent", "Intermediate"... */
  proficiency?: string;
}

export interface VolunteerItem {
  id: string;
  role: string;
  organization: string;
  period: DateRange;
  highlights: string[];
}

/** User-defined section rendered verbatim in the position the user chose. */
export interface CustomSection {
  id: string;
  title: string;
  /** Bullet list. */
  items: string[];
  /** Optional paragraph rendered above the bullets. */
  description?: string;
  /** Whether this section is visible in exports. */
  visible: boolean;
}

// ---------------------------------------------------------------------------
// The content document
// ---------------------------------------------------------------------------

export interface ResumeContent {
  profile: Personal;
  summary?: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  projects: ProjectItem[];
  achievements: string[];
  certifications: CertificationItem[];
  publications: PublicationItem[];
  languages: LanguageItem[];
  volunteer: VolunteerItem[];
  interests: string[];
  customSections: CustomSection[];
}

// ---------------------------------------------------------------------------
// Theme & metadata
// ---------------------------------------------------------------------------

export type FontFamily =
  | 'inter'
  | 'roboto'
  | 'open-sans'
  | 'lato'
  | 'montserrat'
  | 'source-serif'
  | 'libre-baskerville'
  | 'times'
  | 'calibri'
  | 'georgia';

export interface Theme {
  /** Primary accent used for headings, rules, and links. */
  primaryColor: string;
  /** Body text colour. */
  textColor: string;
  /** Muted colour for dates, locations, and secondary text. */
  mutedColor: string;
  /** Page background. */
  backgroundColor: string;
  fontFamily: FontFamily;
  /** Base font size in points. */
  fontSize: number;
  /** Line height multiplier. */
  lineHeight: number;
  /** Section heading casing style. */
  headingCase: 'uppercase' | 'title' | 'normal';
  /** Show the horizontal rule under section headings. */
  showSectionRules: boolean;
  /** Show the icon next to contact details. */
  showIcons: boolean;
  /** Uppercase the section headings. */
  uppercaseHeadings: boolean;
  /** Use a coloured sidebar (two-column templates only). */
  sidebarStyle: 'none' | 'solid' | 'tinted';
  /** Alignment of the name and profile header. */
  headerAlignment?: 'left' | 'center' | 'right';
  /** Alignment of the section titles. */
  sectionAlignment?: 'left' | 'center' | 'right';
  /** Text alignment of the body paragraphs. */
  contentAlignment?: 'left' | 'justify' | 'center';
  /** Bullet point style for lists. */
  bulletStyle?: 'disc' | 'circle' | 'square' | 'dash' | 'arrow' | 'none';
  /** Spacing between sections in points. */
  sectionSpacing?: number;
}

export interface ResumeMetadata {
  /** Template id from the template registry. */
  template: string;
  theme: Theme;
  /** Page margin in inches. */
  pageMargin: number;
  /** Target page size. */
  pageSize: 'letter' | 'a4';
  /** Optional target job description, used for ATS scoring. */
  targetJobDescription?: string;
  /** Optional target job title. */
  targetJobTitle?: string;
}

// ---------------------------------------------------------------------------
// The resume document
// ---------------------------------------------------------------------------

export interface Resume {
  id: string;
  /** Server-assigned owner. Absent (null) for local-only (guest) resumes. */
  userId?: string | null;
  /** Human title shown in the dashboard. */
  title: string;
  /** URL slug. */
  slug: string;
  metadata: ResumeMetadata;
  content: ResumeContent;
  createdAt: string;
  updatedAt: string;
}

/** A resume without server-owned ids — what the editor mutates. */
export type ResumeDraft = Omit<
  Resume,
  'id' | 'createdAt' | 'updatedAt' | 'slug'
> & {
  /** Created while offline / before sign-in. */
  userId?: string | null;
  /** Optional origin timestamp for a new resume. */
  createdAt?: string;
  /** Last edit timestamp. */
  updatedAt?: string;
  /** Local id; generated when saving to the server. */
  id?: string;
  /**
   * URL slug. The server assigns (and de-duplicates) it on create, so it is
   * absent until the resume has been persisted.
   */
  slug?: string;
};

// ---------------------------------------------------------------------------
// Section registry
// ---------------------------------------------------------------------------

export type SectionId =
  | 'profile'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'achievements'
  | 'certifications'
  | 'publications'
  | 'languages'
  | 'volunteer'
  | 'interests'
  | 'custom';

export interface SectionDefinition {
  id: SectionId;
  title: string;
  /** Whether the section renders a list of repeatable items. */
  repeatable: boolean;
  /** Whether the section can be reordered by the user. */
  reorderable: boolean;
  /** Whether the section can be toggled off. */
  optional: boolean;
  /** Section is shown in the sidebar by default. */
  defaultVisible: boolean;
  /** Icon key. */
  icon: string;
  /** Short helper shown in the editor. */
  hint: string;
}

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: 'profile',
    title: 'Personal Information',
    repeatable: false,
    reorderable: false,
    optional: false,
    defaultVisible: true,
    icon: 'user',
    hint: 'Your name, headline and contact details. This always renders first.',
  },
  {
    id: 'summary',
    title: 'Professional Summary',
    repeatable: false,
    reorderable: true,
    optional: true,
    defaultVisible: true,
    icon: 'text',
    hint: '2-4 sentences covering your role, experience, and strongest skills.',
  },
  {
    id: 'experience',
    title: 'Work Experience',
    repeatable: true,
    reorderable: true,
    optional: true,
    defaultVisible: true,
    icon: 'briefcase',
    hint: 'Roles, companies, dates and impact bullets.',
  },
  {
    id: 'education',
    title: 'Education',
    repeatable: true,
    reorderable: true,
    optional: true,
    defaultVisible: true,
    icon: 'academic',
    hint: 'Degrees, institutions, grades and coursework.',
  },
  {
    id: 'skills',
    title: 'Skills',
    repeatable: true,
    reorderable: true,
    optional: true,
    defaultVisible: true,
    icon: 'sparkles',
    hint: 'Group related skills into categories.',
  },
  {
    id: 'projects',
    title: 'Projects',
    repeatable: true,
    reorderable: true,
    optional: true,
    defaultVisible: true,
    icon: 'cube',
    hint: 'Personal or professional work worth highlighting.',
  },
  {
    id: 'achievements',
    title: 'Achievements',
    repeatable: false,
    reorderable: true,
    optional: true,
    defaultVisible: false,
    icon: 'trophy',
    hint: 'Awards, honours and notable accomplishments.',
  },
  {
    id: 'certifications',
    title: 'Certifications',
    repeatable: true,
    reorderable: true,
    optional: true,
    defaultVisible: false,
    icon: 'certificate',
    hint: 'Credentials with issuer and date.',
  },
  {
    id: 'publications',
    title: 'Publications',
    repeatable: true,
    reorderable: true,
    optional: true,
    defaultVisible: false,
    icon: 'book',
    hint: 'Papers, articles and conference talks.',
  },
  {
    id: 'languages',
    title: 'Languages',
    repeatable: true,
    reorderable: true,
    optional: true,
    defaultVisible: false,
    icon: 'globe',
    hint: 'Spoken and written languages with proficiency.',
  },
  {
    id: 'volunteer',
    title: 'Volunteer Work',
    repeatable: true,
    reorderable: true,
    optional: true,
    defaultVisible: false,
    icon: 'heart',
    hint: 'Community and volunteer contributions.',
  },
  {
    id: 'interests',
    title: 'Interests',
    repeatable: false,
    reorderable: true,
    optional: true,
    defaultVisible: false,
    icon: 'compass',
    hint: 'Hobbies and interests relevant to the role.',
  },
  {
    id: 'custom',
    title: 'Custom Sections',
    repeatable: true,
    reorderable: true,
    optional: true,
    defaultVisible: false,
    icon: 'plus',
    hint: 'Add any section you need — it renders exactly as you type it.',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a stable, sortable, URL-safe id. */
export function createId(prefix = 'id'): string {
  const time = Date.now().toString(36).padStart(8, '0');
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${time}${rand}`;
}

/** Create an empty resume content document. */
export function createEmptyContent(): ResumeContent {
  return {
    profile: { fullName: '', headline: '', email: '', phone: '', location: '', about: '', links: [] },
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

/** Create the default theme. */
export function createDefaultTheme(): Theme {
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

/** Create a blank resume document. */
export function createEmptyResume(title = 'Untitled Resume'): Resume {
  const now = new Date().toISOString();
  return {
    id: createId('res'),
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'resume',
    metadata: {
      template: 'ats-classic',
      theme: createDefaultTheme(),
      pageMargin: 0.6,
      pageSize: 'letter',
    },
    content: createEmptyContent(),
    createdAt: now,
    updatedAt: now,
  };
}
