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
} from 'lucide-react';
import { SECTION_DEFINITIONS, createId, createEmptyContent } from '@resume-builder/types';
import type { ResumeDraft, ResumeContent } from '@resume-builder/types';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { aiEnhance } from '@/lib/ai-client';

interface EditorSidebarProps {
  draft: ResumeDraft;
  updateDraft: (patch: Partial<ResumeDraft>) => void;
  updateMutation?: unknown;
}

export function EditorSidebar({ draft, updateDraft }: EditorSidebarProps) {
  const [expanded, setExpanded] = useState<string>('profile');
  const content = (draft.content ?? createEmptyContent()) as ResumeContent;
  const t = useTranslations('editor');
  const tSections = useTranslations('sections');

  const updateContent = (patch: Partial<ResumeContent>) => {
    updateDraft({ content: { ...content, ...patch } });
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
              className="border rounded-lg overflow-hidden bg-background"
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
                  <span className="font-medium text-sm">{title}</span>
                  {hasContent && <Badge variant="secondary">✓</Badge>}
                </div>
              </button>

              {isOpen && (
                <div className="border-t p-4">
                  <p className="text-xs text-muted-foreground mb-4">{hint}</p>
                  <SectionEditor
                    sectionId={section.id}
                    content={content}
                    updateContent={updateContent}
                    updateDraft={updateDraft}
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
}

function SectionEditor({ sectionId, content, updateContent }: SectionEditorProps) {
  const t = useTranslations('editor');

  switch (sectionId) {
    case 'profile':
      return <ProfileEditor content={content} updateContent={updateContent} />;
    case 'summary':
      return <SummaryEditor content={content} updateContent={updateContent} />;
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
}: {
  content: ResumeContent;
  updateContent: (patch: Partial<ResumeContent>) => void;
}) {
  const t = useTranslations('profile');
  const tEditor = useTranslations('editor');
  const profile = content.profile;
  const set = (patch: Partial<typeof profile>) =>
    updateContent({ profile: { ...profile, ...patch } });

  // The sample placeholders are not in the catalogue yet, so they fall back
  // to the English defaults until a key exists for them.
  const namePlaceholder = t.has('namePlaceholder') ? t('namePlaceholder') : 'Ada Lovelace';
  const headlinePlaceholder = t.has('headlinePlaceholder') ? t('headlinePlaceholder') : 'Senior Software Engineer';
  const emailPlaceholder = t.has('emailPlaceholder') ? t('emailPlaceholder') : 'you@example.com';
  const phonePlaceholder = t.has('phonePlaceholder') ? t('phonePlaceholder') : '+1 555 0100';
  const locationPlaceholder = t.has('locationPlaceholder') ? t('locationPlaceholder') : 'San Francisco, CA';

  return (
    <div className="space-y-3">
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
}: {
  content: ResumeContent;
  updateContent: (patch: Partial<ResumeContent>) => void;
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

  return (
    <div className="space-y-3">
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
      <Button variant="outline" size="sm" onClick={enhance} disabled={busy}>
        <Sparkles className={busy ? 'h-4 w-4 mr-1 animate-spin' : 'h-4 w-4 mr-1'} />
        {busy ? t('enhancing') : t('enhance')}
      </Button>
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

  // The sample placeholders are not in the catalogue yet, so they fall back
  // to the English defaults until a key exists for them.
  const startPlaceholder = t.has('startPlaceholder') ? t('startPlaceholder') : '2023-08';
  const endPlaceholder = t.has('endPlaceholder') ? t('endPlaceholder') : 'Present';

  const update = (id: string, patch: Record<string, unknown>) =>
    updateContent({
      experience: items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    });

  const remove = (id: string) =>
    updateContent({ experience: items.filter((i) => i.id !== id) });

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="border rounded-md p-3 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <GripVertical className="h-3.5 w-3.5" />
              {item.position || t('newRole')}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(item.id)}>
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
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
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('highlights')}</Label>
            {(item.highlights ?? []).map((h, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <Textarea
                  aria-label={`Highlight ${idx + 1}`}
                  className="min-h-[52px]"
                  value={h}
                  onChange={(e) => {
                    const next = [...(item.highlights ?? [])];
                    next[idx] = e.target.value;
                    update(item.id, { highlights: next });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 mt-5"
                  onClick={() =>
                    update(item.id, { highlights: (item.highlights ?? []).filter((_, i) => i !== idx) })
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

  // The sample placeholder is not in the catalogue yet, so it falls back to
  // the English default until a key exists for it.
  const scorePlaceholder = t.has('scorePlaceholder') ? t('scorePlaceholder') : 'CGPA: 8.67/10';

  const update = (id: string, patch: Record<string, unknown>) =>
    updateContent({ education: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="border rounded-md p-3 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{item.degree || t('newDegree')}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => updateContent({ education: items.filter((i) => i.id !== item.id) })}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
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

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.id} className="border rounded-md p-3 space-y-2 bg-muted/20">
          <div className="flex items-center gap-2">
            <Input
              className="h-8"
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
        className="w-full"
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
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs"
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
        className="h-8"
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

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.id} className="border rounded-md p-3 space-y-3 bg-muted/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{item.name || t('newProject')}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => updateContent({ projects: items.filter((i) => i.id !== item.id) })}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          <Field label={t('name')} value={item.name} onChange={(v) => update(item.id, { name: v })} />
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('description')}</Label>
            <Textarea
              className="min-h-[60px]"
              value={item.description ?? ''}
              onChange={(e) => update(item.id, { description: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{t('highlights')}</Label>
            {(item.highlights ?? []).map((h, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <Textarea
                  aria-label={`Highlight ${idx + 1}`}
                  className="min-h-[52px]"
                  value={h}
                  onChange={(e) => {
                    const next = [...(item.highlights ?? [])];
                    next[idx] = e.target.value;
                    update(item.id, { highlights: next });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 mt-5"
                  onClick={() =>
                    update(item.id, { highlights: (item.highlights ?? []).filter((_, i) => i !== idx) })
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
              { id: createId('proj'), name: '', description: '', highlights: [''] },
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
