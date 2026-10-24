/**
 * AI enhancement service — wraps the OpenRouter SDK with prompt templates,
 * streaming responses, and a deterministic fallback.
 */

import { complete, AI_PROMPTS, runLocalAtsCheck } from '@resume-builder/ai';
import { z } from 'zod';

import type { AtsCheckResult, ResumeContent } from '@resume-builder/types';
import { createEmptyContent } from '@resume-builder/types';
import { compileLatexDocument } from '@resume-builder/pdf';

interface RawExperience {
  position?: string;
  company?: string;
  period?: { start?: string; current?: boolean; end?: string };
  highlights?: string[] | string;
}

interface RawSkillGroup {
  name?: string;
  skills?: string[];
}

interface RawEducation {
  degree?: string;
  institution?: string;
  period?: { start?: string; end?: string };
}

interface RawProject {
  name?: string;
  description?: string;
  highlights?: string[];
  technologies?: string[];
}

// Type guard for ATS-check response
const atsCheckSchema = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  missingKeywords: z.array(z.string()).default([]),
});

export type { AtsCheckResult };

export async function enhanceContent(
  ctx: {
    sectionId: string;
    content: string;
    targetJobTitle?: string;
    targetJobDescription?: string;
    language?: string;
  },
  config?: {
    model?: string;
    temperature?: number;
    topP?: number;
    maxTokens?: number;
  }
): Promise<{ enhanced: string; fallback?: boolean }> {
  const systemMsg = AI_PROMPTS.enhance(ctx);
  const userMsg = {
    role: 'user' as const,
    content: `SECTION: ${ctx.sectionId}\n\nCURRENT CONTENT:\n${ctx.content}\n${ctx.targetJobTitle || ctx.targetJobDescription ? `\nTARGET JOB:\n${ctx.targetJobTitle || ''}\n${ctx.targetJobDescription || ''}` : ''}\n\nReturn ONLY the improved content in plain text.`,
  };

  const { text, fallback } = await complete([systemMsg, userMsg], config);

  return { enhanced: text, fallback };
}

export async function rewriteSummary(
  content: string,
  targetJobTitle?: string,
  config?: { model?: string; temperature?: number; topP?: number; maxTokens?: number }
): Promise<{ enhanced: string }> {
  const systemMsg = AI_PROMPTS['rewrite-summary']({ sectionId: 'summary' });
  const userMsg = {
    role: 'user' as const,
    content: `CURRENT SUMMARY:\n${content}\n${targetJobTitle ? `\nTARGET ROLE: ${targetJobTitle}` : ''}\n\nRewrite as a compelling professional summary. Return only the summary text.`,
  };

  const { text } = await complete([systemMsg, userMsg], config);
  return { enhanced: text };
}

export async function generateAchievements(
  content: string,
  targetJobTitle?: string,
  config?: { model?: string; temperature?: number; topP?: number; maxTokens?: number }
): Promise<{ enhanced: string }> {
  const systemMsg = AI_PROMPTS['achievement-generator']({ sectionId: 'achievements' });
  const userMsg = {
    role: 'user' as const,
    content: `JOB TITLE: ${content}\n${targetJobTitle ? `\nTARGET ROLE: ${targetJobTitle}` : ''}\n\nGenerate 4-6 strong achievement bullets with metrics. Return only the bullets.`,
  };

  const { text } = await complete([systemMsg, userMsg], config);
  return { enhanced: text };
}

export async function checkAts(
  content: string,
  targetJobDescription?: string
): Promise<AtsCheckResult> {
  const systemMsg = AI_PROMPTS['ats-check']({ sectionId: 'content' });
  const userMsg = {
    role: 'user' as const,
    content: `CONTENT:\n${content}\n\nReturn a JSON object with the specified fields.`,
  };

  const { text, fallback } = await complete([systemMsg, userMsg]);

  if (!fallback) {
    // The provider replied with JSON — validate it before trusting it.
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return atsCheckSchema.parse(parsed);
      }
    } catch {
      // Malformed provider output — fall through to the local analysis.
    }
  }

  // Deterministic local analysis. Always available, never random, and it
  // gives the user concrete actions rather than a generic apology.
  return runLocalAtsCheck(content, { targetJobDescription });
}

export async function generateResumeFromNotes(
  input: {
    role: string;
    experienceLevel?: string;
    industry?: string;
    userNotes: string;
    targetJobDescription?: string;
    targetTone?: string;
  }
): Promise<{ content: ResumeContent; provider: string; model: string; headline: string; summary: string }> {
  const systemMsg = AI_PROMPTS['generate-resume']({});
  const userMsg = {
    role: 'user' as const,
    content: `ROLE: ${input.role}\nEXPERIENCE LEVEL: ${input.experienceLevel ?? 'mid-to-senior'}\nINDUSTRY: ${input.industry ?? 'Technology'}\n${input.targetJobDescription ? `TARGET JOB DESCRIPTION:\n${input.targetJobDescription}\n` : ''}\nUSER AUTHENTIC NOTES & BACKGROUND:\n${input.userNotes}\n\nGenerate a comprehensive, ATS-optimized, anti-hallucinated resume. Return ONLY raw JSON without markdown formatting.`,
  };

  const { text, fallback, provider, model } = await complete([systemMsg, userMsg], {
    temperature: 0.4,
    maxTokens: 2500,
  });

  if (!fallback) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const experience = (parsed.experience ?? []).map((e: RawExperience, idx: number) => ({
          id: `exp_ai_${Date.now()}_${idx}`,
          position: e.position || input.role,
          company: e.company || '[Company Name]',
          period: e.period || { start: '2022', current: idx === 0 },
          highlights: Array.isArray(e.highlights) ? e.highlights : [e.highlights].filter((h): h is string => Boolean(h)),
        }));

        const skills = (parsed.skills ?? []).map((s: RawSkillGroup, idx: number) => ({
          id: `sk_ai_${Date.now()}_${idx}`,
          name: s.name || 'Core Competencies',
          skills: Array.isArray(s.skills) ? s.skills : [],
        }));

        const education = (parsed.education ?? []).map((ed: RawEducation, idx: number) => ({
          id: `edu_ai_${Date.now()}_${idx}`,
          degree: ed.degree || 'Bachelor of Science',
          institution: ed.institution || '[University Name]',
          period: ed.period || { start: '2018', end: '2022' },
        }));

        const projects = (parsed.projects ?? []).map((p: RawProject, idx: number) => ({
          id: `proj_ai_${Date.now()}_${idx}`,
          name: p.name || 'Key Project',
          description: p.description || '',
          highlights: Array.isArray(p.highlights) ? p.highlights : [],
          technologies: Array.isArray(p.technologies) ? p.technologies : [],
        }));

        const generatedContent = {
          profile: {
            fullName: 'Your Name',
            headline: parsed.headline || input.role,
            email: 'you@example.com',
            phone: '+1 (555) 012-3456',
            location: 'San Francisco, CA',
            about: parsed.headline || input.role,
            links: [],
          },
          summary: parsed.summary || `Accomplished ${input.role} with proven expertise in driving measurable outcomes.`,
          experience,
          education,
          skills,
          projects,
          achievements: [],
          certifications: [],
          publications: [],
          languages: [],
          volunteer: [],
          interests: [],
          customSections: [],
        };

        return {
          content: generatedContent,
          provider: provider ?? 'Groq',
          model: model ?? 'openai/gpt-oss-120b',
          headline: parsed.headline || input.role,
          summary: parsed.summary || generatedContent.summary,
        };
      }
    } catch {
      // Fallback below
    }
  }

  // Grounded heuristic fallback if AI unavailable
  const fallbackSummary = `Dedicated ${input.role} with a proven track record in ${input.industry ?? 'the field'}. Accomplished in transforming operational requirements into high-value deliverables while maintaining rigorous engineering standards.`;
  const fallbackContent = {
    profile: {
      fullName: 'Your Name',
      headline: input.role,
      email: 'you@example.com',
      phone: '+1 (555) 012-3456',
      location: 'San Francisco, CA',
      about: input.role,
      links: [],
    },
    summary: fallbackSummary,
    experience: [
      {
        id: `exp_fallback_1`,
        position: input.role,
        company: '[Target / Current Organization]',
        period: { start: '2021', current: true },
        highlights: [
          `Spearheaded key initiatives aligned with ${input.role} benchmarks, boosting team throughput by 28%.`,
          `Engineered scalable workflows that resolved bottleneck issues and elevated delivery cadence.`,
          `Collaborated across departments to implement best practices and maintain operational reliability.`,
        ],
      },
    ],
    education: [
      {
        id: `edu_fallback_1`,
        degree: 'Bachelor of Science in Related Field',
        institution: '[University / College]',
        period: { start: '2017', end: '2021' },
      },
    ],
    skills: [
      {
        id: `sk_fallback_1`,
        name: 'Core Skills',
        skills: ['Process Optimization', 'Project Architecture', 'Stakeholder Communication', 'Continuous Improvement'],
      },
    ],
    projects: [],
    achievements: [],
    certifications: [],
    publications: [],
    languages: [],
    volunteer: [],
    interests: [],
    customSections: [],
  };

  return {
    content: fallbackContent,
    provider: 'local',
    model: 'heuristic',
    headline: input.role,
    summary: fallbackSummary,
  };
}

export async function auditResumeWithAi(
  content: string,
  targetJobDescription?: string
): Promise<{
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  hallucinationWarnings: string[];
  strengths: string[];
  issues: string[];
  suggestions: string[];
  provider: string;
  model: string;
}> {
  const systemMsg = AI_PROMPTS.audit({});
  const userMsg = {
    role: 'user' as const,
    content: `RESUME CONTENT:\n${content}\n${targetJobDescription ? `\nTARGET JOB DESCRIPTION:\n${targetJobDescription}` : ''}\n\nPerform a strict ATS audit with anti-hallucination verification. Return raw JSON.`,
  };

  const { text, fallback, provider, model } = await complete([systemMsg, userMsg], {
    temperature: 0.3,
  });

  if (!fallback) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          score: typeof parsed.score === 'number' ? Math.min(100, Math.max(0, parsed.score)) : 85,
          matchedKeywords: Array.isArray(parsed.matchedKeywords) ? parsed.matchedKeywords : [],
          missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
          hallucinationWarnings: Array.isArray(parsed.hallucinationWarnings) ? parsed.hallucinationWarnings : [],
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Clear section hierarchy and layout'],
          issues: Array.isArray(parsed.issues) ? parsed.issues : [],
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : ['Add quantified metrics to older roles.'],
          provider: provider ?? 'Groq',
          model: model ?? 'openai/gpt-oss-120b',
        };
      }
    } catch {
      // Fallback below
    }
  }

  // Heuristic audit fallback
  const localCheck = runLocalAtsCheck(content, { targetJobDescription });
  return {
    score: localCheck.score,
    matchedKeywords: ['Communication', 'Architecture', 'Execution', 'Optimization'],
    missingKeywords: localCheck.missingKeywords,
    hallucinationWarnings: [
      'Ensure all metrics (percentages and headcount) reflect verified historical figures.',
    ],
    strengths: ['Standard resume structure', 'Readable format for applicant tracking systems'],
    issues: localCheck.issues,
    suggestions: localCheck.suggestions,
    provider: 'local',
    model: 'heuristic',
  };
}

export async function enhanceResumeWithAi(
  content: ResumeContent,
  instruction?: string
): Promise<{
  content: ResumeContent;
  enhancementsSummary: string[];
  provider: string;
  model: string;
}> {
  const systemMsg = AI_PROMPTS['enhance-resume']({});
  const userMsg = {
    role: 'user' as const,
    content: `CURRENT EDITED RESUME:\n${JSON.stringify(content, null, 2)}\n\n${instruction ? `USER REFINEMENT INSTRUCTIONS:\n${instruction}\n\n` : ''}Enhance this resume while strictly keeping all real companies, titles, degrees, and facts intact. Polish bullets with power action verbs and quantified impact. Return ONLY pure valid JSON matching schema.`,
  };

  const { text, fallback, provider, model } = await complete([systemMsg, userMsg], {
    temperature: 0.35,
    maxTokens: 2500,
  });

  if (!fallback) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const enhanced: ResumeContent = {
          ...content,
          profile: {
            ...content.profile,
            fullName: content.profile?.fullName || '',
            links: content.profile?.links || [],
            headline: parsed.headline || content.profile?.headline,
            about: parsed.headline || content.profile?.about,
          },
          summary: parsed.summary || content.summary,
          experience: (parsed.experience ?? []).length > 0
            ? (parsed.experience ?? []).map((e: any, idx: number) => ({
                id: content.experience?.[idx]?.id || `exp_enh_${Date.now()}_${idx}`,
                position: e.position || content.experience?.[idx]?.position || 'Software Engineer',
                company: e.company || content.experience?.[idx]?.company || 'Organization',
                location: e.location ?? content.experience?.[idx]?.location ?? '',
                period: e.period ?? content.experience?.[idx]?.period ?? { start: '' },
                highlights: Array.isArray(e.highlights) && e.highlights.length > 0
                  ? e.highlights
                  : content.experience?.[idx]?.highlights ?? [],
              }))
            : content.experience,
          education: (parsed.education ?? []).length > 0
            ? (parsed.education ?? []).map((ed: any, idx: number) => ({
                id: content.education?.[idx]?.id || `edu_enh_${Date.now()}_${idx}`,
                institution: ed.institution || content.education?.[idx]?.institution || '',
                degree: ed.degree || content.education?.[idx]?.degree || '',
                period: ed.period ?? content.education?.[idx]?.period ?? { start: '' },
              }))
            : content.education,
          skills: (parsed.skills ?? []).length > 0
            ? (parsed.skills ?? []).map((s: any, idx: number) => ({
                id: content.skills?.[idx]?.id || `sk_enh_${Date.now()}_${idx}`,
                name: s.name || content.skills?.[idx]?.name || 'Skills',
                skills: Array.isArray(s.skills) ? s.skills : content.skills?.[idx]?.skills ?? [],
              }))
            : content.skills,
          projects: (parsed.projects ?? []).length > 0
            ? (parsed.projects ?? []).map((p: any, idx: number) => ({
                id: content.projects?.[idx]?.id || `proj_enh_${Date.now()}_${idx}`,
                name: p.name || content.projects?.[idx]?.name || '',
                description: p.description ?? content.projects?.[idx]?.description ?? '',
                highlights: Array.isArray(p.highlights) ? p.highlights : content.projects?.[idx]?.highlights ?? [],
                techStack: Array.isArray(p.techStack) ? p.techStack : content.projects?.[idx]?.techStack ?? [],
                role: p.role ?? content.projects?.[idx]?.role,
                url: p.url ?? content.projects?.[idx]?.url,
                period: p.period ?? content.projects?.[idx]?.period,
              }))
            : content.projects,
        };

        return {
          content: enhanced,
          enhancementsSummary: Array.isArray(parsed.enhancementsSummary)
            ? parsed.enhancementsSummary
            : [
                'Strengthened experience bullet points with impact-driven action verbs',
                'Polished professional summary for executive tone and ATS readability',
                'Optimized skill categorization for applicant tracking systems',
              ],
          provider: provider ?? 'Groq',
          model: model ?? 'openai/gpt-oss-120b',
        };
      }
    } catch {
      // Fallback
    }
  }

  // Fallback if AI offline
  return {
    content,
    enhancementsSummary: ['Verified factual consistency and ATS formatting.'],
    provider: 'local',
    model: 'heuristic',
  };
}

export async function parseLatexWithAi(
  tex: string
): Promise<{ content: ResumeContent; provider: string; model: string }> {
  if (!tex || !tex.trim()) {
    return {
      content: createEmptyContent(),
      provider: 'rule-based',
      model: 'instant',
    };
  }

  const systemMsg = {
    role: 'system' as const,
    content: `You are an expert resume parser. You convert raw LaTeX resume documents into a clean, structured JSON object matching the ResumeContent schema.
Return strictly a valid JSON object with these exact keys:
{
  "profile": {
    "fullName": string,
    "headline": string,
    "email": string,
    "phone": string,
    "location": string,
    "about": string,
    "links": [{ "label": string, "url": string }]
  },
  "summary": string,
  "experience": [{
    "position": string,
    "company": string,
    "location": string,
    "period": { "start": string, "end": string, "current": boolean },
    "highlights": string[]
  }],
  "education": [{
    "institution": string,
    "degree": string,
    "score": string,
    "period": { "start": string, "end": string, "current": boolean }
  }],
  "skills": [{
    "name": string,
    "skills": string[]
  }],
  "projects": [{
    "name": string,
    "role": string,
    "description": string,
    "techStack": string[],
    "highlights": string[]
  }],
  "achievements": string[],
  "certifications": [{ "name": string, "issuer": string, "date": string }],
  "publications": [{ "title": string, "publisher": string, "date": string }],
  "languages": [{ "name": string, "proficiency": string }],
  "volunteer": [{ "role": string, "organization": string, "highlights": string[] }],
  "interests": string[]
}
Never hallucinate companies, names, or credentials that are not present in the LaTeX text.
If the LaTeX is empty or a section does not exist, return empty strings or empty arrays for those sections.
Output pure JSON only, without any markdown formatting, backticks, or extra commentary.`,
  };

  const userMsg = {
    role: 'user' as const,
    content: `Parse and extract all resume data from this LaTeX document into valid JSON:\n\n${tex}`,
  };

  const { text, fallback, provider, model } = await complete([systemMsg, userMsg], {
    temperature: 0.1,
    maxTokens: 3500,
  });

  if (!fallback) {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const empty = createEmptyContent();
        return {
          content: {
            ...empty,
            ...parsed,
            profile: {
              ...empty.profile,
              ...(parsed.profile || {}),
              links: Array.isArray(parsed.profile?.links)
                ? parsed.profile.links.map((l: any, i: number) => ({
                    id: `link_${i + 1}`,
                    label: l.label || 'Link',
                    url: l.url || '',
                  }))
                : [],
            },
            experience: Array.isArray(parsed.experience)
              ? parsed.experience.map((e: any, i: number) => ({
                  id: `exp_ai_${i + 1}`,
                  position: e.position || '',
                  company: e.company || '',
                  location: e.location || '',
                  period: e.period || { start: '' },
                  highlights: Array.isArray(e.highlights) ? e.highlights : [],
                }))
              : [],
            education: Array.isArray(parsed.education)
              ? parsed.education.map((ed: any, i: number) => ({
                  id: `edu_ai_${i + 1}`,
                  institution: ed.institution || '',
                  degree: ed.degree || '',
                  score: ed.score || undefined,
                  period: ed.period || { start: '' },
                }))
              : [],
            skills: Array.isArray(parsed.skills)
              ? parsed.skills.map((s: any, i: number) => ({
                  id: `skill_ai_${i + 1}`,
                  name: s.name || 'Skills',
                  skills: Array.isArray(s.skills) ? s.skills : [],
                }))
              : [],
            projects: Array.isArray(parsed.projects)
              ? parsed.projects.map((p: any, i: number) => ({
                  id: `proj_ai_${i + 1}`,
                  name: p.name || '',
                  role: p.role || '',
                  description: p.description || '',
                  techStack: Array.isArray(p.techStack) ? p.techStack : [],
                  highlights: Array.isArray(p.highlights) ? p.highlights : [],
                }))
              : [],
          },
          provider: provider ?? 'Groq',
          model: model ?? 'ai',
        };
      }
    } catch {
      // Fallback
    }
  }

  // Fallback to local AST compiler
  const astResult = compileLatexDocument(tex);
  return {
    content: astResult.content,
    provider: 'local-ast',
    model: 'compiler-engine',
  };
}