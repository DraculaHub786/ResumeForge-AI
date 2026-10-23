/**
 * Builder page — the live resume editor.
 *
 * Layout: sticky header + two-column body (editor sidebar | live preview).
 * All editing state lives in Zustand; changes are debounced and synced to the
 * server with a PATCH.
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  FileDown,
  Layout,
  Palette,
  Loader2,
  PanelLeftClose,
  PanelRightClose,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@resume-builder/ui';
import { getResume, updateResume } from '@/lib/api';
import type { ResumeDraft } from '@resume-builder/types';
import { useSession } from '@/hooks/use-session';
import { useResumeStore } from '@/stores/resumeStore';
import { toast } from 'sonner';
import { EditorSidebar } from '@/components/builder/editor-sidebar';
import { PreviewPanel } from '@/components/preview/preview-panel';
import { TemplateGallery } from '@/components/templates/template-gallery';
import { ExportModal } from '@/components/export/export-modal';
import { ThemeEditor } from '@/components/builder/theme-editor';
import { UserMenu } from '@/components/user-menu';
import { LocaleSwitcher } from '@/components/locale-switcher';

export default function BuilderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const { isLoading: sessionLoading, isAuthenticated } = useSession();
  const t = useTranslations('builder');
  const tCommon = useTranslations('common');

  const {
    draft,
    template,
    theme,
    isSaving,
    setResume,
    updateDraft,
    setTemplate,
    setTheme,
    setSaving,
  } = useResumeStore();

  const [exportOpen, setExportOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  const { data: loadedResume, isLoading, error } = useQuery({
    queryKey: ['resume', params.id],
    queryFn: () => getResume(params.id),
    // Every resume belongs to a user, so there is nothing to load until the
    // session resolves — otherwise a signed-out visitor sees a misleading
    // "not found" error instead of a sign-in prompt.
    enabled: !!params.id && isAuthenticated,
    retry: false,
  });

  // --- Autosave: debounce PATCH on every draft change ---
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  const persist = useCallback(
    async (payload: Partial<ResumeDraft>) => {
      setSaving(true);
      try {
        await updateResume(params.id, payload);
        setSaving(false);
      } catch {
        setSaving(false);
        toast.error(t('autosaveFailed'));
      }
    },
    [params.id, setSaving, t]
  );

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!draft.content) return;

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      persist({
        title: draft.title,
        metadata: draft.metadata,
        content: draft.content,
        // The slug is server-owned: it is de-duplicated per user on write, so
        // echoing the client's copy back would fight the server's version.
      });
    }, 1200);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [draft.content, draft.metadata, draft.title, persist]);

  useEffect(() => {
    if (loadedResume) setResume(loadedResume);
  }, [loadedResume, setResume]);

  // Signed-out visitors are sent to the sign-in page; the session check runs
  // first so an expired cookie never looks like a missing resume.
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.replace(`/auth/login?next=${encodeURIComponent(`/builder/${params.id}`)}`);
    }
  }, [sessionLoading, isAuthenticated, router, params.id]);

  if (sessionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">{t('signInRequired')}</h2>
          <p className="text-muted-foreground mb-4">
            {t('signInToOpen')}
          </p>
          <Button onClick={() => router.push('/auth/login')}>
            {tCommon('signIn')}
          </Button>
        </div>
      </div>
    );
  }

  if (error || !loadedResume) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">{t('resumeNotFound')}</h2>
          <p className="text-muted-foreground mb-4">
            {t('resumeNotFoundDescription')}
          </p>
          <Button onClick={() => router.push('/dashboard')}>{t('goToDashboard')}</Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* ---------- Header ---------- */}
      <header className="border-b bg-card sticky top-0 z-20">
        <div className="px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('backToDashboard')}
              onClick={() => router.push('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <Input
                value={draft.title ?? ''}
                onChange={(e) => updateDraft({ title: e.target.value })}
                className="h-7 border-0 bg-transparent px-0 font-bold text-sm focus-visible:ring-0 min-w-[140px] max-w-[260px]"
                aria-label={t('resumeTitle')}
              />
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" /> {t('saving')}
                  </>
                ) : (
                  t('allChangesSaved')
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LocaleSwitcher className="hidden sm:flex" />
            <UserMenu />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelOpen((v) => !v)}
              title={t('togglePreview')}
            >
              {rightPanelOpen ? (
                <PanelRightClose className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
              <FileDown className="h-4 w-4 mr-1" />
              {t('export')}
            </Button>
          </div>
        </div>
      </header>

      {/* ---------- Body ---------- */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 max-w-[1600px] w-full mx-auto">
        {/* Editor column */}
        <div className="space-y-4 min-w-0">
          <Tabs defaultValue="content">
            <TabsList>
              <TabsTrigger value="content">{t('tabContent')}</TabsTrigger>
              <TabsTrigger value="templates">
                <Layout className="h-3.5 w-3.5 mr-1" />
                {t('tabTemplates')}
              </TabsTrigger>
              <TabsTrigger value="design">
                <Palette className="h-3.5 w-3.5 mr-1" />
                {t('tabDesign')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content">
              <EditorSidebar draft={draft} updateDraft={updateDraft} />
            </TabsContent>

            <TabsContent value="templates">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">{t('chooseTemplate')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <TemplateGallery
                    currentTemplate={template}
                    onSelect={(id) => {
                      setTemplate(id);
                      toast.success(t('templateApplied'));
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="design">
              <ThemeEditor theme={theme} setTheme={setTheme} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview column */}
        {rightPanelOpen && (
          <div className="min-w-0">
            <div ref={previewRef} className="origin-top-left">
              <PreviewPanel
                content={draft.content}
                theme={theme}
                template={template}
                pageMargin={draft.metadata?.pageMargin}
                pageSize={draft.metadata?.pageSize}
              />
            </div>
          </div>
        )}
      </div>

      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        content={draft.content}
        metadata={draft.metadata}
        title={draft.title ?? 'resume'}
        previewRef={previewRef}
      />
    </main>
  );
}
