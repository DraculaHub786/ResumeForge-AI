/**
 * Open Graph image — the card that social platforms show when a link to the
 * app is shared.
 *
 * `next/og` renders it at the edge with Satori, so this file must only use
 * the subset of CSS that Satori understands: flexbox, explicit sizes, and
 * inline styles. No Tailwind classes, no external fonts (the default is a
 * system sans that Satori bundles).
 */

import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ResumeForge AI — build an ATS-ready resume with live preview and real AI assistance';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0b1120',
          backgroundImage:
            'radial-gradient(circle at 12% 8%, rgba(56,189,248,0.28) 0%, transparent 42%), radial-gradient(circle at 88% 92%, rgba(168,85,247,0.26) 0%, transparent 45%)',
          padding: '72px 80px',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: '-0.01em',
            }}
          >
            Resume
            <span style={{ color: '#38bdf8' }}>Forge</span>
            <span style={{ color: '#94a3b8', fontWeight: 400 }}> AI</span>
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 44,
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              maxWidth: 940,
            }}
          >
            The resume that gets past the filter
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: 30,
              color: '#cbd5f5',
              maxWidth: 880,
              lineHeight: 1.35,
            }}
          >
            Live editing, real AI rewriting, an ATS score you can act on, and
            export to PDF, Word, PNG or LaTeX.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {['Live preview', 'ATS score', '12 templates', 'PDF · DOCX · LaTeX'].map(
            (pill) => (
              <div
                key={pill}
                style={{
                  display: 'flex',
                  padding: '12px 22px',
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.35)',
                  backgroundColor: 'rgba(15,23,42,0.55)',
                  fontSize: 22,
                  color: '#e2e8f0',
                }}
              >
                {pill}
              </div>
            )
          )}
        </div>
      </div>
    ),
    size
  );
}
