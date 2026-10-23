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
  exportPdf,
  exportPdfCanvas,
  exportPng,
  exportDocx,
  exportLatex,
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

  const handleExport = async () => {
    setBusy(true);
    try {
      switch (format) {
        case 'pdf': {
          const el = previewRef.current as HTMLElement | null;
          if (!el) throw new Error('Preview not ready');
          try {
            await exportPdf(el, title, metadata);
          } catch {
            await exportPdfCanvas(el, title, metadata);
          }
          toast.success(t('toasts.pdf'));
          break;
        }
        case 'docx':
          await exportDocx(content, metadata, title);
          toast.success(t('toasts.docx'));
          break;
        case 'png':
          if (!previewRef.current) throw new Error('Preview not ready');
          await exportPng(previewRef.current, title);
          toast.success(t('toasts.png'));
          break;
        case 'latex':
          exportLatex(content, metadata, title);
          toast.success(t('toasts.latex'));
          break;
      }
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
