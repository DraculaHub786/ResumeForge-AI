/**
 * Template Studio & Gallery — browse, apply, and configure resume templates.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@resume-builder/ui';
import { Check } from 'lucide-react';
import { TEMPLATES, getTemplatesByCategory } from '@resume-builder/types';
import type { TemplateDefinition } from '@resume-builder/types';
import { useTranslations } from 'next-intl';

const CATEGORIES: Array<TemplateDefinition['category'] | 'all'> = [
  'all',
  'ats',
  'modern',
  'executive',
  'minimal',
  'creative',
];

const CATEGORY_KEYS: Record<TemplateDefinition['category'], string> = {
  ats: 'categories.ats',
  modern: 'categories.modern',
  executive: 'categories.executive',
  minimal: 'categories.minimal',
  creative: 'categories.creative',
};

interface TemplateGalleryProps {
  currentTemplate: string;
  onSelect: (templateId: string, templateDef?: TemplateDefinition) => void;
}

/** Rich schematic preview of a template's architectural layout. */
function TemplateThumbnail({ template }: { template: TemplateDefinition }) {
  const accent = template.accentColor || '#ff8533';

  if (template.layout === 'two-column') {
    return (
      <div className="h-28 w-full rounded-xl bg-white border border-border/80 p-2.5 flex gap-2 overflow-hidden shadow-sm">
        <div className="w-1/3 rounded-lg bg-orange-50/60 p-1.5 space-y-1.5 border border-orange-100/50">
          <div className="h-2 w-3/4 rounded-sm" style={{ backgroundColor: accent }} />
          <div className="h-1 rounded-sm bg-slate-300 w-full" />
          <div className="h-1 rounded-sm bg-slate-200 w-5/6" />
          <div className="h-1 rounded-sm bg-slate-200 w-2/3" />
          <div className="mt-2 h-1.5 w-1/2 rounded-sm" style={{ backgroundColor: accent }} />
          <div className="h-1 rounded-sm bg-slate-200 w-full" />
        </div>
        <div className="flex-1 space-y-2 p-1">
          <div className="h-2.5 w-1/2 rounded-sm bg-slate-800" />
          <div className="h-1 rounded-sm bg-slate-300 w-3/4" />
          <div className="h-0.5 w-full bg-slate-200 my-1" />
          <div className="h-1 rounded-sm bg-slate-300 w-full" />
          <div className="h-1 rounded-sm bg-slate-200 w-5/6" />
          <div className="h-1 rounded-sm bg-slate-200 w-4/6" />
        </div>
      </div>
    );
  }

  if (template.layout === 'banner') {
    return (
      <div className="h-28 w-full rounded-xl bg-white border border-border/80 overflow-hidden shadow-sm flex flex-col">
        <div className="h-9 px-3 py-1.5 flex flex-col justify-center" style={{ backgroundColor: accent }}>
          <div className="h-2 w-1/3 rounded-sm bg-white" />
          <div className="h-1 w-1/2 rounded-sm bg-white/70 mt-1" />
        </div>
        <div className="p-2.5 space-y-1.5 flex-1">
          <div className="h-1.5 w-1/4 rounded-sm bg-slate-700" />
          <div className="h-1 rounded-sm bg-slate-200 w-full" />
          <div className="h-1 rounded-sm bg-slate-200 w-5/6" />
          <div className="h-1 rounded-sm bg-slate-200 w-3/4" />
        </div>
      </div>
    );
  }

  // Single-column ATS
  return (
    <div className="h-28 w-full rounded-xl bg-white border border-border/80 p-3 space-y-2 overflow-hidden shadow-sm">
      <div className="text-center space-y-1">
        <div className="h-2.5 w-1/3 rounded-sm mx-auto bg-slate-900" />
        <div className="h-1 w-1/2 rounded-sm mx-auto bg-slate-300" />
      </div>
      <div className="h-0.5 w-full bg-slate-300 my-1" />
      <div className="space-y-1">
        <div className="h-1.5 w-1/4 rounded-sm" style={{ backgroundColor: accent }} />
        <div className="h-1 rounded-sm bg-slate-200 w-full" />
        <div className="h-1 rounded-sm bg-slate-200 w-5/6" />
      </div>
    </div>
  );
}

export function TemplateGallery({ currentTemplate, onSelect }: TemplateGalleryProps) {
  const t = useTranslations('templates');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('all');

  const templates =
    category === 'all' ? TEMPLATES : getTemplatesByCategory(category);

  return (
    <div className="space-y-5">
      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => {
          const active = category === c;
          const label =
            c === 'all'
              ? 'All Templates'
              : t.has(CATEGORY_KEYS[c])
              ? t(CATEGORY_KEYS[c])
              : c.charAt(0).toUpperCase() + c.slice(1);
          return (
            <Button
              key={c}
              size="sm"
              variant={active ? 'default' : 'outline'}
              className={`h-7 text-xs ${active ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}`}
              onClick={() => setCategory(c)}
            >
              {label}
            </Button>
          );
        })}
      </div>

      {/* Grid of Templates */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const active = currentTemplate === template.id;
          const nameKey = `items.${template.id}.name`;
          const descriptionKey = `items.${template.id}.description`;
          const categoryKey = CATEGORY_KEYS[template.category];

          const name = t.has(nameKey) ? t(nameKey) : template.name;
          const description = t.has(descriptionKey) ? t(descriptionKey) : template.description;
          const categoryLabel = t.has(categoryKey) ? t(categoryKey) : template.category;

          return (
            <Card
              key={template.id}
              className={`cursor-pointer rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                active
                  ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-500/5'
                  : 'border-border/80 hover:border-orange-500/40 bg-card'
              }`}
              onClick={() => onSelect(template.id, template)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">{name}</CardTitle>
                  {active && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  {template.atsFriendly ? (
                    <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                      100% ATS Safe
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      {template.layout === 'two-column' ? 'Two-Column' : 'Accent Banner'}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {categoryLabel}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <TemplateThumbnail template={template} />
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {description}
                </p>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40 font-mono">
                  <span>Font: {template.defaultFont}</span>
                  <span className="capitalize">{template.layout}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
