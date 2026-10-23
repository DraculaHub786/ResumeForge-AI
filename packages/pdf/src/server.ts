/**
 * Server-side PDF generation.
 *
 * Produces a text-based, selectable, ATS-safe PDF directly from a resume
 * document — no headless browser required. The browser export path renders
 * the live preview for pixel-perfect fidelity; this path exists for API
 * consumers, scheduled exports, and environments without a browser.
 */

import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';
import type { ResumeContent, Theme } from '@resume-builder/types';
import { getPageGeometry, type PageSize } from './layout.js';
import { formatPeriod } from './latex.js';

export interface ServerPdfOptions {
  pageSize?: PageSize;
  /** Page margin in inches. */
  pageMargin?: number;
  theme?: Theme;
}

interface Cursor {
  page: PDFPage;
  y: number;
  pages: PDFPage[];
}

const PT_PER_INCH = 72;

/** Parse a `#rrggbb` colour into an rgb() tuple, with a safe fallback. */
function hexToRgb(hex: string | undefined, fallback = rgb(0, 0, 0)) {
  if (!hex) return fallback;
  const match = /^#?([A-Fa-f0-9]{6})$/.exec(hex.trim());
  if (!match) return fallback;
  const value = parseInt(match[1], 16);
  return rgb(
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255
  );
}

/**
 * Generate a text-based PDF from resume content.
 *
 * @returns the raw PDF bytes.
 */
export async function resumeToPdf(
  content: ResumeContent,
  options: ServerPdfOptions = {}
): Promise<Uint8Array> {
  const pageSize = options.pageSize ?? 'letter';
  const geometry = getPageGeometry(pageSize);
  const margin = (options.pageMargin ?? 0.6) * PT_PER_INCH;
  const theme = options.theme;

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await doc.embedFont(StandardFonts.HelveticaOblique);

  const accent = hexToRgb(theme?.primaryColor, rgb(0.12, 0.25, 0.69));
  const textColor = hexToRgb(theme?.textColor, rgb(0.07, 0.07, 0.09));
  const mutedColor = hexToRgb(theme?.mutedColor, rgb(0.42, 0.42, 0.5));

  const bodySize = 10;
  const lineHeight = 13;
  const pageWidth = geometry.widthPt;

  let cursor: Cursor = {
    page: doc.addPage([geometry.widthPt, geometry.heightPt]),
    y: geometry.heightPt - margin,
    pages: [],
  };
  cursor.pages.push(cursor.page);

  const newPage = () => {
    cursor = {
      page: doc.addPage([geometry.widthPt, geometry.heightPt]),
      y: geometry.heightPt - margin,
      pages: [],
    };
    cursor.pages.push(cursor.page);
  };

  const ensureRoom = (needed: number) => {
    if (cursor.y - needed < margin) newPage();
  };

  /** Wrap a string to the available width, breaking on spaces. */
  const wrap = (text: string, maxWidth: number, f: PDFFont, size: number) => {
    const words = text.split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (f.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        if (current) out.push(current);
        current = word;
      }
    }
    if (current) out.push(current);
    return out.length ? out : [''];
  };

  const drawLine = (
    text: string,
    opts: {
      font?: PDFFont;
      size?: number;
      color?: ReturnType<typeof rgb>;
      indent?: number;
      gap?: number;
    } = {}
  ) => {
    const f = opts.font ?? font;
    const size = opts.size ?? bodySize;
    const indent = opts.indent ?? 0;
    const gap = opts.gap ?? lineHeight;
    const maxWidth = pageWidth - margin * 2 - indent;

    for (const line of wrap(text, maxWidth, f, size)) {
      ensureRoom(gap);
      cursor.page.drawText(line, {
        x: margin + indent,
        y: cursor.y,
        size,
        font: f,
        color: opts.color ?? textColor,
      });
      cursor.y -= gap;
    }
  };

  const drawSectionHeading = (title: string) => {
    ensureRoom(34);
    cursor.y -= 8;
    const label = theme?.uppercaseHeadings ? title.toUpperCase() : title;
    cursor.page.drawText(label, {
      x: margin,
      y: cursor.y,
      size: 11.5,
      font: boldFont,
      color: accent,
    });
    cursor.y -= 4;
    if (theme?.showSectionRules !== false) {
      cursor.page.drawLine({
        start: { x: margin, y: cursor.y },
        end: { x: pageWidth - margin, y: cursor.y },
        thickness: 0.7,
        color: accent,
      });
    }
    cursor.y -= 10;
  };

  const drawBullets = (items: string[]) => {
    for (const item of items) {
      if (!item?.trim()) continue;
      ensureRoom(lineHeight);
      cursor.page.drawText('•', {
        x: margin + 8,
        y: cursor.y,
        size: bodySize,
        font,
        color: mutedColor,
      });
      drawLine(item, { indent: 20, gap: lineHeight });
    }
    cursor.y -= 2;
  };

  // ---------------------------------------------------------------------
  // Header
  // ---------------------------------------------------------------------
  const profile = content.profile;
  if (profile?.fullName) {
    ensureRoom(60);
    cursor.page.drawText(profile.fullName, {
      x: margin,
      y: cursor.y,
      size: 20,
      font: boldFont,
      color: textColor,
    });
    cursor.y -= 22;

    if (profile.headline) {
      cursor.page.drawText(profile.headline, {
        x: margin,
        y: cursor.y,
        size: 11.5,
        font: italicFont,
        color: accent,
      });
      cursor.y -= 16;
    }

    const contact = [
      profile.email,
      profile.phone,
      profile.location,
      profile.links?.map((l) => l.label).join(', '),
    ]
      .filter((v): v is string => !!v && v.trim().length > 0)
      .join(' | ');

    if (contact) {
      drawLine(contact, { size: 9.5, color: mutedColor, gap: 14 });
    }
    cursor.y -= 6;
  }

  // ---------------------------------------------------------------------
  // Sections
  // ---------------------------------------------------------------------
  if (content.summary?.trim()) {
    drawSectionHeading('Professional Summary');
    drawLine(content.summary.trim());
    cursor.y -= 4;
  }

  if (content.experience?.length) {
    drawSectionHeading('Work Experience');
    for (const item of content.experience) {
      ensureRoom(40);
      const period = formatPeriod(item.period);
      cursor.page.drawText(item.position, {
        x: margin,
        y: cursor.y,
        size: 11,
        font: boldFont,
        color: textColor,
      });
      if (period) {
        const width = font.widthOfTextAtSize(period, 9.5);
        cursor.page.drawText(period, {
          x: pageWidth - margin - width,
          y: cursor.y,
          size: 9.5,
          font,
          color: mutedColor,
        });
      }
      cursor.y -= 13;

      const company = [item.company, item.location].filter(Boolean).join(' | ');
      if (company) {
        drawLine(company, { size: 9.5, color: mutedColor, gap: 12 });
      }
      if (item.highlights?.length) drawBullets(item.highlights);
      cursor.y -= 6;
    }
  }

  if (content.education?.length) {
    drawSectionHeading('Education');
    for (const item of content.education) {
      ensureRoom(30);
      const period = formatPeriod(item.period);
      cursor.page.drawText(item.institution, {
        x: margin,
        y: cursor.y,
        size: 11,
        font: boldFont,
        color: textColor,
      });
      if (period) {
        const width = font.widthOfTextAtSize(period, 9.5);
        cursor.page.drawText(period, {
          x: pageWidth - margin - width,
          y: cursor.y,
          size: 9.5,
          font,
          color: mutedColor,
        });
      }
      cursor.y -= 13;
      const degree = [item.degree, item.score].filter(Boolean).join(' | ');
      if (degree) drawLine(degree, { size: 9.5, color: mutedColor, gap: 12 });
      cursor.y -= 4;
    }
  }

  if (content.skills?.length) {
    drawSectionHeading('Skills');
    for (const group of content.skills) {
      ensureRoom(20);
      const label = `${group.name}: `;
      cursor.page.drawText(label, {
        x: margin,
        y: cursor.y,
        size: bodySize,
        font: boldFont,
        color: textColor,
      });
      const labelWidth = boldFont.widthOfTextAtSize(label, bodySize);
      const value = group.skills.join(', ');
      const maxWidth = pageWidth - margin * 2 - labelWidth;
      const lines = wrap(value, maxWidth, font, bodySize);
      lines.forEach((line, i) => {
        ensureRoom(lineHeight);
        cursor.page.drawText(line, {
          x: margin + labelWidth,
          y: cursor.y,
          size: bodySize,
          font,
          color: textColor,
        });
        cursor.y -= lineHeight;
        void i;
      });
      cursor.y -= 2;
    }
  }

  if (content.projects?.length) {
    drawSectionHeading('Projects');
    for (const item of content.projects) {
      ensureRoom(34);
      cursor.page.drawText(item.name, {
        x: margin,
        y: cursor.y,
        size: 11,
        font: boldFont,
        color: textColor,
      });
      cursor.y -= 13;
      if (item.description) drawLine(item.description, { size: 9.5, color: mutedColor });
      if (item.highlights?.length) drawBullets(item.highlights);
      cursor.y -= 4;
    }
  }

  if (content.achievements?.length) {
    drawSectionHeading('Achievements');
    drawBullets(content.achievements);
  }

  if (content.certifications?.length) {
    drawSectionHeading('Certifications');
    drawBullets(
      content.certifications.map((c) =>
        [c.name, c.issuer, c.date].filter(Boolean).join(' — ')
      )
    );
  }

  if (content.publications?.length) {
    drawSectionHeading('Publications');
    drawBullets(
      content.publications.map((p) =>
        [p.title, p.publisher, p.date].filter(Boolean).join(' — ')
      )
    );
  }

  if (content.languages?.length) {
    drawSectionHeading('Languages');
    drawBullets(
      content.languages.map((l) =>
        [l.name, l.proficiency].filter(Boolean).join(' — ')
      )
    );
  }

  if (content.volunteer?.length) {
    drawSectionHeading('Volunteer Work');
    for (const item of content.volunteer) {
      ensureRoom(30);
      cursor.page.drawText(item.role, {
        x: margin,
        y: cursor.y,
        size: 11,
        font: boldFont,
        color: textColor,
      });
      cursor.y -= 13;
      if (item.organization) {
        drawLine(item.organization, { size: 9.5, color: mutedColor, gap: 12 });
      }
      if (item.highlights?.length) drawBullets(item.highlights);
      cursor.y -= 4;
    }
  }

  if (content.interests?.length) {
    drawSectionHeading('Interests');
    drawLine(content.interests.join(', '));
  }

  for (const section of content.customSections ?? []) {
    if (section.visible === false) continue;
    drawSectionHeading(section.title);
    if (section.description) drawLine(section.description);
    if (section.items?.length) drawBullets(section.items);
  }

  return doc.save();
}
