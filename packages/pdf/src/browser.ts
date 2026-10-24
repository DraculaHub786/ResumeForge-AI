/**
 * Browser-side export helpers.
 *
 * These run entirely in the user's browser: render the live preview DOM to a
 * print-ready page and open a download. No server round-trip needed. Heavy
 * libraries (html2canvas / jsPDF) are dynamically imported so they stay out of
 * the bundle until the user actually exports.
 */

import type { ResumeMetadata } from '@resume-builder/types';
import { getPageGeometry, buildExportFilename } from './layout.js';

export interface BrowserPdfOptions {
  /** Page size, used for the `@page` rule and the raster fallback. */
  pageSize?: 'letter' | 'a4';
  /** Page margin in inches. */
  pageMargin?: number;
  /** Rasterisation scale for the fallback path. */
  scale?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export async function triggerFileSave(blob: Blob, filename: string): Promise<boolean> {
  if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
    try {
      const ext = filename.split('.').pop() || 'pdf';
      const mime = blob.type || 'application/octet-stream';
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: `${ext.toUpperCase()} Document`,
            accept: { [mime]: [`.${ext}`] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') return false;
      // Fall through to anchor click on other errors
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}

function triggerDownload(blob: Blob, filename: string) {
  triggerFileSave(blob, filename);
}

export function safeFilename(title: string, ext: string): string {
  return buildExportFilename(null, title, ext);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ---------------------------------------------------------------------------
// PDF — print pipeline (vector, selectable, ATS-safe)
// ---------------------------------------------------------------------------

/**
 * Render the preview element to a PDF via the browser print pipeline.
 *
 * The `@page` size and margin come from the resume metadata so the printed
 * output matches the displayed page exactly. `print-color-adjust: exact`
 * keeps accent colours from being dropped.
 */
export async function exportPdfFromElement(
  element: HTMLElement,
  title: string,
  options: BrowserPdfOptions = {}
): Promise<void> {
  const pageSize = options.pageSize ?? 'letter';
  const geometry = getPageGeometry(pageSize);
  const marginIn = options.pageMargin ?? 0.6;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    throw new Error('Pop-up blocked — allow pop-ups for this site to export.');
  }

  win.document.write(
    `<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(
      title
    )}</title><style>
      @page { size: ${geometry.cssSize}; margin: ${marginIn}in; }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; }
      #root { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style></head><body><div id="root">${element.outerHTML}</div></body></html>`
  );
  win.document.close();

  // Give the cloned node a moment to lay out, then trigger the print dialog.
  await new Promise<void>((resolve) => {
    win.setTimeout(() => {
      win.focus();
      win.print();
      resolve();
    }, 250);
  });
}

// ---------------------------------------------------------------------------
// PDF — raster fallback
// ---------------------------------------------------------------------------

/**
 * Pixel-accurate PDF fallback for browsers where the print pipeline misbehaves.
 * Rasterises the element with html2canvas and packs it into a multi-page
 * jsPDF document.
 */
export async function exportPdfCanvasFallback(
  element: HTMLElement,
  title: string,
  options: BrowserPdfOptions = {}
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const geometry = getPageGeometry(options.pageSize ?? 'letter');
  const canvas = await html2canvas(element, {
    scale: options.scale ?? 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      const target = (clonedDoc.querySelector('[data-testid="resume-preview"]') || clonedDoc.body.firstElementChild) as HTMLElement | null;
      if (target) {
        target.style.boxShadow = 'none';
        target.style.border = 'none';
        target.style.margin = '0';
      }
    },
  });

  const imgData = canvas.toDataURL('image/png');
  const orientation = canvas.width / canvas.height > 1 ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'pt',
    format: [geometry.widthPt, geometry.heightPt],
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const blob = pdf.output('blob');
  await triggerFileSave(blob, safeFilename(title, 'pdf'));
}

/**
 * Export the preview element as a PDF, falling back to rasterisation if the
 * print pipeline fails.
 */
export async function exportPdf(
  element: HTMLElement,
  title: string,
  options: BrowserPdfOptions = {}
): Promise<void> {
  try {
    await exportPdfFromElement(element, title, options);
  } catch {
    // If browser print window was blocked or failed, fall back to canvas PDF download
    await exportPdfCanvasFallback(element, title, options);
  }
}

// ---------------------------------------------------------------------------
// PNG
// ---------------------------------------------------------------------------

export async function exportPng(
  element: HTMLElement,
  title: string,
  scale = 2
): Promise<void> {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: '#ffffff',
    onclone: (clonedDoc) => {
      const target = (clonedDoc.querySelector('[data-testid="resume-preview"]') || clonedDoc.body.firstElementChild) as HTMLElement | null;
      if (target) {
        target.style.boxShadow = 'none';
        target.style.border = 'none';
        target.style.margin = '0';
      }
    },
  });
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png')
  );
  if (!blob) throw new Error('Could not render the preview as an image.');
  await triggerFileSave(blob, safeFilename(title, 'png'));
}
