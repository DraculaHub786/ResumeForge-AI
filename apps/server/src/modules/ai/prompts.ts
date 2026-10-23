/**
 * Resume AI prompt templates served from the backend.
 *
 * The canonical templates live in `@resume-builder/ai` so the web app and the
 * API always speak the same prompt. This module re-exports them so the server
 * can keep a stable import path.
 */

export { AI_PROMPTS, type PromptContext, type SystemMessage } from '@resume-builder/ai';
