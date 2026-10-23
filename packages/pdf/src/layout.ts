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
