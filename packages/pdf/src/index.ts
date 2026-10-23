/**
 * @resume-builder/pdf — shared resume rendering.
 *
 * The root entry is isomorphic: it exports the layout helpers and the LaTeX
 * emitter, both of which run in the browser and on the server.
 *
 * Subpath exports:
 *   `@resume-builder/pdf/browser` — DOM-based PDF/PNG export (browser only)
 *   `@resume-builder/pdf/server`  — headless PDF generation (Node only)
 */

export {
  PAGE_GEOMETRY,
  getPageGeometry,
  mmToPt,
  ptToMm,
  inToMm,
  type PageSize,
  type PageGeometry,
} from './layout.js';

export {
  resumeToLatex,
  resumeToLatexFromMetadata,
  escapeLatex,
  formatPeriod,
  type LatexOptions,
} from './latex.js';
