/**
 * Dashboard — lists the user's resumes and allows creating new ones.
 */

'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Trash2, Edit3, FileDown } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
} from '@resume-builder/ui';
import { listResumes, createResume, deleteResume } from '@/lib/api';
import { createEmptyResume } from '@resume-builder/types';
import type { ResumeType } from '@resume-builder/types';
import { UserMenu } from '@/components/user-menu';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { ThemeToggle } from '@/components/theme-toggle';
import { useSession } from '@/hooks/use-session';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { isLoading: sessionLoading, isAuthenticated } = useSession();

  const { data: resumes, isLoading, error } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => listResumes(),
    placeholderData: { items: [], total: 0, page: 1, limit: 20 },
    enabled: isAuthenticated,
  });

  // Resumes are account-scoped, so send visitors to sign in first.
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [sessionLoading, isAuthenticated, router]);

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createResume>[0]) => createResume(data),
    onSuccess: (resume: ResumeType) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success(t('createSuccess'));
      router.push(`/builder/${resume.id}`);
    },
    onError: () => {
      toast.error(t('createError'));
    },
  });

  const handleNewResume = () => {
    const empty = createEmptyResume('New Resume');
    createMutation.mutate({ title: empty.title, metadata: empty.metadata, content: empty.content });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">{t('loading')}</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">{t('errorTitle')}</h1>
          <p className="text-destructive mb-4">{t('errorDescription')}</p>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['resumes'] })}>
            {tCommon('retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Top dashboard header bar */}
      <div className="border-b border-border/40 bg-card/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <a href="/" className="group flex items-center gap-2 text-base font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-xs shadow-sm group-hover:scale-105 transition-transform">
              R
            </span>
            <span>
              Resume<span className="text-orange-500">Forge</span>
            </span>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[9px] font-semibold text-orange-400">
              Dashboard
            </span>
          </a>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LocaleSwitcher />
            <UserMenu />
            <Button
              onClick={handleNewResume}
              disabled={createMutation.isPending}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {t('newResume')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{t('title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
        </div>

        {!resumes || resumes.items.length === 0 ? (
          <Card className="border-dashed border-border/80 bg-card/40 py-16 text-center rounded-2xl">
            <CardContent className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
                <FileText className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl font-bold mt-2">{t('emptyTitle')}</CardTitle>
              <CardDescription className="max-w-sm">{t('emptyDescription')}</CardDescription>
              <Button
                className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                onClick={handleNewResume}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('emptyCta')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {resumes.items.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} queryClient={queryClient} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ResumeCard({
  resume,
  queryClient,
}: {
  resume: ResumeType;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const t = useTranslations('dashboard');
  return (
    <Card className="group relative rounded-2xl border border-border/80 bg-card/90 transition-all duration-200 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-bold tracking-tight line-clamp-1">{resume.title}</CardTitle>
          {resume.metadata?.template && (
            <Badge variant="secondary" className="border-border text-[10px] font-mono shrink-0">
              {resume.metadata.template}
            </Badge>
          )}
        </div>
        <CardDescription className="text-xs">
          {t('updated')} {new Date(resume.updatedAt).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2 pt-0">
        <Button size="sm" variant="outline" className="flex-1 hover:border-orange-500/30" asChild>
          <a href={`/builder/${resume.id}`}>
            <Edit3 className="h-3.5 w-3.5 mr-1 text-orange-400" />
            {t('edit')}
          </a>
        </Button>
        <Button size="sm" variant="outline" className="flex-1 hover:border-orange-500/30">
          <FileDown className="h-3.5 w-3.5 mr-1" />
          {t('export')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label={t('deleteAria', { title: resume.title })}
          className="hover:text-destructive hover:bg-destructive/10"
          onClick={async () => {
            await deleteResume(resume.id);
            queryClient.invalidateQueries({ queryKey: ['resumes'] });
            toast.success(t('deleteSuccess'));
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
