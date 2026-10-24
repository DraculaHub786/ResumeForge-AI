/**
 * Resume renderer — the WYSIWYG preview.
 *
 * This is the single source of truth for how a resume looks. The live preview,
 * the print stylesheet, and the PNG/PDF exports all render from this tree, so
 * what you see in the editor is exactly what you export.
 *
 * Layout is driven by the template's `layout` field:
 *  - single-column: ATS-friendly, one column, no sidebars
 *  - two-column:     sidebar + main content
 *  - banner:         full-width accent header
 */

import type { ResumeContent, Theme } from '@resume-builder/types';

const FONT_STACKS: Record<string, string> = {
  inter: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
  roboto: "'Roboto', 'Segoe UI', system-ui, sans-serif",
  'open-sans': "'Open Sans', 'Segoe UI', system-ui, sans-serif",
  lato: "'Lato', 'Segoe UI', system-ui, sans-serif",
  montserrat: "'Montserrat', 'Segoe UI', system-ui, sans-serif",
  'source-serif': "'Source Serif Pro', Georgia, 'Times New Roman', serif",
  'libre-baskerville': "'Libre Baskerville', Georgia, serif",
  times: "'Times New Roman', Times, serif",
  calibri: "Calibri, 'Segoe UI', system-ui, sans-serif",
  georgia: "Georgia, 'Times New Roman', serif",
};

export interface ResumeRendererProps {
  content: ResumeContent;
  theme: Theme;
  layout?: 'single-column' | 'two-column' | 'banner';
  pageMargin?: number;
  pageSize?: 'letter' | 'a4';
  /** Renders only the first page (preview mode) or the full document. */
  mode?: 'preview' | 'print';
}

function formatPeriod(period?: { start?: string; end?: string; current?: boolean }): string {
  if (!period?.start && !period?.end) return '';
  const start = period.start ?? '';
  const end = period.current ? 'Present' : (period.end ?? 'Present');
  return `${start} – ${end}`;
}

export function ResumeRenderer({
  content,
  theme,
  layout = 'single-column',
  pageMargin = 0.6,
  pageSize = 'letter',
}: ResumeRendererProps) {
  const fontFamily = FONT_STACKS[theme.fontFamily] ?? FONT_STACKS.inter;
  const pageWidth = pageSize === 'a4' ? '210mm' : '8.5in';
  const pageHeight = pageSize === 'a4' ? '297mm' : '11in';
  const margin = pageMargin;

  const headingText = (text: string) =>
    theme.uppercaseHeadings ? text.toUpperCase() : text;

  const sectionTitle = (title: string) => (
    <h2
      style={{
        fontSize: `${theme.fontSize + 1.5}pt`,
        fontWeight: 700,
        color: theme.primaryColor,
        textAlign: theme.sectionAlignment ?? 'left',
        textTransform: theme.headingCase === 'uppercase' ? 'uppercase' : theme.headingCase === 'title' ? 'capitalize' : 'none',
        letterSpacing: theme.headingCase === 'uppercase' ? '0.06em' : 'normal',
        margin: '0 0 6pt 0',
        paddingBottom: theme.showSectionRules ? '2pt' : 0,
        borderBottom: theme.showSectionRules ? `1pt solid ${theme.primaryColor}` : 'none',
        marginBottom: '6pt',
      }}
    >
      {headingText(title)}
    </h2>
  );

  const sectionBlock = (title: string, children: React.ReactNode) => {
    if (!children) return null;
    return (
      <section style={{ marginBottom: `${theme.sectionSpacing ?? 10}pt` }}>
        {sectionTitle(title)}
        {children}
      </section>
    );
  };

  const bodyStyle: React.CSSProperties = {
    fontFamily,
    fontSize: `${theme.fontSize}pt`,
    lineHeight: theme.lineHeight,
    color: theme.textColor,
  };

  const mutedStyle: React.CSSProperties = {
    color: theme.mutedColor,
    fontSize: `${theme.fontSize - 0.5}pt`,
  };

  const getListStyle = (style?: Theme['bulletStyle']): React.CSSProperties => {
    switch (style) {
      case 'square':
        return { listStyleType: 'square', paddingLeft: '14pt' };
      case 'circle':
        return { listStyleType: 'circle', paddingLeft: '14pt' };
      case 'dash':
        return { listStyleType: "'- '", paddingLeft: '14pt' };
      case 'arrow':
        return { listStyleType: "'▸ '", paddingLeft: '14pt' };
      case 'none':
        return { listStyleType: 'none', paddingLeft: '0pt' };
      case 'disc':
      default:
        return { listStyleType: 'disc', paddingLeft: '14pt' };
    }
  };
  const bulletListStyle = getListStyle(theme.bulletStyle);

  // --- Sidebar content (two-column layouts) ---
  const sidebarSections = (
    <>
      {content.skills?.length > 0 &&
        sectionBlock(
          'Skills',
          <div>
            {content.skills.map((group) => (
              <div key={group.id} style={{ marginBottom: '6pt' }}>
                <div style={{ fontWeight: 700, fontSize: `${theme.fontSize}pt` }}>{group.name}</div>
                <div style={mutedStyle}>{group.skills.join(' · ')}</div>
              </div>
            ))}
          </div>
        )}
      {content.languages?.length > 0 &&
        sectionBlock(
          'Languages',
          <ul style={{ margin: 0, textAlign: theme.contentAlignment ?? 'left', ...bulletListStyle }}>
            {content.languages.map((l) => (
              <li key={l.id} style={{ marginBottom: '2pt' }}>
                {l.name}
                {l.proficiency ? ` — ${l.proficiency}` : ''}
              </li>
            ))}
          </ul>
        )}
      {content.certifications?.length > 0 &&
        sectionBlock(
          'Certifications',
          <ul style={{ margin: 0, textAlign: theme.contentAlignment ?? 'left', ...bulletListStyle }}>
            {content.certifications.map((c) => (
              <li key={c.id} style={{ marginBottom: '2pt' }}>
                {c.name}
                {c.issuer ? ` — ${c.issuer}` : ''}
                {c.date ? ` (${c.date})` : ''}
              </li>
            ))}
          </ul>
        )}
      {content.interests?.length > 0 &&
        sectionBlock(
          'Interests',
          <div style={mutedStyle}>{content.interests.join(' · ')}</div>
        )}
    </>
  );

  // --- Main content ---
  const mainSections = (
    <>
      {content.summary?.trim() &&
        sectionBlock(
          'Professional Summary',
          <p style={{ margin: 0, textAlign: theme.contentAlignment ?? 'left' }}>{content.summary}</p>
        )}

      {content.experience?.length > 0 &&
        sectionBlock(
          'Experience',
          <div>
            {content.experience.map((item) => (
              <div key={item.id} style={{ marginBottom: '8pt' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: '8pt',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{item.position}</span>
                  <span style={mutedStyle}>{formatPeriod(item.period)}</span>
                </div>
                <div style={{ fontStyle: 'italic', color: theme.mutedColor, marginBottom: '3pt' }}>
                  {item.company}
                  {item.location ? ` · ${item.location}` : ''}
                </div>
                <ul style={{ margin: 0, textAlign: theme.contentAlignment ?? 'left', ...bulletListStyle }}>
                  {item.highlights?.filter(Boolean).map((h, i) => (
                    <li key={i} style={{ marginBottom: '1.5pt' }}>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

      {content.education?.length > 0 &&
        sectionBlock(
          'Education',
          <div>
            {content.education.map((item) => (
              <div key={item.id} style={{ marginBottom: '6pt' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: '8pt',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{item.institution}</span>
                  <span style={mutedStyle}>{formatPeriod(item.period)}</span>
                </div>
                <div>
                  {item.degree}
                  {item.score ? ` — ${item.score}` : ''}
                </div>
                {item.location && <div style={mutedStyle}>{item.location}</div>}
              </div>
            ))}
          </div>
        )}

      {content.projects?.length > 0 &&
        sectionBlock(
          'Projects',
          <div>
            {content.projects.map((item) => (
              <div key={item.id} style={{ marginBottom: '7pt' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: '8pt',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{item.name}</span>
                  {item.role && <span style={mutedStyle}>{item.role}</span>}
                </div>
                {item.description && <div style={{ marginBottom: '2pt', textAlign: theme.contentAlignment ?? 'left' }}>{item.description}</div>}
                <ul style={{ margin: 0, textAlign: theme.contentAlignment ?? 'left', ...bulletListStyle }}>
                  {item.highlights?.filter(Boolean).map((h, i) => (
                    <li key={i} style={{ marginBottom: '1.5pt' }}>
                      {h}
                    </li>
                  ))}
                </ul>
                {item.techStack && item.techStack.length > 0 && (
                  <div style={{ ...mutedStyle, marginTop: '2pt' }}>
                    {item.techStack.join(' · ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      {content.achievements?.length > 0 &&
        sectionBlock(
          'Achievements',
          <ul style={{ margin: 0, textAlign: theme.contentAlignment ?? 'left', ...bulletListStyle }}>
            {content.achievements.filter(Boolean).map((a, i) => (
              <li key={i} style={{ marginBottom: '2pt' }}>
                {a}
              </li>
            ))}
          </ul>
        )}

      {content.publications?.length > 0 &&
        sectionBlock(
          'Publications',
          <ul style={{ margin: 0, textAlign: theme.contentAlignment ?? 'left', ...bulletListStyle }}>
            {content.publications.map((p) => (
              <li key={p.id} style={{ marginBottom: '2pt' }}>
                {p.title} — {p.publisher}
                {p.date ? ` (${p.date})` : ''}
              </li>
            ))}
          </ul>
        )}

      {content.volunteer?.length > 0 &&
        sectionBlock(
          'Volunteer Work',
          <div>
            {content.volunteer.map((v) => (
              <div key={v.id} style={{ marginBottom: '5pt' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: '8pt',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{v.role}</span>
                  <span style={mutedStyle}>{formatPeriod(v.period)}</span>
                </div>
                <div style={{ fontStyle: 'italic', color: theme.mutedColor }}>
                  {v.organization}
                </div>
                <ul style={{ margin: '2pt 0 0 0', textAlign: theme.contentAlignment ?? 'left', ...bulletListStyle }}>
                  {v.highlights?.filter(Boolean).map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

      {content.customSections?.filter((s) => s.visible).length > 0 &&
        content.customSections
          .filter((s) => s.visible)
          .map((section) =>
            sectionBlock(
              section.title,
              <div>
                {section.description && <p style={{ margin: '0 0 4pt 0', textAlign: theme.contentAlignment ?? 'left' }}>{section.description}</p>}
                <ul style={{ margin: 0, textAlign: theme.contentAlignment ?? 'left', ...bulletListStyle }}>
                  {section.items.map((item, i) => (
                    <li key={i} style={{ marginBottom: '2pt' }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          )}
    </>
  );

  // --- Profile header ---
  const profile = content.profile ?? ({} as ResumeContent['profile']);
  const contactParts: string[] = [];
  if (profile.email) contactParts.push(profile.email);
  if (profile.phone) contactParts.push(profile.phone);
  if (profile.location && !profile.location.includes('\\') && !profile.location.includes('{')) {
    contactParts.push(profile.location);
  }
  if (profile.links?.length) {
    contactParts.push(profile.links.map((l) => l.label).filter(Boolean).join(' · '));
  }

  const headerAlign = theme.headerAlignment ?? 'left';
  const hasProfileHeader = Boolean(profile.fullName?.trim() || profile.headline?.trim() || contactParts.length > 0);
  const profileHeader = hasProfileHeader ? (
    <header style={{ marginBottom: `${theme.sectionSpacing ?? 10}pt`, textAlign: headerAlign }}>
      {profile.fullName?.trim() && (
        <h1
          style={{
            fontSize: `${theme.fontSize + 8}pt`,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.15,
            color: layout === 'banner' ? '#ffffff' : theme.textColor,
          }}
        >
          {profile.fullName}
        </h1>
      )}
      {profile.headline?.trim() && !profile.headline.includes('\\') && !profile.headline.includes('{') && (
        <div
          style={{
            fontSize: `${theme.fontSize + 1}pt`,
            color: layout === 'banner' ? '#ffffff' : theme.primaryColor,
            marginTop: '2pt',
            fontWeight: 600,
          }}
        >
          {profile.headline}
        </div>
      )}
      {contactParts.length > 0 && (
        <div
          style={{
            fontSize: `${theme.fontSize - 0.5}pt`,
            color: layout === 'banner' ? '#e5e7eb' : theme.mutedColor,
            marginTop: '4pt',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: headerAlign === 'center' ? 'center' : headerAlign === 'right' ? 'flex-end' : 'flex-start',
            gap: '8pt',
          }}
        >
          {contactParts.join('  |  ')}
        </div>
      )}
    </header>
  ) : null;

  const pageStyle: React.CSSProperties = {
    width: pageWidth,
    minHeight: pageHeight,
    backgroundColor: theme.backgroundColor || '#ffffff',
    padding: `${margin}in`,
    boxSizing: 'border-box',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #cbd5e1',
    borderRadius: '2px',
    display: 'flex',
    flexDirection: 'column',
    ...bodyStyle,
  };

  // --- Layout variants ---
  if (layout === 'two-column') {
    return (
      <div data-testid="resume-preview" data-layout={layout} style={{ ...pageStyle, display: 'flex', gap: '18pt' }}>
        <aside style={{ width: '30%', flexShrink: 0 }}>
          {profile.about && (
            <div style={{ marginBottom: '8pt' }}>
              {sectionTitle('About')}
              <div style={{ fontSize: `${theme.fontSize - 0.5}pt` }}>{profile.about}</div>
            </div>
          )}
          {sidebarSections}
        </aside>
        <main style={{ flex: 1, minWidth: 0 }}>{mainSections}</main>
      </div>
    );
  }

  if (layout === 'banner') {
    return (
      <div data-testid="resume-preview" data-layout={layout} style={{ ...pageStyle, padding: 0 }}>
        <div
          style={{
            backgroundColor: theme.primaryColor,
            padding: `${margin}in`,
            marginBottom: `${margin}in`,
          }}
        >
          {profileHeader}
        </div>
        <div style={{ padding: `0 ${margin}in` }}>
          {profile.about && (
            <div style={{ marginBottom: '8pt' }}>
              {sectionTitle('About')}
              <div>{profile.about}</div>
            </div>
          )}
          {mainSections}
          {sidebarSections}
        </div>
      </div>
    );
  }

  // single-column
  return (
    <div data-testid="resume-preview" data-layout={layout} style={pageStyle}>
      {profileHeader}
      {profile.about && (
        <div style={{ marginBottom: '8pt' }}>
          {sectionTitle('About')}
          <div>{profile.about}</div>
        </div>
      )}
      {mainSections}
      {sidebarSections}
    </div>
  );
}
