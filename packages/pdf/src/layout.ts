/**
 * Page geometry helpers shared by every export format.
 *
 * The live preview, the print-to-PDF pipeline, the LaTeX emitter, and the
 * server-side PDF writer all need to agree on page size and margins —
 * otherwise the exported document does not match what the user saw.
 */

export type PageSize = 'letter' | 'a4';

export interface PageGeometry {
  /** Width in millimetres. */
  widthMm: number;
  /** Height in millimetres. */
  heightMm: number;
  /** Width in inches. */
  widthIn: number;
  /** Height in inches. */
  heightIn: number;
  /** Width in PostScript points (72 per inch). */
  widthPt: number;
  /** Height in PostScript points (72 per inch). */
  heightPt: number;
  /** CSS `@page` size keyword. */
  cssSize: string;
}

const MM_PER_INCH = 25.4;
const PT_PER_INCH = 72;

export const PAGE_GEOMETRY: Record<PageSize, PageGeometry> = {
  letter: {
    widthMm: 215.9,
    heightMm: 279.4,
    widthIn: 8.5,
    heightIn: 11,
    widthPt: 612,
    heightPt: 792,
    cssSize: 'letter',
  },
  a4: {
    widthMm: 210,
    heightMm: 297,
    widthIn: 8.2677,
    heightIn: 11.6929,
    widthPt: 595.28,
    heightPt: 841.89,
    cssSize: 'A4',
  },
};

export function getPageGeometry(size: PageSize = 'letter'): PageGeometry {
  return PAGE_GEOMETRY[size] ?? PAGE_GEOMETRY.letter;
}

/** Convert millimetres to points. */
export function mmToPt(mm: number): number {
  return (mm / MM_PER_INCH) * PT_PER_INCH;
}

/** Convert points to millimetres. */
export function ptToMm(pt: number): number {
  return (pt / PT_PER_INCH) * MM_PER_INCH;
}

/** Convert inches to millimetres. */
export function inToMm(inches: number): number {
  return inches * MM_PER_INCH;
}

/** Build a clean, professional filename: e.g. "Alex-Rivera-Resume.pdf". */
export function buildExportFilename(
  content?: {
    profile?: { fullName?: string; name?: string };
    basics?: { name?: string; fullName?: string };
    contact?: { name?: string };
  } | null,
  fallbackTitle?: string,
  ext: string = 'pdf'
): string {
  const cleanExt = ext.replace(/^\.+/, '');
  const name =
    content?.profile?.fullName?.trim() ||
    (content as any)?.profile?.name?.trim() ||
    content?.basics?.name?.trim() ||
    content?.basics?.fullName?.trim() ||
    (content as any)?.contact?.name?.trim();

  const formatCleanName = (raw: string) => {
    // Strip trailing .pdf / .docx / .tex / etc. if present
    const stripped = raw.replace(new RegExp(`\\.${cleanExt}$`, 'i'), '').trim();
    const clean = stripped
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    if (!clean) return null;
    if (clean.toLowerCase().endsWith('-resume')) {
      return `${clean}.${cleanExt}`;
    }
    return `${clean}-Resume.${cleanExt}`;
  };

  if (name) {
    const formatted = formatCleanName(name);
    if (formatted) return formatted;
  }

  if (
    fallbackTitle &&
    !fallbackTitle.startsWith('res_') &&
    fallbackTitle.toLowerCase() !== 'untitled' &&
    fallbackTitle.toLowerCase() !== 'resume' &&
    fallbackTitle.toLowerCase() !== 'new resume'
  ) {
    const formatted = formatCleanName(fallbackTitle);
    if (formatted) return formatted;
  }

  return `Resume.${cleanExt}`;
}

