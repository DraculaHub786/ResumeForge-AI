import { describe, it, expect } from 'vitest';
import { generateLatex } from './export';
import { createEmptyContent, createEmptyResume } from '@resume-builder/types';

describe('export utilities', () => {
  it('generates latex from resume content and metadata', () => {
    const content = createEmptyContent();
    content.profile.fullName = 'Alan Turing';
    content.profile.email = 'alan@bletchley.uk';
    content.summary = 'Mathematician and computer scientist.';

    const metadata = createEmptyResume().metadata;
    const latex = generateLatex(content, metadata);
    expect(latex).toContain('\\documentclass');
    expect(latex).toContain('Alan Turing');
    expect(latex).toContain('alan@bletchley.uk');
  });
});
