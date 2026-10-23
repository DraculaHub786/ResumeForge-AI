/**
 * Shared types for the resumes module.
 *
 * The wire contract lives in `@resume-builder/types` so the frontend and
 * backend cannot drift. This module re-exports it for local use.
 */
import type {
  Resume,
  ResumeType,
  ResumeFilters,
  PaginateParams,
  PaginatedResumes,
} from '@resume-builder/types';

/** A resume as returned by the API: dates are ISO strings, not `Date`. */
export type ResumeRow = Resume;

export type {
  Resume,
  ResumeType,
  ResumeFilters,
  PaginateParams,
  PaginatedResumes,
};
