/**
 * Shared API contract types — the response shapes the server must return.
 *
 * Keeping these in the shared package means both the backend server and the
 * frontend client agree on the wire format. The server additionally defines
 * {@link ResumeRow} locally for Drizzle projection; that shape is structurally
 * compatible so the same interface can be reused.
 */
import type {
  ResumeContent,
  ResumeDraft,
  ResumeMetadata,
  Resume,
} from './resume.js';

/** List parameters sent to `POST /resumes`. */
export interface ResumeFilters {
  userId?: string | null;
  search?: string;
  template?: string;
}

export interface PaginateParams {
  page?: number;
  limit?: number;
}

/** A page of resumes returned by `POST /resumes`. */
export interface PaginatedResumes {
  items: Resume[];
  total: number;
  page: number;
  limit: number;
}

/** A resume as returned by the API (dates are ISO strings). */
export type ResumeType = Resume;

/** Result of an ATS compatibility analysis. */
export interface AtsCheckResult {
  /** 0-100 compatibility score. */
  score: number;
  /** Problems found in the resume. */
  issues: string[];
  /** Concrete actions that would raise the score. */
  suggestions: string[];
  /** Job keywords that do not appear in the resume. */
  missingKeywords: string[];
  matchedKeywords?: string[];
}

/** Input for AI Resume Generation from user background / prompt. */
export interface GenerateResumeInput {
  role: string;
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  industry?: string;
  userNotes: string;
  targetJobDescription?: string;
  targetTone?: string;
}

/** Result of AI Resume Generation. */
export interface GenerateResumeResult {
  content: ResumeContent;
  provider: string;
  model: string;
  headline: string;
  summary: string;
}

/** In-depth audit with anti-hallucination validation and ATS match. */
export interface AuditResumeResult extends AtsCheckResult {
  matchedKeywords: string[];
  hallucinationWarnings: string[];
  strengths: string[];
  provider: string;
  model: string;
}
