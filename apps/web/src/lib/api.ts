/**
 * API client for the backend.
 *
 * All HTTP calls from the editor flow go through this module. It normalises
 * error responses and provides typed helpers for the resume builder flow.
 */

import type {
  ResumeType,
  ResumeDraft,
  ResumeContent,
  ResumeFilters,
  PaginateParams,
  PaginatedResumes,
} from '@resume-builder/types';
import { API_URL } from './env';

const BASE_URL = API_URL;

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    // The session cookie is issued by the API origin.
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    const err = Object.assign(new Error(errBody || `HTTP ${res.status}`), {
      status: res.status,
      body: errBody,
    });
    throw err;
  }

  // 204 (and any other empty body) has no JSON to parse — calling
  // `res.json()` on it throws and the caller sees a spurious failure.
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('The server returned a malformed response');
  }
}

/** Health check. */
export async function health(): Promise<{ status: string }> {
  return request(`${BASE_URL}/api/v1/health`);
}

/** Resume CRUD */
export async function listResumes(
  filters: ResumeFilters = {},
  params: PaginateParams = {}
): Promise<PaginatedResumes> {
  const query = new URLSearchParams();
  if (filters.search) query.set('search', filters.search);
  if (filters.template) query.set('template', filters.template);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return request(`${BASE_URL}/api/v1/resumes${qs ? `?${qs}` : ''}`, {
    method: 'GET',
  });
}

export async function getResume(id: string): Promise<ResumeType> {
  return request(`${BASE_URL}/api/v1/resumes/${id}`, {
    method: 'GET',
  });
}

export async function createResume(
  data: Partial<ResumeType> & { title: string }
): Promise<ResumeType> {
  return request(`${BASE_URL}/api/v1/resumes`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateResume(
  id: string,
  data: Partial<ResumeDraft>
): Promise<ResumeType> {
  return request(`${BASE_URL}/api/v1/resumes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteResume(id: string): Promise<void> {
  await request(`${BASE_URL}/api/v1/resumes/${id}`, {
    method: 'DELETE',
  });
}

/** AI enhancement */
export async function aiEnhance(
  body: {
    sectionId: string;
    content: string;
    targetJobTitle?: string;
    targetJobDescription?: string;
  },
  config?: { model?: string; temperature?: number }
) {
  return request<{ enhanced: string; fallback?: boolean }>(`${BASE_URL}/api/v1/ai/enhance`, {
    method: 'POST',
    body: JSON.stringify(body),
    ...(config?.model ? { headers: { 'x-model': config.model } } : {}),
  });
}

export async function aiRewriteSummary(
  content: string,
  targetJobTitle?: string
) {
  return request<{ enhanced: string }>(`${BASE_URL}/api/v1/ai/rewrite-summary`, {
    method: 'POST',
    body: JSON.stringify({ content, targetJobTitle }),
  });
}

export async function aiAchievementGenerator(
  content: string,
  targetJobTitle?: string
) {
  return request<{ enhanced: string }>(`${BASE_URL}/api/v1/ai/achievement-generator`, {
    method: 'POST',
    body: JSON.stringify({ content, targetJobTitle }),
  });
}

export async function aiAtsCheck(content: string, targetJobDescription?: string) {
  return request<{ score: number; issues: string[]; suggestions: string[]; missingKeywords: string[]; matchedKeywords?: string[] }>(`${BASE_URL}/api/v1/ai/ats-check`, {
    method: 'POST',
    body: JSON.stringify({ content, targetJobDescription }),
  });
}

export async function aiGetStatus(): Promise<{ active: boolean; provider: string; model: string }> {
  return request(`${BASE_URL}/api/v1/ai/status`);
}

export async function aiGenerateResume(data: {
  role: string;
  experienceLevel?: string;
  industry?: string;
  userNotes: string;
  targetJobDescription?: string;
  targetTone?: string;
}) {
  return request<{
    content: ResumeContent;
    provider: string;
    model: string;
    headline: string;
    summary: string;
  }>(`${BASE_URL}/api/v1/ai/generate-resume`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function aiAudit(content: string, targetJobDescription?: string) {
  return request<{
    score: number;
    matchedKeywords: string[];
    missingKeywords: string[];
    hallucinationWarnings: string[];
    strengths: string[];
    issues: string[];
    suggestions: string[];
    provider: string;
    model: string;
  }>(`${BASE_URL}/api/v1/ai/audit`, {
    method: 'POST',
    body: JSON.stringify({ content, targetJobDescription }),
  });
}

export async function aiEnhanceResume(content: ResumeContent, instruction?: string) {
  return request<{
    content: ResumeContent;
    enhancementsSummary: string[];
    provider: string;
    model: string;
  }>(`${BASE_URL}/api/v1/ai/enhance-resume`, {
    method: 'POST',
    body: JSON.stringify({ content, instruction }),
  });
}

export async function aiParseLatex(tex: string) {
  return request<{
    content: ResumeContent;
    provider: string;
    model: string;
  }>(`${BASE_URL}/api/v1/ai/parse-latex`, {
    method: 'POST',
    body: JSON.stringify({ tex }),
  });
}

/** Export endpoints — client can trigger these via window.open or Blob URLs */
export async function exportPdfLatex(content: ResumeContent) {
  const res = await fetch(`${BASE_URL}/api/v1/export/latex`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('PDF export failed');
  const text = await res.text();
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  return url;
}

/** DOCX export — server sends a blob URL or forces download. */
export async function exportDocx(content: ResumeContent) {
  const res = await fetch(`${BASE_URL}/api/v1/export/docx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error('DOCX export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return url;
}

/** PNG export — renders a preview PNG via html2canvas and sends it. */
export async function exportPng(html: string) {
  const res = await fetch(`${BASE_URL}/api/v1/export/png`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html }),
  });
  if (!res.ok) throw new Error('PNG export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  return url;
}