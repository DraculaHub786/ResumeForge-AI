/**
 * Live preview panel.
 *
 * Renders the resume using the same component tree that the PDF/PNG export
 * uses, so the preview is pixel-accurate. Updates on every keystroke.
 */

'use client';

import { useRef, useState, useEffect } from 'react';
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
  const [zoomLevel, setZoomLevel] = useState(0.85);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('preview');
  const tTemplates = useTranslations('templates');

  const templateDef = getTemplate(template);
  const layout = templateDef?.layout === 'two-column' || templateDef?.layout === 'banner'
    ? templateDef.layout
    : 'single-column';

  const setZoom = (next: number) => {
    const clamped = Math.min(Math.max(Number(next.toFixed(2)), 0.4), 1.6);
    setZoomLevel(clamped);
    if (containerRef.current) {
      containerRef.current.style.transform = `scale(${clamped})`;
      containerRef.current.style.transformOrigin = 'top center';
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.transform = `scale(${zoomLevel})`;
      containerRef.current.style.transformOrigin = 'top center';
    }
  }, [zoomLevel]);

  const badgeName = tTemplates.has(`items.${template}.name`)
    ? tTemplates(`items.${template}.name`)
    : templateDef?.name ?? t('defaultTemplate');

  return (
    <Card className="h-full overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0 py-3 bg-muted/20 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-bold">{t('livePreview')}</CardTitle>
          <Badge variant="outline" className="text-[11px] font-mono px-1.5 py-0 bg-background text-muted-foreground border-slate-300 dark:border-slate-700">
            {pageSize.toUpperCase()} Full Sheet
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-medium" data-testid="template-badge">
            {badgeName}
          </Badge>
          <div className="flex items-center gap-1 border border-slate-300 dark:border-slate-700 rounded-lg p-0.5 bg-background shadow-xs">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setZoom(zoomLevel - 0.1)}
              aria-label={t('zoomOut')}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[11px] font-mono px-1.5 text-muted-foreground min-w-[3rem] text-center select-none font-medium">
              {Math.round(zoomLevel * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setZoom(0.85)}
              title="Reset to Fit"
              aria-label={t('resetZoom')}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setZoom(zoomLevel + 0.1)}
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
