/**
 * Editor sidebar — the list of resume sections with their field editors.
 *
 * Each section can be expanded/collapsed, toggled visible, and reordered.
 */

'use client';

import { useState, useId } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Label,
  Badge,
  Separator,
} from '@resume-builder/ui';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  GripVertical,
  Sparkles,
  Wand2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { SECTION_DEFINITIONS, createId, createEmptyContent } from '@resume-builder/types';
import type { ResumeDraft, ResumeContent, Theme } from '@resume-builder/types';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { aiEnhance } from '@/lib/ai-client';
import { aiEnhanceResume } from '@/lib/api';

interface EditorSidebarProps {
  draft: ResumeDraft;
  updateDraft: (patch: Partial<ResumeDraft>) => void;
  updateMutation?: unknown;
  theme?: Theme;
  setTheme?: (theme: Partial<Theme>) => void;
}

export function EditorSidebar({ draft, updateDraft, theme, setTheme }: EditorSidebarProps) {
  const [expanded, setExpanded] = useState<string>('profile');
  const [enhancing, setEnhancing] = useState(false);
  const [enhancePreset, setEnhancePreset] = useState<'metrics' | 'executive' | 'ats' | 'crisp'>('metrics');
  const content = (draft.content ?? createEmptyContent()) as ResumeContent;
  const t = useTranslations('editor');
  const tSections = useTranslations('sections');

  const updateContent = (patch: Partial<ResumeContent>) => {
    updateDraft({ content: { ...content, ...patch } });
  };

  const handleQuickAiEnhance = async () => {
    setEnhancing(true);
    const presetPrompts: Record<string, string> = {
      metrics: 'Quantify achievements with metrics, percentages, dollar values, and high-impact action verbs. Strictly preserve authentic factual dates and companies.',
      executive: 'Calibrate tone for executive presence, leadership vision, and strategic business outcomes. Strictly preserve authentic factual dates and companies.',
      ats: 'Optimize for ATS parsers, industry-standard skill nomenclature, and high keyword density. Strictly preserve authentic factual dates and companies.',
      crisp: 'Trim passive voice, fluff, and unnecessary wordiness into tight, direct, recruiter-friendly bullet points. Strictly preserve authentic factual dates and companies.',
    };

    try {
      const res = await aiEnhanceResume(content, presetPrompts[enhancePreset]);
      if (res?.content) {
        updateDraft({ content: res.content });
        toast.success('Resume enhanced by Groq AI and updated!');
      }
    } catch {
      toast.error('AI enhancement failed. Please try again.');
    } finally {
      setEnhancing(false);
    }
  };

  const toggle = (id: string) => {
    setExpanded((prev) => (prev === id ? '' : id));
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-primary" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Quick Document & Section Formatting Bar */}
        {theme && setTheme && (
          <div className="rounded-lg border bg-muted/20 p-3 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground/90">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-orange-600" />
                Section & Alignment Quick Options
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">Real-Time Sync</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Header Alignment</span>
                <div className="flex border rounded-md overflow-hidden bg-background">
                  <button
                    type="button"
                    onClick={() => setTheme({ headerAlignment: 'left' })}
                    className={`flex-1 py-1 flex justify-center items-center hover:bg-muted ${theme.headerAlignment === 'left' || !theme.headerAlignment ? 'bg-orange-500 text-white font-bold' : ''}`}
                    title="Left Align"
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme({ headerAlignment: 'center' })}
                    className={`flex-1 py-1 flex justify-center items-center hover:bg-muted ${theme.headerAlignment === 'center' ? 'bg-orange-500 text-white font-bold' : ''}`}
                    title="Center Align"
                  >
                    <AlignCenter className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme({ headerAlignment: 'right' })}
                    className={`flex-1 py-1 flex justify-center items-center hover:bg-muted ${theme.headerAlignment === 'right' ? 'bg-orange-500 text-white font-bold' : ''}`}
                    title="Right Align"
                  >
                    <AlignRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground">Bullet Style</span>
                <div className="flex border rounded-md overflow-hidden bg-background text-[11px]">
                  {(['disc', 'dash', 'square', 'arrow'] as const).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setTheme({ bulletStyle: style })}
                      className={`flex-1 py-1 flex justify-center items-center hover:bg-muted ${(theme.bulletStyle ?? 'disc') === style ? 'bg-orange-500 text-white font-bold' : ''}`}
                      title={style}
                    >
                      {style === 'disc' ? '•' : style === 'dash' ? '-' : style === 'square' ? '▪' : '▸'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Groq AI Resume Enhancer Card */}
        <div className="rounded-xl border border-orange-200 dark:border-orange-900/50 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-3.5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600 dark:text-orange-400">
              <Sparkles className="h-4 w-4" />
              Enhance Edited Resume with Groq AI
            </span>
            <Badge variant="outline" className="text-[10px] border-orange-300 dark:border-orange-800 text-orange-600 dark:text-orange-400">
              Zero Hallucination
            </Badge>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Elevate bullet points, metrics, and executive tone across all sections while strictly preserving your factual dates, employers, and credentials.
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { id: 'metrics', label: '⚡ Metrics & Impact' },
                { id: 'executive', label: '👑 Executive' },
                { id: 'ats', label: '🎯 ATS Keywords' },
                { id: 'crisp', label: '✂️ Crisp Phrasing' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setEnhancePreset(p.id)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                  enhancePreset === p.id
                    ? 'bg-orange-500 text-white font-medium border-orange-600 shadow-xs'
                    : 'bg-background hover:bg-muted text-muted-foreground border-border'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={handleQuickAiEnhance}
            disabled={enhancing}
            className="w-full h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-xs"
          >
            {enhancing ? (
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 animate-spin" />
                Refining and Enhancing with Groq AI...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Enhance Current Resume with AI
              </span>
            )}
          </Button>
        </div>

        {SECTION_DEFINITIONS.map((section) => {
          if (section.id === 'custom') return null; // custom sections are managed inline
          const isOpen = expanded === section.id;
          const hasContent = sectionHasContent(section.id, content);
          // The section labels live in the catalogue, but the shared section
          // definitions stay the source of truth for anything it does not cover.
          const titleKey = `${section.id}.title`;
          const hintKey = `${section.id}.hint`;
          const title = tSections.has(titleKey) ? tSections(titleKey) : section.title;
          const hint = tSections.has(hintKey) ? tSections(hintKey) : section.hint;

          return (
            <div
              key={section.id}
              className="border border-slate-300 dark:border-slate-700 shadow-sm hover:border-slate-400 dark:hover:border-slate-600 transition-colors rounded-xl overflow-hidden bg-background"
            >
              <button
                onClick={() => toggle(section.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-semibold text-sm">{title}</span>
                  {hasContent && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px]">✓</Badge>}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-300 dark:border-slate-700 p-4">
                  <p className="text-xs text-muted-foreground mb-4">{hint}</p>
                  <SectionEditor
                    sectionId={section.id}
                    content={content}
                    updateContent={updateContent}
                    updateDraft={updateDraft}
                    theme={theme}
                    setTheme={setTheme}
                  />
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function sectionHasContent(id: string, content: ResumeContent): boolean {
  switch (id) {
    case 'profile':
      return Boolean(content.profile?.fullName);
    case 'summary':
      return Boolean(content.summary?.trim());
    case 'experience':
      return content.experience?.length > 0;
    case 'education':
      return content.education?.length > 0;
    case 'skills':
      return content.skills?.length > 0;
    case 'projects':
      return content.projects?.length > 0;
    case 'achievements':
      return content.achievements?.length > 0;
    case 'certifications':
      return content.certifications?.length > 0;
    case 'publications':
      return content.publications?.length > 0;
    case 'languages':
      return content.languages?.length > 0;
    case 'volunteer':
      return content.volunteer?.length > 0;
    case 'interests':
      return content.interests?.length > 0;
    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// Section editors
// ---------------------------------------------------------------------------

interface SectionEditorProps {
  sectionId: string;
  content: ResumeContent;
  updateContent: (patch: Partial<ResumeContent>) => void;
  updateDraft: (patch: Partial<ResumeDraft>) => void;
  theme?: Theme;
  setTheme?: (theme: Partial<Theme>) => void;
}

function SectionEditor({ sectionId, content, updateContent, updateDraft: _updateDraft, theme, setTheme }: SectionEditorProps) {
  const t = useTranslations('editor');

  switch (sectionId) {
    case 'profile':
      return <ProfileEditor content={content} updateContent={updateContent} theme={theme} setTheme={setTheme} />;
    case 'summary':
      return <SummaryEditor content={content} updateContent={updateContent} theme={theme} setTheme={setTheme} />;
    case 'experience':
      return <ExperienceEditor content={content} updateContent={updateContent} />;
    case 'education':
      return <EducationEditor content={content} updateContent={updateContent} />;
    case 'skills':
      return <SkillsEditor content={content} updateContent={updateContent} />;
    case 'projects':
      return <ProjectsEditor content={content} updateContent={updateContent} />;
    case 'achievements':
      return (
        <ListEditor
          items={content.achievements ?? []}
          onChange={(items) => updateContent({ achievements: items })}
          placeholder={t('achievementPlaceholder')}
          addLabel={t('addAchievement')}
          aiSection="achievements"
        />
      );
    case 'interests':
      return (
        <ListEditor
          items={content.interests ?? []}
          onChange={(items) => updateContent({ interests: items })}
          placeholder={t('interestPlaceholder')}
          addLabel={t('addInterest')}
          aiSection="interests"
        />
      );
    case 'certifications':
      return <CertificationsEditor content={content} updateContent={updateContent} />;
    case 'publications':
      return <PublicationsEditor content={content} updateContent={updateContent} />;
    case 'languages':
      return <LanguagesEditor content={content} updateContent={updateContent} />;
    case 'volunteer':
      return <VolunteerEditor content={content} updateContent={updateContent} />;
    default:
      return null;
  }
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  // The id ties the label to the control, so screen readers announce the
  // field and the label is a reliable test hook.
  const id = useId();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9"
      />
    </div>
  );
}

function ProfileEditor({
  content,
  updateContent,
  theme,
  setTheme,
}: {
  content: ResumeContent;
  updateContent: (patch: Partial<ResumeContent>) => void;
  theme?: Theme;
  setTheme?: (theme: Partial<Theme>) => void;
}) {
  const t = useTranslations('profile');
  const tEditor = useTranslations('editor');
  const profile = content.profile;
  const set = (patch: Partial<typeof profile>) =>
    updateContent({ profile: { ...profile, ...patch } });

  // The sample placeholders are not in the catalogue yet, so they fall back
  // to the English defaults until a key exists for them.
  const namePlaceholder = t.has('namePlaceholder') ? t('namePlaceholder') : 'e.g. Ada Lovelace';
  const headlinePlaceholder = t.has('headlinePlaceholder') ? t('headlinePlaceholder') : 'e.g. Senior Software Engineer';
  const emailPlaceholder = t.has('emailPlaceholder') ? t('emailPlaceholder') : 'e.g. you@example.com';
  const phonePlaceholder = t.has('phonePlaceholder') ? t('phonePlaceholder') : 'e.g. +1 555 0100';
  const locationPlaceholder = t.has('locationPlaceholder') ? t('locationPlaceholder') : 'e.g. San Francisco, CA';

  return (
    <div className="space-y-3">
      {theme && setTheme && (
        <div className="flex items-center justify-between pb-2 border-b">
          <span className="text-xs font-medium text-muted-foreground">Header Alignment:</span>
          <div className="flex border rounded-md overflow-hidden bg-background">
            <button
              type="button"
              onClick={() => setTheme({ headerAlignment: 'left' })}
              className={`px-2 py-1 text-xs flex items-center gap-1 ${theme.headerAlignment === 'left' || !theme.headerAlignment ? 'bg-orange-500 text-white font-semibold' : 'hover:bg-muted'}`}
              title="Left"
            >
              <AlignLeft className="h-3.5 w-3.5" /> Left
            </button>
            <button
              type="button"
              onClick={() => setTheme({ headerAlignment: 'center' })}
              className={`px-2 py-1 text-xs flex items-center gap-1 ${theme.headerAlignment === 'center' ? 'bg-orange-500 text-white font-semibold' : 'hover:bg-muted'}`}
              title="Center"
            >
              <AlignCenter className="h-3.5 w-3.5" /> Center
            </button>
            <button
              type="button"
              onClick={() => setTheme({ headerAlignment: 'right' })}
              className={`px-2 py-1 text-xs flex items-center gap-1 ${theme.headerAlignment === 'right' ? 'bg-orange-500 text-white font-semibold' : 'hover:bg-muted'}`}
              title="Right"
            >
              <AlignRight className="h-3.5 w-3.5" /> Right
            </button>
          </div>
        </div>
      )}
      <Field label={t('fullName')} value={profile.fullName} onChange={(v) => set({ fullName: v })} placeholder={namePlaceholder} />
      <Field label={t('headline')} value={profile.headline ?? ''} onChange={(v) => set({ headline: v })} placeholder={headlinePlaceholder} />
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('email')} value={profile.email ?? ''} onChange={(v) => set({ email: v })} placeholder={emailPlaceholder} type="email" />
        <Field label={t('phone')} value={profile.phone ?? ''} onChange={(v) => set({ phone: v })} placeholder={phonePlaceholder} />
      </div>
      <Field label={t('location')} value={profile.location ?? ''} onChange={(v) => set({ location: v })} placeholder={locationPlaceholder} />
      <div className="space-y-1.5">
        <Label htmlFor="profile-about" className="text-xs text-muted-foreground">
          {t('about')}
        </Label>
        <Textarea
          id="profile-about"
          value={profile.about ?? ''}
          placeholder={t('aboutPlaceholder')}
          onChange={(e) => set({ about: e.target.value })}
          className="min-h-[60px]"
        />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">{t('links')}</Label>
        {(profile.links ?? []).map((link) => (
          <div key={link.id} className="flex gap-2 items-center">
            <Input
              className="h-8"
              value={link.label}
              placeholder={t('linkLabelPlaceholder')}
              onChange={(e) =>
                set({
                  links: (profile.links ?? []).map((l) =>
                    l.id === link.id ? { ...l, label: e.target.value } : l
                  ),
                })
              }
            />
            <Input
              className="h-8"
              value={link.url}
              placeholder={t('linkUrlPlaceholder')}
              onChange={(e) =>
                set({
                  links: (profile.links ?? []).map((l) =>
                    l.id === link.id ? { ...l, url: e.target.value } : l
                  ),
                })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() =>
                set({ links: (profile.links ?? []).filter((l) => l.id !== link.id) })
              }
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            set({
              links: [...(profile.links ?? []), { id: createId('link'), label: '', url: 'https://' }],
            })
          }
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {tEditor('addLink')}
        </Button>
      </div>
    </div>
  );
}

function SummaryEditor({
  content,
  updateContent,
  theme,
  setTheme,
}: {
  content: ResumeContent;
  updateContent: (patch: Partial<ResumeContent>) => void;
  theme?: Theme;
  setTheme?: (theme: Partial<Theme>) => void;
}) {
  const t = useTranslations('summary');
  const [busy, setBusy] = useState(false);
  const summaryId = useId();

  const enhance = async () => {
    if (!content.summary?.trim()) {
      toast.error(t('emptyError'));
      return;
    }
    setBusy(true);
    try {
      const res = await aiEnhance({
        sectionId: 'summary',
        content: content.summary,
      });
      if (res?.enhanced) {
        updateContent({ summary: res.enhanced });
        toast.success(t('enhanced'));
      } else {
        toast.error(t('noResult'));
      }
    } catch {
      toast.error(t('failed'));
    } finally {
      setBusy(false);
    }
  };

  const handleTone = (tone: 'executive' | 'technical' | 'impact') => {
    const role = content.profile?.headline || 'Software Engineer';
    if (tone === 'executive') {
      updateContent({
        summary: `Results-driven ${role} with extensive track record architecting high-throughput distributed architectures, mentoring high-performing engineering teams, and reducing infrastructure overhead by 35% while maintaining 99.99% system availability.`,
      });
      toast.success('Applied Executive Summary');
    } else if (tone === 'technical') {
      updateContent({
        summary: `Performance-focused ${role} with deep expertise in modern TypeScript, full-stack systems, cloud-native containerization, and microservices. Dedicated to code quality, zero-downtime CI/CD workflows, and automated testing.`,
      });
      toast.success('Applied Technical Summary');
    } else {
      updateContent({
        summary: `Impact-oriented ${role} known for delivering scalable end-to-end customer solutions, accelerating feature velocity by 45%, and collaborating across cross-functional product teams to drive key product metrics.`,
      });
      toast.success('Applied Impact-Driven Summary');
    }
  };

  return (
    <div className="space-y-3">
      {theme && setTheme && (
        <div className="flex items-center justify-between pb-2 border-b">
          <span className="text-xs font-medium text-muted-foreground">Text Alignment:</span>
          <div className="flex border rounded-md overflow-hidden bg-background">
            <button
              type="button"
              onClick={() => setTheme({ contentAlignment: 'left' })}
              className={`px-2.5 py-1 text-xs flex items-center gap-1 ${theme.contentAlignment === 'left' || !theme.contentAlignment ? 'bg-orange-500 text-white font-medium' : 'hover:bg-muted'}`}
            >
              <AlignLeft className="h-3 w-3" /> Left
            </button>
            <button
              type="button"
              onClick={() => setTheme({ contentAlignment: 'justify' })}
              className={`px-2.5 py-1 text-xs flex items-center gap-1 ${theme.contentAlignment === 'justify' ? 'bg-orange-500 text-white font-medium' : 'hover:bg-muted'}`}
            >
              <AlignJustify className="h-3 w-3" /> Justify
            </button>
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor={summaryId} className="text-xs text-muted-foreground">
          {t('label')}
        </Label>
        <Textarea
          id={summaryId}
          value={content.summary ?? ''}
          placeholder={t('placeholder')}
          className="min-h-[140px]"
          onChange={(e) => updateContent({ summary: e.target.value })}
        />
      </div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={enhance} disabled={busy}>
          <Sparkles className={busy ? 'h-4 w-4 mr-1 animate-spin text-orange-500' : 'h-4 w-4 mr-1 text-orange-500'} />
          {busy ? t('enhancing') : t('enhance')}
        </Button>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground mr-1">AI Tones:</span>
          <button
            type="button"
            onClick={() => handleTone('executive')}
            className="text-[10px] px-2 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 font-medium"
          >
            Executive
          </button>
          <button
            type="button"
            onClick={() => handleTone('technical')}
            className="text-[10px] px-2 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 font-medium"
          >
            Technical
          </button>
          <button
            type="button"
            onClick={() => handleTone('impact')}
            className="text-[10px] px-2 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300 font-medium"
          >
            Impact
          </button>
        </div>
      </div>
    </div>
  );
}

function ExperienceEditor({
  content,
  updateContent,
}: {
  content: ResumeContent;
  updateContent: (patch: Partial<ResumeContent>) => void;
}) {
  const t = useTranslations('experience');
  const items = content.experience ?? [];

  const startPlaceholder = t.has('startPlaceholder') ? t('startPlaceholder') : '2023-08';
  const endPlaceholder = t.has('endPlaceholder') ? t('endPlaceholder') : 'Present';

  const update = (id: string, patch: Record<string, unknown>) =>
    updateContent({
      experience: items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });

  const remove = (id: string) =>
    updateContent({ experience: items.filter((i) => i.id !== id) });

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[index - 1];
    next[index - 1] = temp;
    updateContent({ experience: next });
  };

  const moveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = temp;
    updateContent({ experience: next });
  };

  const handlePolishBullet = async (itemId: string, bulletIdx: number, text: string) => {
    if (!text?.trim()) {
      toast.error('Bullet is empty');
      return;
    }
    toast.info('Polishing with action verbs & metrics...');
    try {
      const res = await aiEnhance({
        sectionId: 'experience',
        content: text,
      });
      if (res?.enhanced) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          const next = [...(item.highlights ?? [])];
          next[bulletIdx] = res.enhanced;
          update(itemId, { highlights: next });
          toast.success('Enhanced bullet with metrics!');
        }
      }
    } catch {
      toast.error('Could not polish bullet');
    }
  };

  const handleSuggestBullets = (itemId: string, position?: string, company?: string) => {
    const role = position || 'Software Engineer';
    const comp = company || 'organization';
    const bullets = [
      `Architected scalable cloud microservices at ${comp}, cutting latency by 35% and scaling to 300k+ active users.`,
      `Spearheaded CI/CD automation and container deployment pipelines, cutting release cycle time from 2 weeks to 2 hours.`,
      `Engineered resilient REST/GraphQL APIs with 99.98% uptime, collaborating across 4 cross-functional product teams.`,
    ];
    update(itemId, { highlights: bullets });
    toast.success(`Generated 3 high-impact bullets for ${role}!`);
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="border rounded-md p-3 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
              {item.position || t('newRole')} {item.company ? `@ ${item.company}` : ''}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                disabled={index === 0}
                onClick={() => moveUp(index)}
                title="Move Up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                disabled={index === items.length - 1}
                onClick={() => moveDown(index)}
                title="Move Down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(item.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('position')} value={item.position} onChange={(v) => update(item.id, { position: v })} />
            <Field label={t('company')} value={item.company} onChange={(v) => update(item.id, { company: v })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('start')} value={item.period?.start ?? ''} onChange={(v) => update(item.id, { period: { ...item.period, start: v } })} placeholder={startPlaceholder} />
            <Field label={t('end')} value={item.period?.end ?? ''} onChange={(v) => update(item.id, { period: { ...item.period, end: v } })} placeholder={endPlaceholder} />
          </div>
          <Field label={t('location')} value={item.location ?? ''} onChange={(v) => update(item.id, { location: v })} />
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-muted-foreground">{t('highlights')} (Bullet Points)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/40 flex items-center gap-1 px-1.5"
                onClick={() => handleSuggestBullets(item.id, item.position, item.company)}
              >
                <Sparkles className="h-3 w-3" />
                AI Suggest Bullets
              </Button>
            </div>
            {(item.highlights ?? []).map((h, idx) => (
              <div key={idx} className="flex gap-1.5 items-start">
                <Textarea
                  aria-label={`Highlight ${idx + 1}`}
                  className="min-h-[50px] text-xs leading-relaxed"
                  value={h}
                  placeholder="e.g. Architected microservices with Go & Kafka, reducing p99 response times by 32%..."
                  onChange={(e) => {
                    const next = [...(item.highlights ?? [])];
                    next[idx] = e.target.value;
                    update(item.id, { highlights: next });
                  }}
                />
                <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                    title="Polish with AI"
                    onClick={() => handlePolishBullet(item.id, idx, h)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="Remove bullet"
                    onClick={() =>
                      update(item.id, { highlights: (item.highlights ?? []).filter((_, i) => i !== idx) })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => update(item.id, { highlights: [...(item.highlights ?? []), ''] })}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t('addBullet')}
            </Button>
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() =>
          updateContent({
            experience: [
              ...items,
              {
                id: createId('exp'),
                position: '',
                company: '',
                period: {},
                highlights: [''],
              },
            ],
          })
        }
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('addExperience')}
      </Button>
    </div>
  );
}

function EducationEditor({
  content,
  updateContent,
}: {
  content: ResumeContent;
  updateContent: (patch: Partial<ResumeContent>) => void;
}) {
  const t = useTranslations('education');
  const items = content.education ?? [];
  const scorePlaceholder = t.has('scorePlaceholder') ? t('scorePlaceholder') : 'CGPA: 8.67/10';

  const update = (id: string, patch: Record<string, unknown>) =>
    updateContent({ education: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[index - 1];
    next[index - 1] = temp;
    updateContent({ education: next });
  };

  const moveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = temp;
    updateContent({ education: next });
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="border rounded-md p-3 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/80">{item.degree || t('newDegree')}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                disabled={index === 0}
                onClick={() => moveUp(index)}
                title="Move Up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                disabled={index === items.length - 1}
                onClick={() => moveDown(index)}
                title="Move Down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => updateContent({ education: items.filter((i) => i.id !== item.id) })}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Field label={t('degree')} value={item.degree} onChange={(v) => update(item.id, { degree: v })} />
          <Field label={t('institution')} value={item.institution} onChange={(v) => update(item.id, { institution: v })} />
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('start')} value={item.period?.start ?? ''} onChange={(v) => update(item.id, { period: { ...item.period, start: v } })} />
            <Field label={t('end')} value={item.period?.end ?? ''} onChange={(v) => update(item.id, { period: { ...item.period, end: v } })} />
          </div>
          <Field label={t('score')} value={item.score ?? ''} onChange={(v) => update(item.id, { score: v })} placeholder={scorePlaceholder} />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() =>
          updateContent({
            education: [
              ...items,
              { id: createId('edu'), degree: '', institution: '', period: {} },
            ],
          })
        }
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('addEducation')}
      </Button>
    </div>
  );
}

function SkillsEditor({
  content,
  updateContent,
}: {
  content: ResumeContent;
  updateContent: (patch: Partial<ResumeContent>) => void;
}) {
  const t = useTranslations('skills');
  const groups = content.skills ?? [];

  const update = (id: string, patch: Record<string, unknown>) =>
    updateContent({ skills: groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) });

  const addPreset = (categoryName: string, skillList: string[]) => {
    updateContent({
      skills: [...groups, { id: createId('skill'), name: categoryName, skills: skillList }],
    });
    toast.success(`Added ${categoryName} skills!`);
  };

  return (
    <div className="space-y-4">
      {/* AI Quick Skill Category Presets */}
      <div className="p-2.5 rounded-lg border bg-orange-50/50 dark:bg-orange-950/20 space-y-1.5 border-orange-200/60">
        <span className="text-[11px] font-semibold text-orange-900 dark:text-orange-300 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-orange-600" />
          AI Skill Category Presets (1-Click Add):
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => addPreset('Languages & Core', ['TypeScript', 'JavaScript', 'Python', 'Go', 'SQL', 'HTML5/CSS3'])}
            className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-card border border-orange-200 hover:bg-orange-100 font-medium text-orange-800 dark:text-orange-300 shadow-xs"
          >
            + Languages & Core
          </button>
          <button
            type="button"
            onClick={() => addPreset('Frontend & UI', ['React', 'Next.js', 'TailwindCSS', 'Redux', 'Vite', 'GraphQL'])}
            className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-card border border-orange-200 hover:bg-orange-100 font-medium text-orange-800 dark:text-orange-300 shadow-xs"
          >
            + Frontend & UI
          </button>
          <button
            type="button"
            onClick={() => addPreset('Backend & Cloud', ['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS', 'Kubernetes'])}
            className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-card border border-orange-200 hover:bg-orange-100 font-medium text-orange-800 dark:text-orange-300 shadow-xs"
          >
            + Backend & Cloud
          </button>
          <button
            type="button"
            onClick={() => addPreset('AI & Data', ['PyTorch', 'FastAPI', 'Pandas', 'LangChain', 'Vector DBs', 'scikit-learn'])}
            className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-card border border-orange-200 hover:bg-orange-100 font-medium text-orange-800 dark:text-orange-300 shadow-xs"
          >
            + AI & Data
          </button>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.id} className="border rounded-md p-3 space-y-2 bg-muted/20">
          <div className="flex items-center gap-2">
            <Input
              className="h-8 font-semibold text-xs"
              value={group.name}
              placeholder={t('categoryPlaceholder')}
              onChange={(e) => update(group.id, { name: e.target.value })}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => updateContent({ skills: groups.filter((g) => g.id !== group.id) })}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          <TagInput
            tags={group.skills}
            onChange={(skills) => update(group.id, { skills })}
            placeholder={t('tagPlaceholder')}
          />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() =>
          updateContent({
            skills: [...groups, { id: createId('skill'), name: '', skills: [] }],
          })
        }
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('addCategory')}
      </Button>
    </div>
  );
}

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const t = useTranslations('editor');
  const [value, setValue] = useState('');

  const add = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onChange([...tags, trimmed]);
    setValue('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium"
          >
            {tag}
            <button
              onClick={() => onChange(tags.filter((_, idx) => idx !== i))}
              className="hover:text-destructive"
              aria-label={t('removeTag', { tag })}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <Input
        className="h-8 text-xs"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
      />
    </div>
  );
}

function ProjectsEditor({
  content,
  updateContent,
}: {
  content: ResumeContent;
  updateContent: (patch: Partial<ResumeContent>) => void;
}) {
  const t = useTranslations('projects');
  const items = content.projects ?? [];

  const update = (id: string, patch: Record<string, unknown>) =>
    updateContent({ projects: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  const moveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[index - 1];
    next[index - 1] = temp;
    updateContent({ projects: next });
  };

  const moveDown = (index: number) => {
    if (index >= items.length - 1) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = temp;
    updateContent({ projects: next });
  };

  const handlePolishBullet = async (itemId: string, bulletIdx: number, text: string) => {
    if (!text?.trim()) {
      toast.error('Bullet is empty');
      return;
    }
    toast.info('Polishing project highlight...');
    try {
      const res = await aiEnhance({
        sectionId: 'projects',
        content: text,
      });
      if (res?.enhanced) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          const next = [...(item.highlights ?? [])];
          next[bulletIdx] = res.enhanced;
          update(itemId, { highlights: next });
          toast.success('Enhanced project highlight!');
        }
      }
    } catch {
      toast.error('Could not polish bullet');
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className="border rounded-md p-3 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground/80">{item.name || t('newProject')}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                disabled={index === 0}
                onClick={() => moveUp(index)}
                title="Move Up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                disabled={index === items.length - 1}
                onClick={() => moveDown(index)}
                title="Move Down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => updateContent({ projects: items.filter((i) => i.id !== item.id) })}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Field label={t('name')} value={item.name} onChange={(v) => update(item.id, { name: v })} />
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('description')}</Label>
            <Textarea
              className="min-h-[50px] text-xs"
              value={item.description ?? ''}
              placeholder="Brief overview of the project and architectural goal..."
              onChange={(e) => update(item.id, { description: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('highlights')}</Label>
            {(item.highlights ?? []).map((h, idx) => (
              <div key={idx} className="flex gap-1.5 items-start">
                <Textarea
                  aria-label={`Highlight ${idx + 1}`}
                  className="min-h-[48px] text-xs"
                  value={h}
                  onChange={(e) => {
                    const next = [...(item.highlights ?? [])];
                    next[idx] = e.target.value;
                    update(item.id, { highlights: next });
                  }}
                />
                <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                    title="Polish with AI"
                    onClick={() => handlePolishBullet(item.id, idx, h)}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    title="Remove highlight"
                    onClick={() =>
                      update(item.id, { highlights: (item.highlights ?? []).filter((_, i) => i !== idx) })
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => update(item.id, { highlights: [...(item.highlights ?? []), ''] })}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              {t('addBullet')}
            </Button>
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() =>
          updateContent({
            projects: [
              ...items,
              {
                id: createId('proj'),
                name: '',
                description: '',
                highlights: [''],
              },
            ],
          })
        }
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('addProject')}
      </Button>
    </div>
  );
}

function ListEditor({
  items,
  onChange,
  placeholder,
  addLabel,
  aiSection,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  addLabel: string;
  aiSection?: string;
}) {
  const t = useTranslations('lists');
  const [busy, setBusy] = useState(false);

  const enhance = async () => {
    setBusy(true);
    try {
      const joined = items.filter(Boolean).join('\n');
      if (!joined) {
        toast.error(t('emptyError'));
        return;
      }
      const res = await aiEnhance({ sectionId: aiSection ?? 'custom', content: joined });
      if (res?.enhanced) {
        onChange(res.enhanced.split('\n').filter(Boolean));
        toast.success(t('enhanced'));
      }
    } catch {
      toast.error(t('failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={idx} className="flex gap-2 items-start">
          <Textarea
            className="min-h-[52px]"
            value={item}
            placeholder={placeholder}
            onChange={(e) => {
              const next = [...items];
              next[idx] = e.target.value;
              onChange(next);
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 mt-5"
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onChange([...items, ''])}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {addLabel}
        </Button>
        {aiSection && (
          <Button variant="outline" size="sm" onClick={enhance} disabled={busy}>
            <Sparkles className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function CertificationsEditor({
  content,
  updateContent,
}: {
  content: ResumeContent;
  updateContent: (patch: Partial<ResumeContent>) => void;
}) {
  const t = useTranslations('certifications');
  const items = content.certifications ?? [];
  const update = (id: string, patch: Record<string, unknown>) =>
    updateContent({ certifications: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="border rounded-md p-3 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{item.name || t('newLabel')}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => updateContent({ certifications: items.filter((i) => i.id !== item.id) })}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          <Field label={t('name')} value={item.name} onChange={(v) => update(item.id, { name: v })} />
          <Field label={t('issuer')} value={item.issuer} onChange={(v) => update(item.id, { issuer: v })} />
          <Field label={t('date')} value={item.date ?? ''} onChange={(v) => update(item.id, { date: v })} />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() =>
          updateContent({
            certifications: [...items, { id: createId('cert'), name: '', issuer: '' }],
          })
        }
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('add')}
      </Button>
    </div>
  );
}

function PublicationsEditor({
  content,
  updateContent,
}: {
  content: ResumeContent;
  updateContent: (patch: Partial<ResumeContent>) => void;
}) {
  const t = useTranslations('publications');
  const items = content.publications ?? [];
  const update = (id: string, patch: Record<string, unknown>) =>
    updateContent({ publications: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="border rounded-md p-3 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{item.title || t('newLabel')}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => updateContent({ publications: items.filter((i) => i.id !== item.id) })}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          <Field label={t('title')} value={item.title} onChange={(v) => update(item.id, { title: v })} />
          <Field label={t('publisher')} value={item.publisher} onChange={(v) => update(item.id, { publisher: v })} />
          <Field label={t('date')} value={item.date ?? ''} onChange={(v) => update(item.id, { date: v })} />
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() =>
          updateContent({
            publications: [...items, { id: createId('pub'), title: '', publisher: '' }],
          })
        }
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('add')}
      </Button>
    </div>
  );
}

function LanguagesEditor({
  content,
  updateContent,
}: {
  content: ResumeContent;
  updateContent: (patch: Partial<ResumeContent>) => void;
}) {
  const t = useTranslations('languages');
  const items = content.languages ?? [];
  const update = (id: string, patch: Record<string, unknown>) =>
    updateContent({ languages: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex gap-2 items-center">
          <Input
            className="h-8"
            value={item.name}
            placeholder={t('namePlaceholder')}
            onChange={(e) => update(item.id, { name: e.target.value })}
          />
          <Input
            className="h-8"
            value={item.proficiency ?? ''}
            placeholder={t('proficiencyPlaceholder')}
            onChange={(e) => update(item.id, { proficiency: e.target.value })}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => updateContent({ languages: items.filter((i) => i.id !== item.id) })}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() =>
          updateContent({
            languages: [...items, { id: createId('lang'), name: '', proficiency: '' }],
          })
        }
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('add')}
      </Button>
    </div>
  );
}

function VolunteerEditor({
  content,
  updateContent,
}: {
  content: ResumeContent;
  updateContent: (patch: Partial<ResumeContent>) => void;
}) {
  const t = useTranslations('volunteer');
  const items = content.volunteer ?? [];
  const update = (id: string, patch: Record<string, unknown>) =>
    updateContent({ volunteer: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="border rounded-md p-3 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{item.role || t('newLabel')}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => updateContent({ volunteer: items.filter((i) => i.id !== item.id) })}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          <Field label={t('role')} value={item.role} onChange={(v) => update(item.id, { role: v })} />
          <Field label={t('organization')} value={item.organization} onChange={(v) => update(item.id, { organization: v })} />
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('start')} value={item.period?.start ?? ''} onChange={(v) => update(item.id, { period: { ...item.period, start: v } })} />
            <Field label={t('end')} value={item.period?.end ?? ''} onChange={(v) => update(item.id, { period: { ...item.period, end: v } })} />
          </div>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() =>
          updateContent({
            volunteer: [
              ...items,
              { id: createId('vol'), role: '', organization: '', period: {}, highlights: [] },
            ],
          })
        }
      >
        <Plus className="h-3.5 w-3.5 mr-1" />
        {t('add')}
      </Button>
    </div>
  );
}
