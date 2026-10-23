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
    <main className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <UserMenu />
            <Button onClick={handleNewResume} disabled={createMutation.isPending}>
              <Plus className="h-4 w-4 mr-2" />
              {t('newResume')}
            </Button>
          </div>
        </div>

        {!resumes || resumes.items.length === 0 ? (
          <Card className="border-dashed py-12">
            <CardContent className="flex flex-col items-center gap-3">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <CardTitle>{t('emptyTitle')}</CardTitle>
              <CardDescription>{t('emptyDescription')}</CardDescription>
              <Button className="mt-2" onClick={handleNewResume}>
                <Plus className="h-4 w-4 mr-2" />
                {t('emptyCta')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-base">{resume.title}</CardTitle>
        <CardDescription>
          {t('updated')} {new Date(resume.updatedAt).toLocaleDateString()}
          {resume.metadata?.template && (
            <Badge variant="secondary" className="ml-2">
              {resume.metadata.template}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2 pt-0">
        <Button size="sm" variant="outline" className="flex-1" asChild>
          <a href={`/builder/${resume.id}`}>
            <Edit3 className="h-4 w-4 mr-1" />
            {t('edit')}
          </a>
        </Button>
        <Button size="sm" variant="outline" className="flex-1">
          <FileDown className="h-4 w-4 mr-1" />
          {t('export')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-label={t('deleteAria', { title: resume.title })}
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
