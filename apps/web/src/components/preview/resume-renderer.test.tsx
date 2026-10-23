import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ResumeRenderer } from './resume-renderer';
import { createEmptyContent, createDefaultTheme } from '@resume-builder/types';

const theme = createDefaultTheme();

function renderResume(overrides: Partial<Parameters<typeof ResumeRenderer>[0]> = {}) {
  const content = createEmptyContent();
  content.profile.fullName = 'Jane Doe';
  content.profile.headline = 'Staff Engineer';
  content.profile.email = 'jane@example.com';
  content.summary = 'Engineer with a decade of experience.';
  content.experience.push({
    id: 'e1',
    position: 'Engineer',
    company: 'Acme',
    period: { start: '2020-01', current: true },
    highlights: ['Shipped the thing.', 'Cut costs by 30%.'],
  });
  content.skills.push({ id: 's1', name: 'Languages', skills: ['Go', 'Rust'] });

  return render(
    <ResumeRenderer
      content={overrides.content ?? content}
      theme={overrides.theme ?? theme}
      layout={overrides.layout}
      pageMargin={overrides.pageMargin}
      pageSize={overrides.pageSize}
    />
  );
}

describe('ResumeRenderer', () => {
  it('renders the profile header', () => {
    renderResume();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Staff Engineer')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('renders experience entries and bullets', () => {
    renderResume();
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByText('Shipped the thing.')).toBeInTheDocument();
    expect(screen.getByText('Cut costs by 30%.')).toBeInTheDocument();
  });

  it('renders an ongoing role as "Present"', () => {
    renderResume();
    expect(screen.getByText(/2020-01\s*[–-]\s*Present/)).toBeInTheDocument();
  });

  it('renders skills', () => {
    renderResume();
    expect(screen.getByText('Languages')).toBeInTheDocument();
    // Skills in a group are joined into a single line, so match on the text
    // content rather than on an exact node.
    expect(
      screen.getByText((_, node) => node?.textContent === 'Go · Rust'),
    ).toBeInTheDocument();
  });

  it('omits sections with no content', () => {
    const content = createEmptyContent();
    content.profile.fullName = 'Jane Doe';
    renderResume({ content });
    expect(screen.queryByText('Acme')).not.toBeInTheDocument();
    expect(screen.queryByText('Languages')).not.toBeInTheDocument();
  });

  it('escapes nothing — it renders text as plain content', () => {
    const content = createEmptyContent();
    content.profile.fullName = '<script>alert(1)</script>';
    renderResume({ content });
    // React escapes it, so the script tag must not become an element.
    expect(document.querySelector('script')).toBeNull();
    expect(screen.getByText('<script>alert(1)</script>')).toBeInTheDocument();
  });
});
