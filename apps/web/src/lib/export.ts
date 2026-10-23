/**
 * Export utilities.
 *
 * PDF:   rendered from the live preview DOM through the browser print
 *        pipeline (vector, selectable, ATS-safe text). Falls back to a
 *        rasterised html2canvas + jsPDF path when printing is unavailable.
 * DOCX:  generated with the `docx` library — a fully editable Word file.
 * PNG:   a high-resolution snapshot of the preview.
 * LaTeX: emitted as source for pdflatex.
 *
 * PDF / PNG / LaTeX live in `@resume-builder/pdf` so the browser and the API
 * server produce byte-identical LaTeX and share one set of page geometry.
 */

import type { ResumeContent, ResumeMetadata } from '@resume-builder/types';
import type { Paragraph as DocxParagraph } from 'docx';
import {
  exportPdf as pdfExport,
  exportPng as pngExport,
  exportPdfCanvasFallback,
} from '@resume-builder/pdf/browser';
import { resumeToLatexFromMetadata } from '@resume-builder/pdf';

export type ExportFormat = 'pdf' | 'docx' | 'png' | 'latex';

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilename(title: string, ext: string) {
  const base =
    (title || 'resume')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'resume';
  return `${base}.${ext}`;
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

/**
 * Export the resume as a PDF.
 *
 * Uses the browser's print pipeline against an isolated print window, which
 * produces vector, selectable, ATS-safe text — no rasterisation.
 */
export async function exportPdf(
  element: HTMLElement,
  title: string,
  metadata: ResumeMetadata
): Promise<void> {
  await pdfExport(element, title, {
    pageSize: metadata.pageSize,
    pageMargin: metadata.pageMargin,
  });
}

/** Raster PDF fallback via html2canvas + jsPDF. */
export async function exportPdfCanvas(
  element: HTMLElement,
  title: string,
  metadata: ResumeMetadata
): Promise<void> {
  await exportPdfCanvasFallback(element, title, {
    pageSize: metadata.pageSize,
    pageMargin: metadata.pageMargin,
  });
}

// ---------------------------------------------------------------------------
// PNG
// ---------------------------------------------------------------------------

export async function exportPng(
  element: HTMLElement,
  title: string
): Promise<void> {
  await pngExport(element, title);
}

// ---------------------------------------------------------------------------
// DOCX
// ---------------------------------------------------------------------------

/**
 * Build a DOCX resume using the `docx` library.
 *
 * The document is deliberately ATS-safe: standard headings, a single column,
 * no tables for layout, and no text boxes.
 */
export async function exportDocx(
  content: ResumeContent,
  metadata: ResumeMetadata,
  title: string
): Promise<void> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
  } = await import('docx');

  const accent = (metadata.theme.primaryColor ?? '#1e40af').replace('#', '');
  const children: DocxParagraph[] = [];

  const profile = content.profile ?? ({} as ResumeContent['profile']);

  // Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: profile.fullName || 'Your Name',
          bold: true,
          size: 36,
          font: 'Calibri',
        }),
      ],
    })
  );

  if (profile.headline) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [
          new TextRun({ text: profile.headline, size: 22, color: accent, font: 'Calibri' }),
        ],
      })
    );
  }

  const contact: string[] = [];
  if (profile.email) contact.push(profile.email);
  if (profile.phone) contact.push(profile.phone);
  if (profile.location) contact.push(profile.location);
  for (const link of profile.links ?? []) contact.push(`${link.label}: ${link.url}`);
  if (contact.length) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({ text: contact.join('  |  '), size: 18, color: '666666', font: 'Calibri' }),
        ],
      })
    );
  }

  const heading = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 100 },
      border: {
        bottom: { color: accent, space: 2, style: 'single', size: 6 },
      },
      children: [
        new TextRun({ text: text.toUpperCase(), bold: true, size: 22, color: accent, font: 'Calibri' }),
      ],
    });

  const body = (
    text: string,
    opts: { bold?: boolean; italic?: boolean; indent?: number } = {}
  ) =>
    new Paragraph({
      spacing: { after: 60 },
      indent: opts.indent ? { left: opts.indent } : undefined,
      children: [
        new TextRun({
          text,
          bold: opts.bold,
          italics: opts.italic,
          size: 20,
          font: 'Calibri',
        }),
      ],
    });

  const bullet = (text: string) =>
    new Paragraph({
      bullet: { level: 0 },
      spacing: { after: 40 },
      children: [new TextRun({ text, size: 20, font: 'Calibri' })],
    });

  const line = (left: string, right?: string) =>
    new Paragraph({
      spacing: { after: 20 },
      tabStops: [{ type: 'right', position: 9360 }],
      children: [
        new TextRun({ text: left, bold: true, size: 20, font: 'Calibri' }),
        ...(right
          ? [new TextRun({ text: `\t${right}`, size: 18, color: '666666', font: 'Calibri' })]
          : []),
      ],
    });

  if (content.summary?.trim()) {
    children.push(heading('Professional Summary'));
    children.push(body(content.summary));
  }

  if (content.experience?.length) {
    children.push(heading('Experience'));
    for (const item of content.experience) {
      children.push(
        line(
          item.position,
          item.period?.end
            ? `${item.period.start ?? ''} – ${item.period.end}`
            : item.period?.start
        )
      );
      children.push(
        body(`${item.company}${item.location ? ` · ${item.location}` : ''}`, {
          italic: true,
        })
      );
      item.highlights.filter(Boolean).forEach((h) => children.push(bullet(h)));
    }
  }

  if (content.education?.length) {
    children.push(heading('Education'));
    for (const item of content.education) {
      children.push(line(item.institution, item.period?.start));
      children.push(body(`${item.degree}${item.score ? ` — ${item.score}` : ''}`));
    }
  }

  if (content.skills?.length) {
    children.push(heading('Skills'));
    for (const group of content.skills) {
      children.push(body(`${group.name}: ${group.skills.join(', ')}`));
    }
  }

  if (content.projects?.length) {
    children.push(heading('Projects'));
    for (const item of content.projects) {
      children.push(line(item.name, item.role));
      if (item.description) children.push(body(item.description));
      item.highlights.filter(Boolean).forEach((h) => children.push(bullet(h)));
    }
  }

  if (content.achievements?.length) {
    children.push(heading('Achievements'));
    content.achievements.filter(Boolean).forEach((a) => children.push(bullet(a)));
  }

  if (content.certifications?.length) {
    children.push(heading('Certifications'));
    for (const c of content.certifications) {
      children.push(
        body(`${c.name} — ${c.issuer}${c.date ? ` (${c.date})` : ''}`)
      );
    }
  }

  if (content.publications?.length) {
    children.push(heading('Publications'));
    for (const p of content.publications) {
      children.push(
        body(`${p.title} — ${p.publisher}${p.date ? ` (${p.date})` : ''}`)
      );
    }
  }

  if (content.languages?.length) {
    children.push(heading('Languages'));
    for (const l of content.languages) {
      children.push(body(`${l.name}${l.proficiency ? ` — ${l.proficiency}` : ''}`));
    }
  }

  for (const section of content.customSections ?? []) {
    if (section.visible === false) continue;
    children.push(heading(section.title));
    if (section.description) children.push(body(section.description));
    section.items.filter(Boolean).forEach((i: string) => children.push(bullet(i)));
  }

  const doc = new Document({
    creator: 'ResumeForge AI',
    title,
    description: `Resume for ${profile.fullName || 'user'}`,
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: Math.round(metadata.pageMargin * 1440),
              right: Math.round(metadata.pageMargin * 1440),
              bottom: Math.round(metadata.pageMargin * 1440),
              left: Math.round(metadata.pageMargin * 1440),
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, safeFilename(title, 'docx'));
}

// ---------------------------------------------------------------------------
// LaTeX
// ---------------------------------------------------------------------------

/** Generate LaTeX source for the resume. */
export function generateLatex(
  content: ResumeContent,
  metadata: ResumeMetadata
): string {
  return resumeToLatexFromMetadata(content, metadata);
}

/** Download the LaTeX source. */
export function exportLatex(
  content: ResumeContent,
  metadata: ResumeMetadata,
  title: string
): void {
  const latex = generateLatex(content, metadata);
  triggerDownload(
    new Blob([latex], { type: 'text/plain;charset=utf-8' }),
    safeFilename(title, 'tex')
  );
}
