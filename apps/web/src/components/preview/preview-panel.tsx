/**
 * Live preview panel.
 *
 * Renders the resume using the same component tree that the PDF/PNG export
 * uses, so the preview is pixel-accurate. Updates on every keystroke.
 */

'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@resume-builder/ui';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { ResumeRenderer } from './resume-renderer';
import { getTemplate } from '@resume-builder/types';
import type { ResumeContent, Theme } from '@resume-builder/types';

interface PreviewPanelProps {
  content: ResumeContent;
  theme: Theme;
  template: string;
  pageMargin?: number;
  pageSize?: 'letter' | 'a4';
}

export function PreviewPanel({
  content,
  theme,
  template,
  pageMargin = 0.6,
  pageSize = 'letter',
}: PreviewPanelProps) {
  const zoom = useRef(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('preview');
  const tTemplates = useTranslations('templates');

  const templateDef = getTemplate(template);
  const layout = templateDef?.layout === 'two-column' || templateDef?.layout === 'banner'
    ? templateDef.layout
    : 'single-column';

  const setZoom = (next: number) => {
    zoom.current = Math.min(Math.max(next, 0.4), 1.6);
    if (containerRef.current) {
      containerRef.current.style.transform = `scale(${zoom.current})`;
      containerRef.current.style.transformOrigin = 'top center';
    }
  };

  const badgeName = tTemplates.has(`items.${template}.name`)
    ? tTemplates(`items.${template}.name`)
    : templateDef?.name ?? t('defaultTemplate');

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 py-3">
        <CardTitle className="text-sm">{t('livePreview')}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs" data-testid="template-badge">
            {badgeName}
          </Badge>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom(zoom.current - 0.1)}
              aria-label={t('zoomOut')}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom(1)}
              aria-label={t('resetZoom')}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setZoom(zoom.current + 0.1)}
              aria-label={t('zoomIn')}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="overflow-auto bg-muted/40 p-6"
          style={{ maxHeight: 'calc(100vh - 220px)' }}
        >
          <div className="mx-auto shadow-lg" style={{ width: 'fit-content' }}>
            <ResumeRenderer
              content={content}
              theme={theme}
              layout={layout}
              pageMargin={pageMargin}
              pageSize={pageSize}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
