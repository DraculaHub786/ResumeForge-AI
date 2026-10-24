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

import { createEmptyContent, type ResumeContent, type ResumeMetadata } from '@resume-builder/types';
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

/**
 * Unescape LaTeX special character sequences back to plain text.
 */
export function unescapeLatex(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\textbackslash\{\}/g, '\\')
    .replace(/\\textasciitilde\{\}/g, '~')
    .replace(/\\textasciicircum\{\}/g, '^')
    .replace(/\\\{/g, '{')
    .replace(/\\\}/g, '}')
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/\\_/g, '_')
    .replace(/\\\\'|''/g, '"')
    .replace(/\\\\ /g, ' ')
    .replace(/\\\\/g, '\n')
    .trim();
}

// ---------------------------------------------------------------------------
// Real-time LaTeX Compiler Engine
// ---------------------------------------------------------------------------

export interface CompilerDiagnostic {
  line: number;
  type: 'info' | 'warning' | 'error';
  message: string;
}

export interface LatexCompilationResult {
  success: boolean;
  content: ResumeContent;
  metadata?: {
    pageSize?: PageSize;
    pageMargin?: number;
    theme?: {
      primaryColor?: string;
    };
  };
  diagnostics: CompilerDiagnostic[];
  stats: {
    lineCount: number;
    sectionCount: number;
    parseTimeMs: number;
  };
}

/**
 * Remove LaTeX comments while preserving escaped percentage symbols (`\%`).
 */
function stripLatexComments(line: string): string {
  let result = '';
  let escaped = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '\\') {
      escaped = !escaped;
      result += char;
    } else if (char === '%' && !escaped) {
      break;
    } else {
      escaped = false;
      result += char;
    }
  }
  return result;
}

/**
 * Comprehensive real-time LaTeX compiler engine.
 * Converts arbitrary LaTeX resume documents into structured ResumeContent and metadata,
 * providing real-time diagnostics, environment verification, and section compilation.
 */
export function compileLatexDocument(
  tex: string,
  existingContent?: ResumeContent
): LatexCompilationResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const diagnostics: CompilerDiagnostic[] = [];

  const createEmpty = (): ResumeContent => {
    return createEmptyContent();
  };

  if (!tex || typeof tex !== 'string' || !tex.trim()) {
    return {
      success: true,
      content: createEmpty(),
      diagnostics: [{ line: 1, type: 'info', message: 'Document is empty. Resume cleared.' }],
      stats: { lineCount: 0, sectionCount: 0, parseTimeMs: 0 },
    };
  }

  const result: ResumeContent = createEmpty();


  const rawLines = tex.split('\n');
  const totalLines = rawLines.length;

  // 1. Syntax Validation: Check brace balance and environment pairings
  let openBraces = 0;
  const envStack: Array<{ name: string; line: number }> = [];

  rawLines.forEach((rawLine, idx) => {
    const lineNum = idx + 1;
    const line = stripLatexComments(rawLine);

    // Track braces
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '{' && (c === 0 || line[c - 1] !== '\\')) openBraces++;
      if (line[c] === '}' && (c === 0 || line[c - 1] !== '\\')) openBraces--;
    }

    // Track environments: \begin{xyz} and \end{xyz}
    const beginMatches = line.matchAll(/\\begin\{([^}]+)\}/g);
    for (const match of beginMatches) {
      envStack.push({ name: match[1], line: lineNum });
    }

    const endMatches = line.matchAll(/\\end\{([^}]+)\}/g);
    for (const match of endMatches) {
      const endName = match[1];
      if (envStack.length === 0) {
        diagnostics.push({
          line: lineNum,
          type: 'warning',
          message: `Unexpected \\end{${endName}} with no matching \\begin.`,
        });
      } else {
        const last = envStack.pop()!;
        if (last.name !== endName) {
          diagnostics.push({
            line: lineNum,
            type: 'warning',
            message: `Mismatched environment: \\begin{${last.name}} on line ${last.line} closed with \\end{${endName}}.`,
          });
        }
      }
    }
  });

  if (openBraces !== 0) {
    diagnostics.push({
      line: totalLines,
      type: 'warning',
      message: `Unbalanced curly braces detected (${openBraces > 0 ? `${openBraces} unclosed '{'` : `${Math.abs(openBraces)} extra '}'`}).`,
    });
  }

  while (envStack.length > 0) {
    const unclosed = envStack.pop()!;
    diagnostics.push({
      line: unclosed.line,
      type: 'warning',
      message: `Unclosed \\begin{${unclosed.name}}.`,
    });
  }

  // 2. Metadata extraction (Page Size, Margin, Accent Color)
  const metadata: LatexCompilationResult['metadata'] = {};
  if (/a4paper/i.test(tex)) {
    metadata.pageSize = 'a4';
  } else if (/letterpaper/i.test(tex)) {
    metadata.pageSize = 'letter';
  }

  const marginMatch = tex.match(/margin\s*=\s*([0-9.]+)\s*(in|mm|cm)?/i);
  if (marginMatch && marginMatch[1]) {
    const val = parseFloat(marginMatch[1]);
    const unit = (marginMatch[2] || 'in').toLowerCase();
    if (!isNaN(val)) {
      if (unit === 'mm') metadata.pageMargin = +(val / 25.4).toFixed(2);
      else if (unit === 'cm') metadata.pageMargin = +(val / 2.54).toFixed(2);
      else metadata.pageMargin = val;
    }
  }

  const colorMatch = tex.match(/\\definecolor\{accent\}\{HTML\}\{([0-9a-fA-F]{6})\}/i);
  if (colorMatch && colorMatch[1]) {
    metadata.theme = { primaryColor: `#${colorMatch[1]}` };
  }

  // 3. Document body extraction
  let bodyContent = tex;
  const docMatch = tex.match(/\\begin\{document\}([\s\S]*?)(?:\\end\{document\}|$)/i);
  if (docMatch && docMatch[1]) {
    bodyContent = docMatch[1];
  }

  // 4. Header block extraction: from start of body up to the first \section
  const firstSectionIndex = bodyContent.search(/\\section\*?\{/i);
  const headerBlock = firstSectionIndex !== -1 ? bodyContent.slice(0, firstSectionIndex) : bodyContent;
  const sectionsBody = firstSectionIndex !== -1 ? bodyContent.slice(firstSectionIndex) : '';

  // Extract Full Name
  const nameMatch =
    headerBlock.match(/\{\\LARGE\\bfseries\s+([^\}]+)\}/i) ||
    headerBlock.match(/\\textbf\{\\LARGE\s+([^\}]+)\}/i) ||
    headerBlock.match(/\{\\Huge\\bfseries\s+([^\}]+)\}/i) ||
    headerBlock.match(/\{\\Huge\s+([^\}]+)\}/i) ||
    headerBlock.match(/\{\\huge\s+([^\}]+)\}/i) ||
    headerBlock.match(/\\title\{([^\}]+)\}/i) ||
    headerBlock.match(/\{\\LARGE\s+([^\}]+)\}/i) ||
    headerBlock.match(/\\textbf\{([^\}]+)\}/i);

  if (nameMatch && nameMatch[1]) {
    const rawName = unescapeLatex(
      nameMatch[1].replace(/\\textcolor\{[^\}]*\}\{/g, '').replace(/\}/g, '')
    );
    if (rawName) result.profile.fullName = rawName;
  }

  // Extract Headline / Subtitle (case-sensitive: only match lowercase \large, never \LARGE or \Large)
  const headlineMatch =
    headerBlock.match(/\{\\large\s+([^\}]+)\}/) ||
    headerBlock.match(/\\textit\{([^\}]+)\}/);
  if (headlineMatch && headlineMatch[1]) {
    const rawHeadline = headlineMatch[1]
      .replace(/\\(?:textbf|bfseries|LARGE|Large|Huge|huge|normalsize|small)\b/g, '')
      .replace(/[{}\\]/g, '')
      .trim();
    const headline = unescapeLatex(rawHeadline).trim();
    if (
      headline &&
      headline !== result.profile.fullName &&
      !headline.includes('@') &&
      !headline.includes('|') &&
      !headline.includes('\\vert')
    ) {
      result.profile.headline = headline;
    }
  }

  // Extract Email, Phone, Location, and Links from header
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emailMatch = headerBlock.match(emailRegex);
  if (emailMatch && emailMatch[0]) {
    result.profile.email = emailMatch[0].trim();
  }

  const phoneRegex = /(?:\+\d{1,3}[\s-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,5}/;
  const phoneMatch = headerBlock.match(phoneRegex);
  if (phoneMatch && phoneMatch[0]) {
    result.profile.phone = phoneMatch[0].trim();
  }

  // Extract location & links from separator lines
  const cleanHeader = unescapeLatex(
    headerBlock
      .replace(/\$\\vert\$/g, '|')
      .replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, '$2 ($1)')
  );
  const headerParts = cleanHeader.split(/[|\n]/).map((p) => p.trim());
  for (const part of headerParts) {
    if (!part || part.includes('@') || (phoneMatch && part.includes(phoneMatch[0]))) continue;
    if (part.includes('http://') || part.includes('https://') || part.includes('.com') || part.includes('.io') || part.includes('.org') || part.includes('linkedin') || part.includes('github')) {
      const existing = (result.profile.links || []).some((l) => l.url.includes(part) || l.label.includes(part));
      if (!existing) {
        result.profile.links.push({
          id: `link_${result.profile.links.length + 1}`,
          label: part.replace(/^https?:\/\//, '').split('/')[0],
          url: part.startsWith('http') ? part : `https://${part}`,
        });
      }
    } else if (
      part.length > 2 &&
      part.length < 50 &&
      !part.startsWith('\\') &&
      !part.startsWith('{') &&
      !part.includes('\\') &&
      !part.includes('LARGE') &&
      !part.includes('bfseries') &&
      !result.profile.location &&
      part !== result.profile.fullName &&
      part !== result.profile.headline
    ) {
      result.profile.location = part;
    }
  }

  // 5. Dynamic Section Splitter & Universal Parser
  const sectionRegex = /\\section\*?\{([^}]+)\}/g;
  const sections: Array<{ title: string; rawBody: string; startIndex: number }> = [];

  let secMatch: RegExpExecArray | null;
  while ((secMatch = sectionRegex.exec(sectionsBody)) !== null) {
    sections.push({
      title: unescapeLatex(secMatch[1]).trim(),
      rawBody: '',
      startIndex: secMatch.index + secMatch[0].length,
    });
  }

  for (let i = 0; i < sections.length; i++) {
    const nextStart = i + 1 < sections.length ? sections[i + 1].startIndex - sectionRegex.lastIndex : sectionsBody.length;
    sections[i].rawBody = sectionsBody.slice(sections[i].startIndex, i + 1 < sections.length ? sectionsBody.indexOf(`\\section`, sections[i].startIndex) : sectionsBody.length);
  }

  const recognizedCustomTitles = new Set<string>();

  for (const sec of sections) {
    const rawTitle = sec.title;
    const normTitle = rawTitle.toLowerCase();
    const body = sec.rawBody;

    // A. Summary / Objective
    if (normTitle.includes('summary') || normTitle.includes('objective') || normTitle.includes('about') || normTitle.includes('profile')) {
      const cleanSummary = unescapeLatex(
        body
          .replace(/\\vspace\{[^\}]*\}/g, '')
          .replace(/\\par/g, '\n')
          .trim()
      );
      if (cleanSummary) result.summary = cleanSummary;
    }

    // B. Experience / Work History
    else if (normTitle.includes('experience') || normTitle.includes('employment') || normTitle.includes('work') || normTitle.includes('career')) {
      const experiences: ResumeContent['experience'] = [];
      const itemRegex =
        /\\textbf\{([^\}]+)\}(?:\s*\\hfill\s*([^\\]*))?\\\\\s*(?:\\textit\{([^\}]*)\})?(?:\\\\\s*(?:\[[^\]]*\])?)?([\s\S]*?)(?=\\textbf\{|$)/g;
      let expItem;
      while ((expItem = itemRegex.exec(body)) !== null) {
        const position = unescapeLatex(expItem[1]).trim();
        const periodStr = expItem[2] ? unescapeLatex(expItem[2].replace(/\\textit\{([^\}]+)\}/, '$1')).trim() : '';
        const rawCompany = expItem[3] ? unescapeLatex(expItem[3].replace(/\$\\vert\$/g, '|')).trim() : '';
        const expBody = expItem[4] || '';

        if (!position) continue;

        let company = rawCompany;
        let location = '';
        if (rawCompany.includes('|')) {
          const parts = rawCompany.split('|');
          company = parts[0].trim();
          location = parts[1].trim();
        }

        const highlights: string[] = [];
        const bulletRegex = /\\item\s+([^\n\\]+(?:\\\\\s*|\n)*)/g;
        let bulletMatch;
        while ((bulletMatch = bulletRegex.exec(expBody)) !== null) {
          const h = unescapeLatex(bulletMatch[1].replace(/\\end\{itemize\}/, '').replace(/\\vspace\{[^\}]*\}/, '').trim());
          if (h) highlights.push(h);
        }

        let start = '';
        let end = '';
        let current = false;
        if (periodStr.includes('-') || periodStr.includes('–')) {
          const pParts = periodStr.split(/[-–]/);
          start = pParts[0]?.trim() || '';
          end = pParts[1]?.trim() || '';
          if (end.toLowerCase() === 'present') current = true;
        } else {
          start = periodStr;
        }

        experiences.push({
          id: `exp_${experiences.length + 1}`,
          position,
          company: company || 'Company',
          location,
          period: { start, end, current },
          highlights,
        });
      }
      if (experiences.length > 0) result.experience = experiences;
    }

    // C. Education
    else if (normTitle.includes('education') || normTitle.includes('academic') || normTitle.includes('university') || normTitle.includes('degree')) {
      const education: ResumeContent['education'] = [];
      const eduRegex =
        /\\textbf\{([^\}]+)\}(?:\s*\\hfill\s*([^\\]*))?\\\\\s*(?:\\textit\{([^\}]*)\}|([^\\]*))?/g;
      let eduItem;
      while ((eduItem = eduRegex.exec(body)) !== null) {
        const institution = unescapeLatex(eduItem[1]).trim();
        const periodStr = eduItem[2] ? unescapeLatex(eduItem[2]).trim() : '';
        let degreeLine = eduItem[3] || eduItem[4] || '';
        degreeLine = unescapeLatex(degreeLine.replace(/\$\\vert\$/g, '|')).trim();

        if (!institution) continue;

        let degree = degreeLine;
        let score = '';
        if (degreeLine.includes('|')) {
          const parts = degreeLine.split('|');
          degree = parts[0].trim();
          score = parts[1].trim();
        }

        education.push({
          id: `edu_${education.length + 1}`,
          institution,
          degree: degree || 'Degree',
          score: score || undefined,
          period: { start: periodStr },
        });
      }
      if (education.length > 0) result.education = education;
    }

    // D. Skills
    else if (normTitle.includes('skill') || normTitle.includes('technolog') || normTitle.includes('competenc') || normTitle.includes('stack')) {
      const skills: ResumeContent['skills'] = [];
      const lines = body.split(/\\\\|\n/);
      for (const rawLine of lines) {
        const line = rawLine.trim();
        const groupMatch = line.match(/\\textbf\{([^\}]+)\s*:\s*\}\s*(.*)/) || line.match(/\\textbf\{([^\}]+)\}\s*:\s*(.*)/);
        if (groupMatch) {
          const groupName = unescapeLatex(groupMatch[1]).trim();
          const listStr = unescapeLatex(groupMatch[2]);
          const skillList = listStr.split(/[,·|]/).map((s) => s.trim()).filter(Boolean);
          if (groupName && skillList.length) {
            skills.push({ id: `skill_${skills.length + 1}`, name: groupName, skills: skillList });
          }
        }
      }
      if (skills.length > 0) result.skills = skills;
    }

    // E. Projects
    else if (normTitle.includes('project') || normTitle.includes('portfolio') || normTitle.includes('creation')) {
      const projects: ResumeContent['projects'] = [];
      const projRegex =
        /\\textbf\{([^\}]+)\}(?:\s*\\hfill\s*([^\\]*))?\\\\\s*([^\\]*?)(?:\\\\\s*(?:\[[^\]]*\])?)?([\s\S]*?)(?=\\textbf\{|$)/g;
      let pItem;
      while ((pItem = projRegex.exec(body)) !== null) {
        const name = unescapeLatex(pItem[1]).trim();
        const role = pItem[2] ? unescapeLatex(pItem[2]).trim() : undefined;
        const desc = unescapeLatex(pItem[3]).trim();
        const pBody = pItem[4] || '';
        const highlights: string[] = [];
        const bulletRegex = /\\item\s+([^\n\\]+(?:\\\\\s*|\n)*)/g;
        let bulletMatch;
        while ((bulletMatch = bulletRegex.exec(pBody)) !== null) {
          const h = unescapeLatex(bulletMatch[1].replace(/\\end\{itemize\}/, '').trim());
          if (h) highlights.push(h);
        }
        if (name) {
          projects.push({
            id: `proj_${projects.length + 1}`,
            name,
            role,
            description: desc,
            highlights,
          });
        }
      }
      if (projects.length > 0) result.projects = projects;
    }

    // F. Certifications
    else if (normTitle.includes('certificat') || normTitle.includes('license')) {
      const certs: ResumeContent['certifications'] = [];
      const certLines = body.split(/\\\\|\n/);
      for (const line of certLines) {
        const clean = unescapeLatex(line.replace(/\\item\s*/, '')).trim();
        if (clean) {
          const parts = clean.split(/[-—–|]/);
          certs.push({
            id: `cert_${certs.length + 1}`,
            name: parts[0]?.trim() || clean,
            issuer: parts[1]?.trim() || 'Issuing Authority',
            date: parts[2]?.trim(),
          });
        }
      }
      if (certs.length > 0) result.certifications = certs;
    }

    // G. Languages
    else if (normTitle.includes('language')) {
      const langs: ResumeContent['languages'] = [];
      const lines = body.split(/\\\\|\n/);
      for (const line of lines) {
        const clean = unescapeLatex(line.replace(/\\item\s*/, '')).trim();
        if (clean) {
          const parts = clean.split(/[-—–:|]/);
          langs.push({
            id: `lang_${langs.length + 1}`,
            name: parts[0]?.trim() || clean,
            proficiency: parts[1]?.trim(),
          });
        }
      }
      if (langs.length > 0) result.languages = langs;
    }

    // H. Achievements / Awards
    else if (normTitle.includes('achievement') || normTitle.includes('award') || normTitle.includes('honor')) {
      const items: string[] = [];
      const bulletRegex = /\\item\s+([^\n\\]+(?:\\\\\s*|\n)*)/g;
      let bMatch;
      while ((bMatch = bulletRegex.exec(body)) !== null) {
        const h = unescapeLatex(bMatch[1].replace(/\\end\{itemize\}/, '').trim());
        if (h) items.push(h);
      }
      if (items.length > 0) result.achievements = items;
    }

    // I. Custom Sections: ANY arbitrary section written in LaTeX!
    else {
      recognizedCustomTitles.add(rawTitle);
      const items: string[] = [];
      const bulletRegex = /\\item\s+([^\n\\]+(?:\\\\\s*|\n)*)/g;
      let bMatch;
      while ((bMatch = bulletRegex.exec(body)) !== null) {
        const h = unescapeLatex(bMatch[1].replace(/\\end\{itemize\}/, '').trim());
        if (h) items.push(h);
      }
      const desc = unescapeLatex(body.replace(/\\begin\{itemize\}[\s\S]*?\\end\{itemize\}/, '').trim());
      result.customSections.push({
        id: `custom_${result.customSections.length + 1}`,
        title: rawTitle,
        description: desc,
        items,
        visible: true,
      });
    }
  }

  const elapsed = typeof performance !== 'undefined' ? Math.round(performance.now() - startTime) : 0;

  diagnostics.unshift({
    line: 1,
    type: 'info',
    message: `Compiled ${totalLines} lines and ${sections.length} sections in ${elapsed}ms.`,
  });

  return {
    success: true,
    content: result,
    metadata,
    diagnostics,
    stats: {
      lineCount: totalLines,
      sectionCount: sections.length,
      parseTimeMs: elapsed,
    },
  };
}

/**
 * Legacy wrapper: Parse LaTeX resume source into structured resume content.
 */
export function parseLatexToResume(
  tex: string,
  existingContent?: ResumeContent
): ResumeContent {
  return compileLatexDocument(tex, existingContent).content;
}

