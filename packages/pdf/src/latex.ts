/**
 * LaTeX source emitter.
 *
 * This is the single source of truth for LaTeX output — the web app's
 * "Export → LaTeX" button and the server's `/exports/latex` endpoint both
 * call `resumeToLatex`, so a resume never exports two different documents.
 *
 * The output targets `pdflatex` and is deliberately ATS-friendly: single
 * column, standard section headings, no tables or text boxes.
 */

import type { ResumeContent, ResumeMetadata } from '@resume-builder/types';
import { getPageGeometry, inToMm, type PageSize } from './layout.js';

// ---------------------------------------------------------------------------
// Escaping
// ---------------------------------------------------------------------------

/**
 * Escape LaTeX special characters so user text never breaks compilation.
 *
 * The replacement happens in a single pass: chaining `.replace()` calls would
 * re-escape the braces introduced by `\textbackslash{}` and produce invalid
 * output like `\textbackslash\{\}`.
 */
const LATEX_SPECIALS: Record<string, string> = {
  '\\': '\\textbackslash{}',
  '{': '\\{',
  '}': '\\}',
  '&': '\\&',
  '%': '\\%',
  $: '\\$',
  '#': '\\#',
  _: '\\_',
  '~': '\\textasciitilde{}',
  '^': '\\textasciicircum{}',
};

export function escapeLatex(text: string): string {
  return text
    .replace(/[\\{}&%$#_~^]/g, (char) => LATEX_SPECIALS[char] ?? char)
    .replace(/"/g, "''")
    .replace(/\n/g, '\\\\ ');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a date range as "2020 - Present". */
export function formatPeriod(
  period: { start?: string; end?: string; current?: boolean } | undefined
): string {
  const start = period?.start?.trim() ?? '';
  const end = period?.current ? 'Present' : period?.end?.trim() ?? '';
  if (!start && !end) return '';
  if (!end) return start;
  if (!start) return end;
  return `${start} - ${end}`;
}

/** Join non-empty parts with a separator. */
function joinParts(parts: Array<string | undefined>, sep: string): string {
  return parts.filter((p): p is string => !!p && p.trim().length > 0).join(sep);
}

// ---------------------------------------------------------------------------
// Emitter
// ---------------------------------------------------------------------------

export interface LatexOptions {
  /** Page size. Defaults to letter. */
  pageSize?: PageSize;
  /** Page margin in inches. Defaults to 0.6. */
  pageMargin?: number;
  /** Accent colour used for the name, as an HTML hex string. */
  accentColor?: string;
  /** Extra packages appended to the preamble. */
  extraPackages?: string[];
}

/**
 * Convert resume content into a complete, compilable LaTeX document.
 */
export function resumeToLatex(
  content: ResumeContent,
  options: LatexOptions = {}
): string {
  const pageSize = options.pageSize ?? 'letter';
  const margin = options.pageMargin ?? 0.6;
  const geometry = getPageGeometry(pageSize);
  const marginMm = inToMm(margin);

  const lines: string[] = [];

  // ---- Preamble ----
  lines.push(
    `\\documentclass[11pt,${pageSize === 'a4' ? 'a4paper' : 'letterpaper'}]{article}`
  );
  lines.push('\\usepackage[utf8]{inputenc}');
  lines.push('\\usepackage[T1]{fontenc}');
  lines.push(
    `\\usepackage[margin=${margin}in,paperwidth=${geometry.widthMm.toFixed(
      1
    )}mm,paperheight=${geometry.heightMm.toFixed(1)}mm]{geometry}`
  );
  lines.push('\\usepackage{titlesec}');
  lines.push('\\usepackage{enumitem}');
  lines.push('\\usepackage{hyperref}');
  lines.push('\\usepackage{xcolor}');
  for (const pkg of options.extraPackages ?? []) lines.push(`\\usepackage{${pkg}}`);
  lines.push('\\pagestyle{empty}');
  lines.push('\\setlength{\\parindent}{0pt}');
  lines.push('\\setlength{\\parskip}{0pt}');
  lines.push(
    '\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]'
  );
  lines.push('\\titlespacing{\\section}{0pt}{10pt}{5pt}');
  lines.push(
    '\\setlist[itemize]{leftmargin=*, itemsep=1pt, parsep=0pt, topsep=2pt}'
  );
  if (options.accentColor) {
    lines.push(`\\definecolor{accent}{HTML}{${options.accentColor.replace('#', '')}}`);
    lines.push('\\renewcommand{\\titlerule}{\\color{accent}\\titlerule}');
  }
  lines.push('');

  lines.push('\\begin{document}');

  // ---- Profile header ----
  const profile = content.profile;
  if (profile?.fullName) {
    lines.push('\\begin{center}');
    lines.push(`{\\LARGE\\bfseries ${escapeLatex(profile.fullName)}}\\\\[4pt]`);

    if (profile.headline) {
      lines.push(`{\\large ${escapeLatex(profile.headline)}}\\\\[3pt]`);
    }

    const contact = joinParts(
      [
        profile.email,
        profile.phone,
        profile.location,
        profile.links?.map((l) => l.label).join(', '),
      ],
      ' $\\vert$ '
    );
    if (contact) lines.push(`${contact}\\\\`);

    lines.push('\\end{center}');
    lines.push('');
  }

  // ---- Summary ----
  if (content.summary?.trim()) {
    lines.push('\\section*{Professional Summary}');
    lines.push(escapeLatex(content.summary.trim()));
    lines.push('');
  }

  // ---- Experience ----
  if (content.experience?.length) {
    lines.push('\\section*{Work Experience}');
    for (const item of content.experience) {
      const period = formatPeriod(item.period);
      lines.push(
        `\\textbf{${escapeLatex(item.position)}} ${
          period ? `\\hfill \\textit{${escapeLatex(period)}}` : ''
        }\\\\`
      );
      const companyLine = joinParts(
        [item.company, item.location],
        ' $\\vert$ '
      );
      if (companyLine) lines.push(`\\textit{${escapeLatex(companyLine)}}\\\\[3pt]`);
      if (item.highlights?.length) {
        lines.push('\\begin{itemize}');
        for (const h of item.highlights) lines.push(`  \\item ${escapeLatex(h)}`);
        lines.push('\\end{itemize}');
      }
      lines.push('\\vspace{4pt}');
    }
    lines.push('');
  }

  // ---- Education ----
  if (content.education?.length) {
    lines.push('\\section*{Education}');
    for (const item of content.education) {
      const period = formatPeriod(item.period);
      lines.push(
        `\\textbf{${escapeLatex(item.institution)}} ${
          period ? `\\hfill ${escapeLatex(period)}` : ''
        }\\\\`
      );
      const degreeLine = joinParts([item.degree, item.score], ' $\\vert$ ');
      if (degreeLine) lines.push(`${escapeLatex(degreeLine)}\\\\[6pt]`);
    }
    lines.push('');
  }

  // ---- Skills ----
  if (content.skills?.length) {
    lines.push('\\section*{Skills}');
    for (const group of content.skills) {
      lines.push(
        `\\textbf{${escapeLatex(group.name)}:} ${group.skills
          .map((s) => escapeLatex(s))
          .join(', ')}\\\\[3pt]`
      );
    }
    lines.push('');
  }

  // ---- Projects ----
  if (content.projects?.length) {
    lines.push('\\section*{Projects}');
    for (const item of content.projects) {
      lines.push(`\\textbf{${escapeLatex(item.name)}}\\\\`);
      if (item.description) {
        lines.push(`${escapeLatex(item.description)}\\\\[2pt]`);
      }
      if (item.highlights?.length) {
        lines.push('\\begin{itemize}');
        for (const h of item.highlights) lines.push(`  \\item ${escapeLatex(h)}`);
        lines.push('\\end{itemize}');
      }
      lines.push('\\vspace{3pt}');
    }
    lines.push('');
  }

  // ---- Achievements ----
  if (content.achievements?.length) {
    lines.push('\\section*{Achievements}');
    lines.push('\\begin{itemize}');
    for (const a of content.achievements) lines.push(`  \\item ${escapeLatex(a)}`);
    lines.push('\\end{itemize}');
    lines.push('');
  }

  // ---- Certifications ----
  if (content.certifications?.length) {
    lines.push('\\section*{Certifications}');
    lines.push('\\begin{itemize}');
    for (const c of content.certifications) {
      const label = joinParts([c.name, c.issuer, c.date], ' — ');
      lines.push(`  \\item ${escapeLatex(label)}`);
    }
    lines.push('\\end{itemize}');
    lines.push('');
  }

  // ---- Publications ----
  if (content.publications?.length) {
    lines.push('\\section*{Publications}');
    lines.push('\\begin{itemize}');
    for (const p of content.publications) {
      const label = joinParts([p.title, p.publisher, p.date], ' — ');
      lines.push(`  \\item ${escapeLatex(label)}`);
    }
    lines.push('\\end{itemize}');
    lines.push('');
  }

  // ---- Languages ----
  if (content.languages?.length) {
    lines.push('\\section*{Languages}');
    lines.push('\\begin{itemize}');
    for (const l of content.languages) {
      const label = joinParts([l.name, l.proficiency], ' — ');
      lines.push(`  \\item ${escapeLatex(label)}`);
    }
    lines.push('\\end{itemize}');
    lines.push('');
  }

  // ---- Volunteer ----
  if (content.volunteer?.length) {
    lines.push('\\section*{Volunteer Work}');
    for (const item of content.volunteer) {
      const period = formatPeriod(item.period);
      lines.push(
        `\\textbf{${escapeLatex(item.role)}} ${
          period ? `\\hfill ${escapeLatex(period)}` : ''
        }\\\\`
      );
      if (item.organization) {
        lines.push(`\\textit{${escapeLatex(item.organization)}}\\\\[3pt]`);
      }
      if (item.highlights?.length) {
        lines.push('\\begin{itemize}');
        for (const h of item.highlights) lines.push(`  \\item ${escapeLatex(h)}`);
        lines.push('\\end{itemize}');
      }
      lines.push('\\vspace{3pt}');
    }
    lines.push('');
  }

  // ---- Interests ----
  if (content.interests?.length) {
    lines.push('\\section*{Interests}');
    lines.push(escapeLatex(content.interests.join(', ')));
    lines.push('');
  }

  // ---- Custom sections ----
  for (const section of content.customSections ?? []) {
    if (section.visible === false) continue;
    lines.push(`\\section*{${escapeLatex(section.title)}}`);
    if (section.description) lines.push(escapeLatex(section.description));
    if (section.items?.length) {
      lines.push('\\begin{itemize}');
      for (const item of section.items) lines.push(`  \\item ${escapeLatex(item)}`);
      lines.push('\\end{itemize}');
    }
    lines.push('');
  }

  lines.push('\\end{document}');
  return lines.join('\n');
}

/** Convenience overload that pulls page setup from resume metadata. */
export function resumeToLatexFromMetadata(
  content: ResumeContent,
  metadata?: Partial<ResumeMetadata>
): string {
  return resumeToLatex(content, {
    pageSize: metadata?.pageSize,
    pageMargin: metadata?.pageMargin,
    accentColor: metadata?.theme?.primaryColor,
  });
}
