/**
 * Export service — generates PDF, DOCX, PNG and LaTeX source from a resume.
 *
 * The heavy lifting lives in `@resume-builder/pdf`:
 *   - the LaTeX emitter is shared with the web app, so a resume never
 *     exports two different documents
 *   - the server-side PDF writer produces selectable, ATS-safe text without
 *     needing a headless browser
 *
 * The browser export path (live preview → print → PDF) stays in the Next.js
 * app because it needs the rendered DOM.
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { ResumeContent, ResumeMetadata } from '@resume-builder/types';
import { resumeToLatexFromMetadata } from '@resume-builder/pdf';
import { resumeToPdf } from '@resume-builder/pdf/server';

const EXPORT_DIR = path.resolve(process.cwd(), 'exports');
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

function resolveFilename(resume: { title?: string }): string {
  const safe =
    (resume.title ?? 'resume')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'resume';
  return `${safe}-${uuidv4().slice(0, 8)}`;
}

/** Convert resume content to LaTeX source. */
export function latexFromResume(
  content: ResumeContent,
  metadata?: ResumeMetadata
): string {
  return resumeToLatexFromMetadata(content, metadata);
}

/** Generate a text-based, ATS-safe PDF from resume content. */
export async function generatePdfFromResume(
  content: ResumeContent,
  metadata?: ResumeMetadata
): Promise<Buffer> {
  const bytes = await resumeToPdf(content, {
    pageSize: metadata?.pageSize,
    pageMargin: metadata?.pageMargin,
    theme: metadata?.theme,
  });
  return Buffer.from(bytes);
}

/** Save a generated PDF buffer to disk (used by scheduled exports). */
export function savePdfBuffer(buffer: Buffer, resume: { title?: string }): string {
  const filename = `${resolveFilename(resume)}.pdf`;
  const filepath = path.join(EXPORT_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  return filepath;
}

/** Return the path to a previously saved PDF. */
export function getPdfPath(filename: string): string | null {
  const filepath = path.join(EXPORT_DIR, filename);
  return fs.existsSync(filepath) ? filepath : null;
}
