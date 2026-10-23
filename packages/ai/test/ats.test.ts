import { describe, it, expect } from 'vitest';

import {
  runLocalAtsCheck,
  extractKeywords,
  ACTION_VERBS,
} from '../src/ats.js';

describe('extractKeywords', () => {
  it('returns matched keywords in rank order', () => {
    const words = extractKeywords(
      'TypeScript React AWS Kubernetes experience',
    );
    expect(words.slice(0, 4)).toEqual(['TypeScript', 'React', 'AWS', 'Kubernetes']);
  });

  it('favours the nicest spelling of a keyword', () => {
    expect(extractKeywords('React react REACT')).toEqual(['React']);
  });

  it('excludes stop words and short tokens', () => {
    const words = extractKeywords('a an and is it of the');
    expect(words).toEqual([]);
  });

  it('respects the limit', () => {
    const words = extractKeywords('JavaScript Python Java Go Rust CSharp Rust');
    expect(words.length).toBeLessThanOrEqual(15);
  });

  it('strips trailing punctuation so "experience." matches "experience"', () => {
    const words = extractKeywords('leadership., experience., service.');
    expect(words).toContain('leadership');
    expect(words).toContain('service');
    expect(words).not.toContain('experience');
  });

  it('keeps dotted technology names intact', () => {
    expect(extractKeywords('We use node.js and TypeScript')).toContain('node.js');
  });
});

describe('runLocalAtsCheck', () => {
  it('scores high on well-structured resumes with keywords', () => {
    const content = [
      'John Doe',
      'Senior Engineer',
      'john@example.com',
      '+1 555 010 9988',
      '',
      'Experience:',
      'Led a team of 5 engineers, cutting release time by 40%.',
      'Built a payments platform handling 200k monthly users.',
      'Skills: TypeScript, React, AWS',
    ].join('\n');
    const r = runLocalAtsCheck(content, {
      targetJobDescription: 'We need TypeScript, React, AWS experience.',
    });
    expect(r.score).toBeGreaterThan(60);
    expect(r.issues.length).toBeLessThanOrEqual(2);
    // Keywords present in the resume are not reported as missing.
    expect(r.missingKeywords).not.toContain('TypeScript');
    expect(r.missingKeywords).not.toContain('React');
    expect(r.missingKeywords).not.toContain('AWS');
  });

  it('identifies bullets without action verbs and quantification', () => {
    const content = [
      'Mary Smith',
      'Engineer',
      'mary@example.com',
      '',
      'Work',
      'Helped maintain the staging environment.',
      'Worked on analytics.',
    ].join('\n');
    const r = runLocalAtsCheck(content);
    expect(r.score).toBeLessThan(80);
    expect(r.suggestions.length).toBeGreaterThan(1);
  });

  it('flags first-person pronouns', () => {
    const content = ['I lead a team.', 'I wrote modules.'].join('\n');
    const r = runLocalAtsCheck(content);
    expect(r.issues.some((i) => i.includes('first-person'))).toBe(true);
  });

  it('returns deterministic output for identical input', () => {
    const a = runLocalAtsCheck('abc def abc def');
    const b = runLocalAtsCheck('abc def abc def');
    expect(a).toEqual(b);
  });

  it('reports missing job keywords when the description says so', () => {
    const r = runLocalAtsCheck('Clean resume with no tech keywords.', {
      targetJobDescription: 'java spring boot kubernetes',
    });
    expect(r.missingKeywords).toEqual(
      expect.arrayContaining(['java', 'spring', 'boot', 'kubernetes']),
    );
  });
});

describe('ACTION_VERBS', () => {
  it('contains strong engineering verbs', () => {
    expect(ACTION_VERBS).toContain('led');
    expect(ACTION_VERBS).toContain('built');
    expect(ACTION_VERBS).toContain('reduced');
  });
});
