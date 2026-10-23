import { describe, it, expect } from 'vitest';
import { resumeToPdf } from '../src/server.js';
import { createEmptyContent } from '@resume-builder/types';

describe('resumeToPdf', () => {
  it('generates a valid binary PDF with document header', async () => {
    const content = createEmptyContent();
    content.profile.fullName = 'Grace Hopper';
    content.profile.headline = 'Computer Scientist';
    content.profile.email = 'grace@example.com';
    content.summary = 'Pioneer of computer programming and compiler design.';
    content.experience.push({
      id: 'e1',
      position: 'Director',
      company: 'US Navy',
      period: { start: '1943', end: '1986' },
      highlights: ['Led compiler development team.', 'Invented first compiler tools.'],
    });
    content.skills.push({ id: 's1', name: 'Languages', skills: ['COBOL', 'Machine Code'] });

    const pdfBytes = await resumeToPdf(content, {
      pageSize: 'letter',
      pageMargin: 0.5,
      theme: {
        id: 'modern',
        name: 'Modern',
        primaryColor: '#2563eb',
        textColor: '#1e293b',
        mutedColor: '#64748b',
        backgroundColor: '#ffffff',
        fontFamily: 'Inter',
        fontSize: 'md',
        lineHeight: 'normal',
        uppercaseHeadings: true,
        showSectionRules: true,
      },
    });

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(500);

    // Verify PDF magic bytes '%PDF-'
    const header = Buffer.from(pdfBytes.slice(0, 5)).toString('latin1');
    expect(header).toBe('%PDF-');
  });

  it('handles empty content gracefully', async () => {
    const empty = createEmptyContent();
    const pdfBytes = await resumeToPdf(empty);

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    const header = Buffer.from(pdfBytes.slice(0, 5)).toString('latin1');
    expect(header).toBe('%PDF-');
  });
});
