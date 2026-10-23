import { describe, it, expect } from 'vitest';

import {
  resumeContentSchema,
  resumeMetadataSchema,
  resumeSchema,
  personalSchema,
  experienceItemSchema,
  skillGroupSchema,
  createDefaultMetadata,
  assertSchemaTypeConsistency,
  validateResumeForExport,
} from '../src/schemas.js';
import { createEmptyContent, createEmptyResume } from '../src/resume.js';

describe('personalSchema', () => {
  it('accepts an empty draft profile', () => {
    // A brand-new resume has no name yet — it must still be a valid document.
    expect(personalSchema.safeParse({ fullName: '', links: [] }).success).toBe(true);
  });

  it('validates the email format when present', () => {
    expect(
      personalSchema.safeParse({ fullName: 'Jane', email: 'nope', links: [] }).success,
    ).toBe(false);
    expect(
      personalSchema.safeParse({ fullName: 'Jane', email: '', links: [] }).success,
    ).toBe(true);
    expect(
      personalSchema.safeParse({ fullName: 'Jane', email: 'jane@example.com', links: [] }).success,
    ).toBe(true);
  });

  it('defaults the links array', () => {
    const parsed = personalSchema.parse({ fullName: 'Jane' });
    expect(parsed.links).toEqual([]);
  });

  it('rejects a profile link with a malformed URL', () => {
    expect(
      personalSchema.safeParse({
        fullName: 'Jane',
        links: [{ id: 'l1', label: 'GitHub', url: 'not-a-url' }],
      }).success,
    ).toBe(false);
    expect(
      personalSchema.safeParse({
        fullName: 'Jane',
        links: [{ id: 'l1', label: 'GitHub', url: '' }],
      }).success,
    ).toBe(true);
  });
});

describe('experienceItemSchema', () => {
  const valid = {
    id: 'exp_1',
    position: 'Engineer',
    company: 'Acme',
    period: { start: '2020-01', end: '2022-01' },
    highlights: ['Did a thing'],
  };

  it('accepts a complete item', () => {
    expect(experienceItemSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts a half-finished draft item', () => {
    expect(experienceItemSchema.safeParse({ ...valid, highlights: [] }).success).toBe(true);
    expect(experienceItemSchema.safeParse({ ...valid, position: '', company: '' }).success).toBe(
      true,
    );
  });

  it('requires an id', () => {
    expect(experienceItemSchema.safeParse({ ...valid, id: '' }).success).toBe(false);
  });
});

describe('skillGroupSchema', () => {
  it('accepts an empty draft group', () => {
    expect(
      skillGroupSchema.safeParse({ id: 's1', name: 'Languages', skills: [] }).success,
    ).toBe(true);
    expect(
      skillGroupSchema.safeParse({ id: 's1', name: 'Languages', skills: ['Go'] }).success,
    ).toBe(true);
  });

  it('bounds the proficiency level', () => {
    expect(
      skillGroupSchema.safeParse({ id: 's1', name: 'L', skills: ['Go'], level: 5 }).success,
    ).toBe(true);
    expect(
      skillGroupSchema.safeParse({ id: 's1', name: 'L', skills: ['Go'], level: 9 }).success,
    ).toBe(false);
  });
});

describe('resumeContentSchema', () => {
  it('accepts the empty content produced by the builder', () => {
    const parsed = resumeContentSchema.parse(createEmptyContent());
    expect(parsed.experience).toEqual([]);
    expect(parsed.customSections).toEqual([]);
  });

  it('fills in missing optional sections with empty arrays', () => {
    const parsed = resumeContentSchema.parse({
      profile: { fullName: 'Jane', links: [] },
    });
    expect(parsed.education).toEqual([]);
    expect(parsed.languages).toEqual([]);
  });

  it('rejects a missing profile', () => {
    expect(resumeContentSchema.safeParse({ experience: [] }).success).toBe(false);
  });
});

describe('resumeMetadataSchema', () => {
  it('accepts the default metadata', () => {
    expect(resumeMetadataSchema.safeParse(createDefaultMetadata()).success).toBe(true);
  });

  it('rejects an invalid colour', () => {
    const metadata = createDefaultMetadata();
    metadata.theme.primaryColor = 'blue';
    expect(resumeMetadataSchema.safeParse(metadata).success).toBe(false);
  });

  it('rejects an out-of-range font size', () => {
    const metadata = createDefaultMetadata();
    metadata.theme.fontSize = 40;
    expect(resumeMetadataSchema.safeParse(metadata).success).toBe(false);
  });

  it('rejects an unknown page size', () => {
    const metadata = createDefaultMetadata();
    (metadata as { pageSize: string }).pageSize = 'tabloid';
    expect(resumeMetadataSchema.safeParse(metadata).success).toBe(false);
  });
});

describe('resumeSchema', () => {
  it('accepts a canonical resume', () => {
    const resume = createEmptyResume('My Resume');
    resume.content.profile.fullName = 'Jane Doe';
    expect(resumeSchema.safeParse(resume).success).toBe(true);
  });

  it('rejects a non-ISO createdAt', () => {
    const resume = createEmptyResume('My Resume');
    (resume as { createdAt: string }).createdAt = 'yesterday';
    expect(resumeSchema.safeParse(resume).success).toBe(false);
  });
});

describe('assertSchemaTypeConsistency', () => {
  it('does not throw for the canonical builders', () => {
    expect(() => assertSchemaTypeConsistency()).not.toThrow();
  });
});

describe('validateResumeForExport', () => {
  it('flags a blank resume', () => {
    const issues = validateResumeForExport(createEmptyContent());
    expect(issues.map((i) => i.field)).toContain('profile.fullName');
    expect(issues.map((i) => i.field)).toContain('experience');
  });

  it('passes a complete resume', () => {
    const content = createEmptyContent();
    content.profile.fullName = 'Jane Doe';
    content.experience.push({
      id: 'e1',
      position: 'Engineer',
      company: 'Acme',
      period: { start: '2020-01' },
      highlights: ['Shipped a thing'],
    });
    expect(validateResumeForExport(content)).toEqual([]);
  });

  it('flags roles without bullets', () => {
    const content = createEmptyContent();
    content.profile.fullName = 'Jane Doe';
    content.experience.push({
      id: 'e1',
      position: 'Engineer',
      company: 'Acme',
      period: {},
      highlights: [],
    });
    const issues = validateResumeForExport(content);
    expect(issues.map((i) => i.field)).toContain('experience.0.highlights');
  });
});
