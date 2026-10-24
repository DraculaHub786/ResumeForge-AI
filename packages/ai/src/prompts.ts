/**
 * Resume-specific AI prompt templates.
 *
 * Each template is a { system, user } pair consumed by the OpenRouter client.
 * The system prompt encodes the resume-building persona; the user prompt
 * carries the user's content plus any context (target job description, etc.).
 */

import type { SectionId } from '@resume-builder/types';

// ---------------------------------------------------------------------------
// Shared system prompt
// ---------------------------------------------------------------------------

export const RESUME_BUILDER_SYSTEM = `You are an expert resume writer and ATS optimiser.

Your job is to help users write resumes that get past automated tracking
systems (ATS) and impress human recruiters.

Rules:
1. Use strong action verbs at the start of every bullet point
   (Led, Developed, Implemented, Designed, Built, Managed, Created,
   Improved, Reduced, Increased, Coordinated, Executed, Optimized,
   Spearheaded, Orchestrated, Automated, Negotiated).
2. Quantify results with metrics whenever possible (% , $, numbers,
   time saved, users served, revenue generated).
3. Keep bullets tight: 1-2 lines max, no more than 6 bullets per job.
4. Never invent companies, dates, degrees, or metrics the user didn't
   provide. If something is missing, say "[add X]" rather than making it up.
5. Output only the enhanced content — no preamble, no apology, no
   "Here is your improved version:" framing.
6. Use plain English. Avoid buzzword soup.
7. For ATS compatibility: use standard section headings and full words
   (not abbreviations only). Include both "SQL" and "Structured Query Language"
   if space allows.
8. Preserve the user's voice — don't over-polish into corporate speak.
`;

// ---------------------------------------------------------------------------
// Template builders
// ---------------------------------------------------------------------------

export type PromptTemplate = {
  system: string;
  user: (ctx: PromptContext) => string;
};

export interface PromptContext {
  sectionId: SectionId;
  content: string;
  targetJobTitle?: string;
  targetJobDescription?: string;
  language?: string;
}

/** A single chat message, shaped for the `ai` SDK's `messages` array. */
export interface SystemMessage {
  role: 'system';
  content: string;
}

/**
 * Loose input accepted by the ready-to-send {@link AI_PROMPTS} templates.
 *
 * These templates bake their instructions into the system message, so the
 * caller only needs to identify what it is asking for — the section id may be
 * a real `SectionId` or an ad-hoc label such as `'content'`.
 */
export interface AiPromptInput {
  sectionId?: string;
  content?: string;
  targetJobTitle?: string;
  targetJobDescription?: string;
  language?: string;
}

/** Build a system+user prompt pair for any section enhancement. */
export function buildEnhancePrompt(ctx: PromptContext): { system: string; user: string } {
  const { sectionId, content, targetJobTitle, targetJobDescription } = ctx;

  const sectionSpecific = sectionSpecificInstruction(sectionId);

  const jobContext = targetJobTitle || targetJobDescription
    ? `\n\nTARGET JOB CONTEXT:
${targetJobTitle ? `Title: ${targetJobTitle}` : ''}
${targetJobDescription ? `Description: ${targetJobDescription}` : ''}
Tailor the content to match this role without inventing details.`
    : '';

  const user = `SECTION TYPE: ${sectionId}
CURRENT CONTENT:
${content}
${jobContext}

${sectionSpecific}

Return ONLY the enhanced content in plain text.
Format: ${sectionFormat(sectionId)}`;

  return { system: RESUME_BUILDER_SYSTEM, user };
}

/** Instructions specific to each section type. */
function sectionSpecificInstruction(sectionId: SectionId): string {
  const instructions: Record<SectionId, string> = {
    profile:
      'Rewrite the contact block to be clean and professional. ' +
      'Keep name, headline, email, phone, location, and links.',
    summary:
      'Write 3-4 tight sentences. Lead with the role + years of ' +
      'experience, then 2-3 core strengths, then a goal statement.',
    experience:
      'Enhance each job entry. Keep title, company, dates. ' +
      'Rewrite each bullet to start with an action verb and add metrics.',
    education:
      'Format degree, institution, dates, and any honours clearly. ' +
      'Keep coursework to 3-4 relevant items max.',
    skills:
      'Group skills into logical categories (Languages, Frameworks, ' +
      'Tools, Platforms). Remove duplicates. Keep each category to ~8 skills.',
    projects:
      'Rewrite each project: name, role, one-line description, ' +
      '2-3 impact bullets with metrics, tech stack.',
    achievements:
      'Turn each line into a concrete accomplishment with ' +
      'metrics where possible.',
    certifications:
      'Format as: Name — Issuer — Date. Keep to relevant ' +
      'professional credentials.',
    publications:
      'Format as: Title — Publication — Year. ' +
      'Add a one-line description if provided.',
    languages: 'Format as: Language — Proficiency level.',
    volunteer: 'Format as: Role — Organization — Dates — impact bullets.',
    interests: 'Keep to 3-5 short items relevant to professional life.',
    custom:
      "Improve readability and clarity while preserving the user's wording.",
  };
  return instructions[sectionId] ?? instructions.custom;
}

/** Expected output format per section. */
function sectionFormat(sectionId: SectionId): string {
  const formats: Record<SectionId, string> = {
    profile: 'Newlines, one field per line.',
    summary: '3-4 sentences, one paragraph.',
    experience:
      'One job per entry separated by a blank line; bullets on new lines.',
    education: 'One entry per line/block.',
    skills: 'Category: skill1, skill2, ... (one category per line).',
    projects: 'One project per entry separated by a blank line.',
    achievements: 'One achievement per line.',
    certifications: 'One per line.',
    publications: 'One per line.',
    languages: 'One per line.',
    volunteer: 'One per line.',
    interests: 'Comma-separated list.',
    custom: 'Plain text, preserved structure.',
  };
  return formats[sectionId] ?? formats.custom;
}

// ---------------------------------------------------------------------------
// Named prompt presets
// ---------------------------------------------------------------------------

export const PROMPT_PRESETS: Record<string, PromptTemplate> = {
  enhance: {
    system: RESUME_BUILDER_SYSTEM,
    user: ({ sectionId, content, targetJobDescription }) => `
SECTION: ${sectionId}
CURRENT:
${content}
${targetJobDescription ? `\nTARGET JD:\n${targetJobDescription}` : ''}

Enhance for impact and ATS compatibility. Return only the improved content.
`,
  },
  'rewrite-summary': {
    system: RESUME_BUILDER_SYSTEM,
    user: ({ content, targetJobTitle }) => `
CURRENT SUMMARY:
${content}
${targetJobTitle ? `\nTARGET ROLE: ${targetJobTitle}` : ''}

Rewrite as a compelling professional summary. Return only the summary text.
`,
  },
  'achievement-generator': {
    system: RESUME_BUILDER_SYSTEM,
    user: ({ content, targetJobTitle }) => `
JOB TITLE: ${content}
${targetJobTitle ? `\nTARGET ROLE: ${targetJobTitle}` : ''}

Generate 4-6 strong achievement bullets with metrics. Return only the bullets.
`,
  },
  'ats-check': {
    system: `You are an ATS compliance analyst. Score resumes for ATS friendliness
and identify missing keywords, formatting issues, and weak language.`,
    user: ({ content }) => `CONTENT:\n${content}\n\nReturn a JSON object:
{ score: number (0-100), issues: string[], suggestions: string[], missingKeywords: string[] }`,
  },
};

// ---------------------------------------------------------------------------
// Chat-message prompt templates
// ---------------------------------------------------------------------------

/**
 * Ready-to-send chat messages for each AI operation.
 *
 * `complete()` takes an array of chat messages, so these return the system
 * message already shaped for the OpenRouter `messages` array.
 */
export const AI_PROMPTS = {
  enhance: (_ctx: AiPromptInput): SystemMessage => ({
    role: 'system',
    content:
      'You are an expert resume writer and ATS optimiser.\n' +
      'Use strong action verbs at the start of every bullet point. Quantify results with metrics whenever possible. Keep bullets tight (1-2 lines max, no more than 6 bullets per job). Never invent details. Output only the enhanced content. Use standard section headings and full words for ATS compatibility. Preserve the user voice.',
  }),
  'rewrite-summary': (_ctx: AiPromptInput): SystemMessage => ({
    role: 'system',
    content:
      'You are an expert resume writer. Rewrite the summary as 3-4 tight sentences. Lead with the role + years of experience, then 2-3 core strengths, then a goal statement. Output only the summary text.',
  }),
  'achievement-generator': (_ctx: AiPromptInput): SystemMessage => ({
    role: 'system',
    content:
      'You are an expert resume writer. Generate 4-6 strong achievement bullets with metrics. Return only the bullets.',
  }),
  'ats-check': (_ctx: AiPromptInput): SystemMessage => ({
    role: 'system',
    content:
      'You are an ATS compliance analyst. Score resumes 0-100 and identify missing keywords, formatting issues, and weak language. Return JSON: { score: number, issues: string[], suggestions: string[], missingKeywords: string[] }',
  }),
  'generate-resume': (_ctx: AiPromptInput): SystemMessage => ({
    role: 'system',
    content:
      'You are an expert resume architect and ATS engineer powered by Groq.\n' +
      'ANTI-HALLUCINATION INSTRUCTIONS:\n' +
      '1. Strictly ground all generated items on the user-provided background, role, and notes.\n' +
      '2. Do NOT invent fake employers or fake academic institutions. If missing, use placeholders like "[Company Name]" or "[University Name]".\n' +
      '3. Transform user duties into strong, measurable accomplishment bullets starting with action verbs (Architected, Spearheaded, Engineered, Streamlined, Led, Optimized).\n' +
      '4. Output ONLY valid JSON matching this structure without markdown code blocks:\n' +
      '{\n' +
      '  "headline": string,\n' +
      '  "summary": string,\n' +
      '  "experience": [{ "position": string, "company": string, "period": { "start": string, "current": boolean }, "highlights": string[] }],\n' +
      '  "skills": [{ "name": string, "skills": string[] }],\n' +
      '  "education": [{ "degree": string, "institution": string, "period": { "start": string, "end": string } }],\n' +
      '  "projects": [{ "name": string, "description": string, "highlights": string[], "technologies": string[] }]\n' +
      '}',
  }),
  audit: (_ctx: AiPromptInput): SystemMessage => ({
    role: 'system',
    content:
      'You are a certified ATS Compliance & Resume Quality Auditor powered by Groq.\n' +
      'Evaluate the resume for ATS compatibility and content integrity.\n' +
      'Output ONLY a valid JSON object matching:\n' +
      '{\n' +
      '  "score": number (0-100),\n' +
      '  "matchedKeywords": string[],\n' +
      '  "missingKeywords": string[],\n' +
      '  "hallucinationWarnings": string[],\n' +
      '  "strengths": string[],\n' +
      '  "issues": string[],\n' +
      '  "suggestions": string[]\n' +
      '}',
  }),
  'enhance-resume': (_ctx: AiPromptInput): SystemMessage => ({
    role: 'system',
    content:
      'You are an elite Resume Enhancer powered by Groq AI.\n' +
      'Your task is to take an edited resume and enhance it to world-class professional standards.\n' +
      'STRICT ANTI-HALLUCINATION RULES:\n' +
      '1. NEVER invent fake employers, degrees, schools, dates, or certifications. Keep all factual identity and history 100% true to the original.\n' +
      '2. Upgrade weak descriptions and passive voice into high-impact accomplishments starting with powerful action verbs (e.g. Spearheaded, Architected, Engineered, Optimized, Streamlined).\n' +
      '3. Enhance clarity, conciseness, ATS keyword resonance, and executive tone.\n' +
      '4. If the user provides custom refinement instructions, apply them precisely to improve the draft.\n' +
      '5. Output ONLY valid JSON matching this schema (no markdown code blocks, pure JSON):\n' +
      '{\n' +
      '  "headline": string,\n' +
      '  "summary": string,\n' +
      '  "experience": [{ "position": string, "company": string, "location": string, "period": { "start": string, "end": string, "current": boolean }, "highlights": string[] }],\n' +
      '  "education": [{ "institution": string, "degree": string, "period": { "start": string, "end": string } }],\n' +
      '  "skills": [{ "name": string, "skills": string[] }],\n' +
      '  "projects": [{ "name": string, "description": string, "highlights": string[] }],\n' +
      '  "enhancementsSummary": string[]\n' +
      '}',
  }),
};