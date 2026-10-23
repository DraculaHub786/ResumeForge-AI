/**
 * Template registry.
 *
 * Each template is a set of layout rules that the preview renderer consumes.
 * The renderer is data-driven: it reads `metadata.template` and renders the
 * appropriate layout engine.
 *
 * Templates are grouped into families:
 *  - ats-classic: single-column, ATS-friendly, minimal styling
 *  - modern: two-column with accent sidebar
 *  - executive: condensed, strong typography
 *  - creative: bold colours, custom section ordering
 */

import type { Theme } from './resume.js';

export interface TemplateDefinition {
  /** Template id. */
  id: string;
  /** Display name shown in the gallery. */
  name: string;
  /** Short description. */
  description: string;
  /** Category for grouping in the gallery. */
  category: 'ats' | 'modern' | 'executive' | 'creative' | 'minimal';
  /** Layout engine name. */
  layout: 'single-column' | 'two-column' | 'sidebar' | 'banner';
  /** Whether this template is ATS-friendly (no images, tables, or multi-column). */
  atsFriendly: boolean;
  /** Default theme overrides for this template. */
  defaultTheme: Partial<Theme>;
  /** Recommended font family. */
  defaultFont: Theme['fontFamily'];
  /** Show the horizontal rule under section headings. */
  showSectionRules: boolean;
  /** Use uppercase section headings. */
  uppercaseHeadings: boolean;
  /** Accent colour for the sidebar / banner. */
  accentColor: string;
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'ats-classic',
    name: 'Classic ATS',
    description: 'Single-column, plain text, ATS-friendly.',
    category: 'ats',
    layout: 'single-column',
    atsFriendly: true,
    defaultTheme: {},
    defaultFont: 'times',
    showSectionRules: true,
    uppercaseHeadings: true,
    accentColor: '#111827',
  },
  {
    id: 'ats-clean',
    name: 'Clean ATS',
    description: 'Modern single-column with generous whitespace.',
    category: 'ats',
    layout: 'single-column',
    atsFriendly: true,
    defaultTheme: {},
    defaultFont: 'inter',
    showSectionRules: true,
    uppercaseHeadings: true,
    accentColor: '#1e40af',
  },
  {
    id: 'modern-pro',
    name: 'Modern Professional',
    description: 'Two-column layout with a tinted accent sidebar.',
    category: 'modern',
    layout: 'two-column',
    atsFriendly: false,
    defaultTheme: {},
    defaultFont: 'inter',
    showSectionRules: true,
    uppercaseHeadings: true,
    accentColor: '#1e40af',
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Condensed layout, strong typography, ideal for senior roles.',
    category: 'executive',
    layout: 'single-column',
    atsFriendly: true,
    defaultTheme: {},
    defaultFont: 'calibri',
    showSectionRules: false,
    uppercaseHeadings: false,
    accentColor: '#1f2937',
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Bold colour palette, custom section ordering, two-column.',
    category: 'creative',
    layout: 'two-column',
    atsFriendly: false,
    defaultTheme: {},
    defaultFont: 'montserrat',
    showSectionRules: true,
    uppercaseHeadings: false,
    accentColor: '#9333ea',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean, no rules, maximum whitespace.',
    category: 'minimal',
    layout: 'single-column',
    atsFriendly: true,
    defaultTheme: {},
    defaultFont: 'open-sans',
    showSectionRules: false,
    uppercaseHeadings: false,
    accentColor: '#111827',
  },
  {
    id: 'technical',
    name: 'Technical',
    description: 'Skill-first layout, ideal for software engineers.',
    category: 'modern',
    layout: 'two-column',
    atsFriendly: false,
    defaultTheme: {},
    defaultFont: 'roboto',
    showSectionRules: true,
    uppercaseHeadings: true,
    accentColor: '#059669',
  },
  {
    id: 'academic',
    name: 'Academic',
    description: 'Publication-focused, suitable for researchers.',
    category: 'executive',
    layout: 'single-column',
    atsFriendly: true,
    defaultTheme: {},
    defaultFont: 'libre-baskerville',
    showSectionRules: true,
    uppercaseHeadings: false,
    accentColor: '#1f2937',
  },
  {
    id: 'sidebar-elegant',
    name: 'Sidebar Elegant',
    description: 'Two-column with a tinted sidebar and generous spacing.',
    category: 'modern',
    layout: 'two-column',
    atsFriendly: false,
    defaultTheme: {},
    defaultFont: 'lato',
    showSectionRules: true,
    uppercaseHeadings: true,
    accentColor: '#1e40af',
  },
  {
    id: 'banner-modern',
    name: 'Banner Modern',
    description: 'Full-width accent banner at the top of the page.',
    category: 'modern',
    layout: 'banner',
    atsFriendly: false,
    defaultTheme: {},
    defaultFont: 'inter',
    showSectionRules: true,
    uppercaseHeadings: true,
    accentColor: '#9333ea',
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Tight spacing, fits more content on one page.',
    category: 'ats',
    layout: 'single-column',
    atsFriendly: true,
    defaultTheme: {},
    defaultFont: 'calibri',
    showSectionRules: true,
    uppercaseHeadings: true,
    accentColor: '#111827',
  },
  {
    id: 'classic-ats',
    name: 'Classic ATS',
    description: 'ATS-friendly single-column with a bold header.',
    category: 'ats',
    layout: 'single-column',
    atsFriendly: true,
    defaultTheme: {},
    defaultFont: 'times',
    showSectionRules: true,
    uppercaseHeadings: true,
    accentColor: '#111827',
  },
];

export function getTemplate(id: string): TemplateDefinition | undefined {
  return TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: TemplateDefinition['category']): TemplateDefinition[] {
  return TEMPLATES.filter(t => t.category === category);
}

export function getATSFriendlyTemplates(): TemplateDefinition[] {
  return TEMPLATES.filter(t => t.atsFriendly);
}