import { describe, it, expect } from 'vitest';

import { escapeLatex, formatPeriod, resumeToLatex } from '../src/latex.js';
import { getPageGeometry, inToMm, mmToPt } from '../src/layout.js';
import { createEmptyContent } from '@resume-builder/types';

describe('escapeLatex', () => {
  it('escapes the characters that break compilation', () => {
    expect(escapeLatex('100% & $5')).toBe('100\\% \\& \\$5');
    expect(escapeLatex('a_b')).toBe('a\\_b');
    expect(escapeLatex('{braces}')).toBe('\\{braces\\}');
    expect(escapeLatex('back\\slash')).toBe('back\\textbackslash{}slash');
    expect(escapeLatex('#hash')).toBe('\\#hash');
  });

  it('escapes newlines as LaTeX line breaks', () => {
    expect(escapeLatex('one\ntwo')).toBe('one\\\\ two');
  });

  it('leaves ordinary text alone', () => {
    expect(escapeLatex('Senior Engineer')).toBe('Senior Engineer');
  });
});

describe('formatPeriod', () => {
  it('returns an empty string when there is no period', () => {
    expect(formatPeriod(undefined)).toBe('');
    expect(formatPeriod({})).toBe('');
  });

  it('formats a closed range', () => {
    expect(formatPeriod({ start: '2020-01', end: '2022-03' })).toBe('2020-01 - 2022-03');
  });

  it('uses "Present" for an ongoing role', () => {
    expect(formatPeriod({ start: '2022-03', current: true })).toBe('2022-03 - Present');
  });

  it('renders a single endpoint on its own', () => {
    expect(formatPeriod({ start: '2022-03' })).toBe('2022-03');
    expect(formatPeriod({ end: '2022-03' })).toBe('2022-03');
  });
});

describe('page geometry', () => {
  it('converts inches to millimetres', () => {
    expect(inToMm(1)).toBeCloseTo(25.4, 3);
  });

  it('converts millimetres to points', () => {
    expect(mmToPt(25.4)).toBeCloseTo(72, 3);
  });

  it('returns the geometry for a page size', () => {
    const letter = getPageGeometry('letter');
    const a4 = getPageGeometry('a4');
    expect(letter.widthMm).toBeGreaterThan(0);
    expect(a4.heightMm).toBeGreaterThan(letter.heightMm);
  });

  it('defaults to letter', () => {
    expect(getPageGeometry()).toEqual(getPageGeometry('letter'));
  });
});

describe('resumeToLatex', () => {
  const content = createEmptyContent();
  content.profile.fullName = 'Jane Doe';
  content.profile.headline = 'Senior Engineer';
  content.profile.email = 'jane@example.com';
  content.summary = 'Engineer with 100% focus.';
  content.experience.push({
    id: 'e1',
    position: 'Engineer',
    company: 'Acme & Co',
    period: { start: '2020-01', current: true },
    highlights: ['Shipped the thing.', 'Cut costs by 30%.'],
    techStack: ['TypeScript'],
  });
  content.skills.push({ id: 's1', name: 'Languages', skills: ['Go', 'Rust'] });
  content.education.push({
    id: 'd1',
    degree: 'MSc',
    institution: 'TU Berlin',
    period: { start: '2016', end: '2019' },
  });

  it('produces a complete LaTeX document', () => {
    const latex = resumeToLatex(content);
    expect(latex).toContain('\\documentclass');
    expect(latex).toContain('\\begin{document}');
    expect(latex).toContain('\\end{document}');
    expect(latex).toContain('Jane Doe');
  });

  it('includes every section that has content', () => {
    const latex = resumeToLatex(content);
    expect(latex).toContain('Acme \\& Co');
    expect(latex).toContain('Shipped the thing.');
    expect(latex).toContain('TU Berlin');
    expect(latex).toContain('Go');
  });

  it('escapes user content', () => {
    const latex = resumeToLatex(content);
    expect(latex).toContain('100\\% focus');
    expect(latex).not.toContain('100% focus');
  });

  it('omits empty sections', () => {
    const empty = createEmptyContent();
    empty.profile.fullName = 'Jane Doe';
    const latex = resumeToLatex(empty);
    expect(latex).toContain('Jane Doe');
    expect(latex).not.toContain('\\section{Experience}');
    expect(latex).not.toContain('\\section{Education}');
  });

  it('renders an ongoing role with "Present"', () => {
    const latex = resumeToLatex(content);
    expect(latex).toContain('2020-01 - Present');
  });

  it('honours the requested page size', () => {
    const letter = resumeToLatex(content, { pageSize: 'letter' });
    const a4 = resumeToLatex(content, { pageSize: 'a4' });
    expect(letter).not.toBe(a4);
  });
});

describe('buildExportFilename', () => {
  it('formats filename with user name and Resume suffix', async () => {
    const { buildExportFilename } = await import('../src/layout.js');
    expect(buildExportFilename({ profile: { fullName: 'Alex Rivera' } })).toBe('Alex-Rivera-Resume.pdf');
    expect(buildExportFilename({ profile: { fullName: 'Alexander Rivera' } }, 'res_mvlgmqezei1br4o4', 'docx')).toBe('Alexander-Rivera-Resume.docx');
    expect(buildExportFilename({ basics: { name: 'Jishnu Mondal' } }, 'Untitled', 'png')).toBe('Jishnu-Mondal-Resume.png');
  });

  it('avoids duplicate -Resume and strips res_ internal IDs', async () => {
    const { buildExportFilename } = await import('../src/layout.js');
    expect(buildExportFilename(null, 'res_mvlc8dimknkegy8r')).toBe('Resume.pdf');
    expect(buildExportFilename(null, 'Alex-Rivera-Resume.pdf')).toBe('Alex-Rivera-Resume.pdf');
    expect(buildExportFilename({ profile: { fullName: 'Alex Rivera' } }, 'Alex-Rivera-Resume')).toBe('Alex-Rivera-Resume.pdf');
  });
});

describe('compileLatexDocument', () => {
  it('clears resume and returns empty content when LaTeX is empty string', async () => {
    const { compileLatexDocument } = await import('../src/latex.js');
    const existing = { profile: { fullName: 'Alex Rivera', links: [] }, experience: [{ id: '1', position: 'Eng', company: 'Co', period: {}, highlights: [] }] } as any;
    const res = compileLatexDocument('', existing);
    expect(res.success).toBe(true);
    expect(res.content.profile.fullName).toBe('');
    expect(res.content.experience).toEqual([]);
    expect(res.content.education).toEqual([]);
  });

  it('reflects section deletion when LaTeX code removes a section', async () => {
    const { compileLatexDocument } = await import('../src/latex.js');
    const existing = {
      profile: { fullName: 'Alex Rivera', links: [] },
      summary: 'Old summary',
      experience: [{ id: '1', position: 'Old Job', company: 'Old Co', period: {}, highlights: [] }],
    } as any;
    const texOnlyProfile = `\\begin{document}\\begin{center}{\\LARGE\\bfseries Jane Doe}\\end{center}\\end{document}`;
    const res = compileLatexDocument(texOnlyProfile, existing);
    expect(res.content.profile.fullName).toBe('Jane Doe');
    expect(res.content.summary).toBe('');
    expect(res.content.experience).toEqual([]);
  });
});


