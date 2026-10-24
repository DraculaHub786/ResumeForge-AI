/**
 * Theme editor — colours, typography, alignment, bullet styles, and spacing.
 */

'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Input,
  Separator,
  Button,
} from '@resume-builder/ui';
import {
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Palette,
  LayoutTemplate,
} from 'lucide-react';
import type { Theme, FontFamily } from '@resume-builder/types';
import { useTranslations } from 'next-intl';

const FONT_OPTIONS: Array<{ value: FontFamily; label: string }> = [
  { value: 'inter', label: 'Inter (Clean Sans)' },
  { value: 'roboto', label: 'Roboto (Modern Sans)' },
  { value: 'open-sans', label: 'Open Sans' },
  { value: 'lato', label: 'Lato (Humanist Sans)' },
  { value: 'montserrat', label: 'Montserrat (Bold Heading)' },
  { value: 'source-serif', label: 'Source Serif (Classic)' },
  { value: 'libre-baskerville', label: 'Libre Baskerville (Editorial)' },
  { value: 'times', label: 'Times New Roman (ATS Standard)' },
  { value: 'calibri', label: 'Calibri (Corporate)' },
  { value: 'georgia', label: 'Georgia (Refined Serif)' },
];

const PRESET_COLORS = [
  { hex: '#ff8533', label: 'Creamy Smooth Orange' },
  { hex: '#111827', label: 'Obsidian Black' },
  { hex: '#1e40af', label: 'Royal Blue' },
  { hex: '#0f766e', label: 'Teal Emerald' },
  { hex: '#475569', label: 'Slate Grey' },
  { hex: '#7c3aed', label: 'Violet Purple' },
  { hex: '#b91c1c', label: 'Burgundy Red' },
  { hex: '#0891b2', label: 'Sky Cyan' },
];

interface ThemeEditorProps {
  theme: Theme;
  setTheme: (patch: Partial<Theme>) => void;
}

export function ThemeEditor({ theme, setTheme }: ThemeEditorProps) {
  const t = useTranslations('design');

  const headerAlign = theme.headerAlignment ?? 'left';
  const sectionAlign = theme.sectionAlignment ?? 'left';
  const contentAlign = theme.contentAlignment ?? 'left';
  const bulletStyle = theme.bulletStyle ?? 'disc';

  return (
    <Card className="rounded-2xl border-border/80 bg-card shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-orange-500" />
          <CardTitle className="text-base font-bold">{t('title')}</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7"
          onClick={() =>
            setTheme({
              primaryColor: '#ff8533',
              textColor: '#111827',
              mutedColor: '#6b7280',
              backgroundColor: '#ffffff',
              fontFamily: 'inter',
              fontSize: 11,
              lineHeight: 1.35,
              showSectionRules: true,
              uppercaseHeadings: true,
              headerAlignment: 'left',
              sectionAlignment: 'left',
              contentAlignment: 'left',
              bulletStyle: 'disc',
              sectionSpacing: 10,
            })
          }
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          {t('reset')}
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Alignment Controls */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
            <LayoutTemplate className="h-3.5 w-3.5 text-orange-500" />
            <span>Alignment & Layout Options</span>
          </div>

          {/* Header Alignment */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Header & Name Alignment</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={headerAlign === 'left' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs flex items-center justify-center gap-1.5"
                onClick={() => setTheme({ headerAlignment: 'left' })}
              >
                <AlignLeft className="h-3.5 w-3.5" />
                Left
              </Button>
              <Button
                type="button"
                variant={headerAlign === 'center' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs flex items-center justify-center gap-1.5"
                onClick={() => setTheme({ headerAlignment: 'center' })}
              >
                <AlignCenter className="h-3.5 w-3.5" />
                Center
              </Button>
              <Button
                type="button"
                variant={headerAlign === 'right' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs flex items-center justify-center gap-1.5"
                onClick={() => setTheme({ headerAlignment: 'right' })}
              >
                <AlignRight className="h-3.5 w-3.5" />
                Right
              </Button>
            </div>
          </div>

          {/* Section Heading Alignment */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Section Title Alignment</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant={sectionAlign === 'left' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs flex items-center justify-center gap-1.5"
                onClick={() => setTheme({ sectionAlignment: 'left' })}
              >
                <AlignLeft className="h-3.5 w-3.5" />
                Left
              </Button>
              <Button
                type="button"
                variant={sectionAlign === 'center' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs flex items-center justify-center gap-1.5"
                onClick={() => setTheme({ sectionAlignment: 'center' })}
              >
                <AlignCenter className="h-3.5 w-3.5" />
                Center
              </Button>
              <Button
                type="button"
                variant={sectionAlign === 'right' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs flex items-center justify-center gap-1.5"
                onClick={() => setTheme({ sectionAlignment: 'right' })}
              >
                <AlignRight className="h-3.5 w-3.5" />
                Right
              </Button>
            </div>
          </div>

          {/* Paragraph Alignment */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Summary & Body Alignment</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={contentAlign === 'left' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs flex items-center justify-center gap-1.5"
                onClick={() => setTheme({ contentAlignment: 'left' })}
              >
                <AlignLeft className="h-3.5 w-3.5" />
                Standard (Left)
              </Button>
              <Button
                type="button"
                variant={contentAlign === 'justify' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs flex items-center justify-center gap-1.5"
                onClick={() => setTheme({ contentAlignment: 'justify' })}
              >
                <AlignJustify className="h-3.5 w-3.5" />
                Justified
              </Button>
            </div>
          </div>

          {/* Bullet Style */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">List Bullet Style</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { id: 'disc', label: '• Dot' },
                { id: 'square', label: '■ Box' },
                { id: 'dash', label: '— Dash' },
                { id: 'arrow', label: '▸ Arrow' },
                { id: 'none', label: 'None' },
              ].map((b) => (
                <Button
                  key={b.id}
                  type="button"
                  variant={bulletStyle === b.id ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-[11px] p-1 font-mono"
                  onClick={() => setTheme({ bulletStyle: b.id as Theme['bulletStyle'] })}
                >
                  {b.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        {/* Accent Colours & Palette */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
            <Palette className="h-3.5 w-3.5 text-orange-500" />
            <span>Accent & Theme Colours</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setTheme({ primaryColor: c.hex })}
                className={`flex items-center gap-1.5 rounded-lg border p-1.5 text-left text-xs transition-all hover:scale-105 ${
                  theme.primaryColor === c.hex
                    ? 'border-orange-500 bg-orange-500/10 font-bold'
                    : 'border-border bg-background'
                }`}
                title={c.label}
              >
                <span
                  className="h-4 w-4 rounded-full border shrink-0"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="truncate text-[10px]">{c.label.split(' ')[0]}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Input
              type="color"
              value={theme.primaryColor}
              onChange={(e) => setTheme({ primaryColor: e.target.value })}
              className="h-9 w-12 p-1 cursor-pointer"
            />
            <Input
              value={theme.primaryColor}
              onChange={(e) => setTheme({ primaryColor: e.target.value })}
              className="h-9 font-mono text-xs flex-1"
              placeholder="#ff8533"
            />
          </div>
        </div>

        <Separator />

        {/* Typography */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
            <Type className="h-3.5 w-3.5 text-orange-500" />
            <span>Typography & Sizing</span>
          </div>

          <div className="space-y-1.5">
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
              <span className="text-xs font-mono text-muted-foreground">
                {theme.fontSize}pt
              </span>
            </div>
            <input
              type="range"
              min={9}
              max={15}
              step={0.5}
              value={theme.fontSize}
              onChange={(e) => setTheme({ fontSize: parseFloat(e.target.value) })}
              className="w-full accent-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">{t('lineHeight')}</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {theme.lineHeight.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={1.15}
              max={1.8}
              step={0.05}
              value={theme.lineHeight}
              onChange={(e) => setTheme({ lineHeight: parseFloat(e.target.value) })}
              className="w-full accent-orange-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Section Spacing</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {theme.sectionSpacing ?? 10}pt
              </span>
            </div>
            <input
              type="range"
              min={4}
              max={20}
              step={1}
              value={theme.sectionSpacing ?? 10}
              onChange={(e) => setTheme({ sectionSpacing: parseInt(e.target.value, 10) })}
              className="w-full accent-orange-500"
            />
          </div>
        </div>

        <Separator />

        {/* Heading Style Toggles */}
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium">{t('uppercaseHeadings')}</span>
            <input
              type="checkbox"
              checked={theme.uppercaseHeadings}
              onChange={(e) => setTheme({ uppercaseHeadings: e.target.checked })}
              className="h-4 w-4 rounded accent-orange-500"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-medium">{t('sectionRules')}</span>
            <input
              type="checkbox"
              checked={theme.showSectionRules}
              onChange={(e) => setTheme({ showSectionRules: e.target.checked })}
              className="h-4 w-4 rounded accent-orange-500"
            />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
