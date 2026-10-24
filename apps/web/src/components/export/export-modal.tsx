/**
 * Export modal — choose a format and download the resume.
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  RadioGroup,
} from '@resume-builder/ui';
import { FileText, FileType, Image, Code2, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  exportPdfCanvas,
  exportServerPdf,
  exportPng,
  exportDocx,
  exportLatex,
  buildExportFilename,
  type ExportFormat,
} from '@/lib/export';
import type { ResumeContent, ResumeMetadata } from '@resume-builder/types';

const FORMATS: Array<{
  id: ExportFormat;
  icon: typeof FileText;
}> = [
  { id: 'pdf', icon: FileText },
  { id: 'docx', icon: FileType },
  { id: 'png', icon: Image },
  { id: 'latex', icon: Code2 },
];

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: ResumeContent;
  metadata: ResumeMetadata;
  title: string;
  /** Ref to the live preview node — used for pixel-accurate PDF/PNG. */
  previewRef: React.RefObject<HTMLElement>;
}

export function ExportModal({
  open,
  onOpenChange,
  content,
  metadata,
  title,
  previewRef,
}: ExportModalProps) {
  const t = useTranslations('export');
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [busy, setBusy] = useState(false);

  const currentExt = format === 'latex' ? 'tex' : format;
  const currentFilename = buildExportFilename(content, title, currentExt);

  const handleExport = async () => {
    setBusy(true);
    try {
      const ext = format === 'latex' ? 'tex' : format;
      const targetFilename = buildExportFilename(content, title, ext);
      let previewUrl: string | null = null;

      switch (format) {
        case 'pdf': {
          try {
            const res = await exportServerPdf(content, metadata, title);
            previewUrl = res.url;
          } catch {
            const el = (document.querySelector('[data-testid="resume-preview"]') || previewRef.current) as HTMLElement | null;
            if (el) {
              await exportPdfCanvas(el, targetFilename.replace(/\.pdf$/, ''), metadata);
            } else {
              throw new Error('PDF export failed. Please check network connection.');
            }
          }
          break;
        }
        case 'docx': {
          const res = await exportDocx(content, metadata, title);
          previewUrl = res.url;
          break;
        }
        case 'png': {
          const el = (document.querySelector('[data-testid="resume-preview"]') || previewRef.current) as HTMLElement | null;
          if (!el) throw new Error('Preview not ready');
          await exportPng(el, targetFilename.replace(/\.png$/, ''));
          break;
        }
        case 'latex': {
          const res = await exportLatex(content, metadata, title);
          previewUrl = res.url;
          break;
        }
      }

      toast.success(`Saved ${targetFilename}`, {
        description: 'Downloaded to your device. Check your Downloads or Save dialog.',
        action: previewUrl
          ? {
              label: 'Open File',
              onClick: () => window.open(previewUrl!, '_blank'),
            }
          : undefined,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('toasts.failed')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1.5">
          <div className="flex items-center justify-between font-mono">
            <span className="text-muted-foreground font-sans font-medium">Save As:</span>
            <span className="font-semibold text-primary">{currentFilename}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Prompts your system Save As dialog to choose a folder, or saves directly to your Downloads folder.
          </p>
        </div>

        <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
          <div className="space-y-2">
            {FORMATS.map((f) => {
              const Icon = f.icon;
              const active = format === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`w-full flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 mt-0.5 shrink-0 ${
                      active ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">
                      {t(`${f.id}.label`)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t(`${f.id}.description`)}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t('cancel')}
          </Button>
          <Button onClick={handleExport} disabled={busy}>
            {busy ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {busy ? t('exporting') : t('export')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
