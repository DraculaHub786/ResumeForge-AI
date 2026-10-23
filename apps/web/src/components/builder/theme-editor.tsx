/**
 * Theme editor — colours, typography, and layout options.
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle, Label, Input, Separator } from '@resume-builder/ui';
import { RotateCcw } from 'lucide-react';
import { Button } from '@resume-builder/ui';
import type { Theme, FontFamily } from '@resume-builder/types';
import { useTranslations } from 'next-intl';

const FONT_OPTIONS: Array<{ value: FontFamily; label: string }> = [
  { value: 'inter', label: 'Inter (sans)' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'open-sans', label: 'Open Sans' },
  { value: 'lato', label: 'Lato' },
  { value: 'montserrat', label: 'Montserrat' },
  { value: 'source-serif', label: 'Source Serif (serif)' },
  { value: 'libre-baskerville', label: 'Libre Baskerville' },
  { value: 'times', label: 'Times New Roman' },
  { value: 'calibri', label: 'Calibri' },
  { value: 'georgia', label: 'Georgia' },
];

const PRESET_COLORS = [
  '#1e40af', '#0f766e', '#b91c1c', '#7c3aed',
  '#c2410c', '#0891b2', '#111827', '#4338ca',
];

interface ThemeEditorProps {
  theme: Theme;
  setTheme: (patch: Partial<Theme>) => void;
}

export function ThemeEditor({ theme, setTheme }: ThemeEditorProps) {
  const t = useTranslations('design');

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm">{t('title')}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setTheme({
              primaryColor: '#1e40af',
              textColor: '#111827',
              mutedColor: '#6b7280',
              backgroundColor: '#ffffff',
              fontFamily: 'inter',
              fontSize: 11,
              lineHeight: 1.35,
              showSectionRules: true,
              uppercaseHeadings: true,
            })
          }
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          {t('reset')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Colours */}
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground">{t('accentColour')}</Label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setTheme({ primaryColor: c })}
                className={`h-7 w-7 rounded-md border-2 transition-transform hover:scale-110 ${
                  theme.primaryColor === c ? 'border-foreground' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                aria-label={t('useColour', { colour: c })}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={theme.primaryColor}
              onChange={(e) => setTheme({ primaryColor: e.target.value })}
              className="h-9 w-14 p-1"
            />
            <Input
              value={theme.primaryColor}
              onChange={(e) => setTheme({ primaryColor: e.target.value })}
              className="h-9 font-mono text-xs"
            />
          </div>
        </div>

        <Separator />

        {/* Typography */}
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground">{t('fontFamily')}</Label>
          <select
            value={theme.fontFamily}
            onChange={(e) => setTheme({ fontFamily: e.target.value as FontFamily })}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">{t('fontSize')}</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {theme.fontSize}pt
            </span>
          </div>
          <input
            type="range"
            min={8}
            max={16}
            step={0.5}
            value={theme.fontSize}
            onChange={(e) => setTheme({ fontSize: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">{t('lineHeight')}</Label>
            <span className="text-xs tabular-nums text-muted-foreground">
              {theme.lineHeight.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={2}
            step={0.05}
            value={theme.lineHeight}
            onChange={(e) => setTheme({ lineHeight: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Toggles */}
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">{t('uppercaseHeadings')}</span>
            <input
              type="checkbox"
              checked={theme.uppercaseHeadings}
              onChange={(e) => setTheme({ uppercaseHeadings: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm">{t('sectionRules')}</span>
            <input
              type="checkbox"
              checked={theme.showSectionRules}
              onChange={(e) => setTheme({ showSectionRules: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
