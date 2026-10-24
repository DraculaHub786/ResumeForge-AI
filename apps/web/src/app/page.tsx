/**
 * Landing page — the public face of the product.
 * Redesigned with Monochrome Architectural aesthetic + Warm Amber/Orange Highlights.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  Gauge,
  Lock,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { Button } from '@resume-builder/ui';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { ThemeToggle } from '@/components/theme-toggle';

export const metadata: Metadata = {
  title: 'ResumeForge AI — AI-powered resume builder',
  description:
    'Build, enhance and export a resume that passes both recruiter screens and ATS filters — with live preview and real AI assistance.',
  alternates: { canonical: '/' },
};

/** The templates shown on the landing page — a taste of the full gallery. */
const SHOWCASE_TEMPLATES = [
  {
    id: 'ats-classic',
    badge: '100% ATS Verified',
    accentColor: 'border-zinc-500/30',
  },
  {
    id: 'modern-pro',
    badge: 'Most Popular',
    accentColor: 'border-orange-500/30',
  },
  {
    id: 'executive',
    badge: 'Senior & Staff',
    accentColor: 'border-zinc-400/30',
  },
  {
    id: 'sidebar-elegant',
    badge: 'Two-Column',
    accentColor: 'border-amber-500/30',
  },
] as const;

export default async function LandingPage() {
  const t = await getTranslations('landing');
  const tTemplates = await getTranslations('templates');

  const features = [
    {
      icon: Pencil,
      title: t('features.liveTitle'),
      description: t('features.liveDescription'),
      badge: 'Real-Time',
    },
    {
      icon: Sparkles,
      title: t('features.aiTitle'),
      description: t('features.aiDescription'),
      badge: 'Claude 3.5 & GPT-4o',
    },
    {
      icon: Gauge,
      title: t('features.atsTitle'),
      description: t('features.atsDescription'),
      badge: '98%+ Pass Rate',
    },
    {
      icon: FileText,
      title: t('features.exportTitle'),
      description: t('features.exportDescription'),
      badge: 'PDF · DOCX · LaTeX',
    },
    {
      icon: Lock,
      title: t('features.privacyTitle'),
      description: t('features.privacyDescription'),
      badge: 'Private & Secure',
    },
  ];

  const steps = [
    {
      num: '01',
      title: t('step1Title'),
      description: t('step1Description'),
      tag: 'Fast Setup',
    },
    {
      num: '02',
      title: t('step2Title'),
      description: t('step2Description'),
      tag: 'Smart Fields',
    },
    {
      num: '03',
      title: t('step3Title'),
      description: t('step3Description'),
      tag: 'Verified Results',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-orange-500/20 selection:text-orange-300">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="group flex items-center gap-2 text-lg font-bold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
              R
            </span>
            <span>
              Resume<span className="text-orange-500">Forge</span>
            </span>
            <span className="hidden sm:inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-400">
              AI 2.0
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <LocaleSwitcher />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/auth/login">{t('ctaSecondary')}</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              <Link href="/auth/register">
                {t('ctaPrimary')}
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* ---------- Hero Section ---------- */}
        <section className="relative overflow-hidden border-b border-border/40 bg-grid-blueprint py-20 sm:py-28">
          <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />

          <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
            {/* Announcement badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-400 shadow-sm backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-orange-400" />
              <span>{t('badge')}</span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </div>

            {/* Main Headline */}
            <h1 className="mx-auto mt-7 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
              The Resume That{' '}
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
                Gets Past The Filter
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
              {t('subtitle')}
            </p>

            {/* CTAs */}
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 px-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md font-semibold text-base transition-all hover:shadow-orange-500/10"
              >
                <Link href="/auth/register">
                  {t('ctaPrimary')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-7 border-border/80 hover:bg-muted/40 font-medium text-base"
              >
                <Link href="/auth/login">{t('ctaSecondary')}</Link>
              </Button>
            </div>

            {/* Trust Signals */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-orange-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-orange-400" />
                <span>Standard ATS Format</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-orange-400" />
                <span>Instant PDF & DOCX Export</span>
              </div>
            </div>

            {/* ---------- Architectural Resume Preview Anchor ---------- */}
            <div className="relative mx-auto mt-14 max-w-4xl rounded-2xl border border-border/80 bg-card/90 p-2 shadow-2xl backdrop-blur-xl sm:p-4">
              {/* Window Chrome Header */}
              <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-3 px-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-xs font-mono text-muted-foreground hidden sm:inline">
                    alex-rivera-staff-ai-engineer.pdf
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    98/100 ATS Score
                  </span>
                  <span className="rounded border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground hidden sm:inline">
                    Template: Modern Pro
                  </span>
                </div>
              </div>

              {/* Inside Resume Preview Mockup */}
              <div className="rounded-xl border border-border/60 bg-background/95 p-6 text-left sm:p-8">
                {/* Header Profile */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/60 pb-5">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                      Alex Rivera
                    </h2>
                    <p className="mt-1 text-sm font-medium text-orange-500">
                      Staff AI Systems & Infrastructure Engineer
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
                      <span>📍 San Francisco, CA</span>
                      <span>✉️ alex.rivera@example.com</span>
                      <span>🔗 github.com/arivera</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="rounded-lg border border-orange-500/25 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-400">
                      AI Enhanced
                    </span>
                  </div>
                </div>

                {/* AI Improvement Pill */}
                <div className="my-4 flex items-center justify-between rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-xs text-orange-400">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                    <strong>AI Recommendation Applied:</strong> Quantified latency reductions and targeted ATS keywords for Staff AI roles (+34% match).
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground hidden md:inline">
                    Updated Just Now
                  </span>
                </div>

                {/* Experience & Skills Snapshot */}
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="sm:col-span-2 space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">Lead AI Infrastructure Engineer</span>
                        <span className="text-xs font-mono text-muted-foreground">2022 — Present</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Anthropic Core Systems · San Francisco</p>
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                        <li>Architected distributed inference runtime handling <strong className="text-foreground">2.4M requests/sec</strong> with 99.99% uptime.</li>
                        <li>Reduced p99 GPU serving latency by <strong className="text-foreground">38%</strong> utilizing custom FlashAttention v3 kernels.</li>
                      </ul>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground">Senior Systems Engineer</span>
                        <span className="text-xs font-mono text-muted-foreground">2019 — 2022</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Scale AI · Remote</p>
                      <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc list-inside">
                        <li>Engineered high-throughput training data pipeline streaming <strong className="text-foreground">15TB/day</strong>.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Sidebar Skills Column */}
                  <div className="space-y-4 border-t sm:border-t-0 sm:border-l sm:border-border/60 sm:pl-5 pt-4 sm:pt-0">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">Key Technical Skills</span>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {['PyTorch', 'vLLM', 'Rust', 'Kubernetes', 'CUDA', 'Next.js', 'Redis'].map((skill) => (
                          <span
                            key={skill}
                            className="rounded border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-mono text-foreground"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">Education</span>
                      <p className="mt-1 text-xs font-semibold text-foreground">M.S. Computer Science</p>
                      <p className="text-[11px] text-muted-foreground">Stanford University · 2019</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Metrics Bar ---------- */}
        <section className="border-b border-border/40 bg-muted/20 py-10">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 text-center sm:grid-cols-4 sm:px-6">
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                98.4<span className="text-orange-500">%</span>
              </div>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                ATS Pass Rate
              </p>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                &lt; 1.2<span className="text-orange-500">s</span>
              </div>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Live Re-Render
              </p>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                12<span className="text-orange-500">+</span>
              </div>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Precision Templates
              </p>
            </div>
            <div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                100<span className="text-orange-500">%</span>
              </div>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Private & Local
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Features Grid ---------- */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-400">
                Engineered for Impact
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                {t('features.title')}
              </h2>
              <p className="mt-3 text-muted-foreground">{t('features.subtitle')}</p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <span className="rounded-full border border-border/80 bg-muted/50 px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                      {feature.badge}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold tracking-tight text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Templates Showcase ---------- */}
        <section className="border-y border-border/40 bg-muted/20 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-400">
              Battle-Tested Layouts
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t('templatesTitle')}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              {t('templatesSubtitle')}
            </p>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {SHOWCASE_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="group relative flex flex-col rounded-2xl border border-border/80 bg-card p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-500/40 hover:shadow-xl"
                >
                  {/* Visual miniature layout blueprint */}
                  <div className="mb-4 h-36 w-full rounded-xl border border-border/70 bg-background/80 p-3 flex flex-col justify-between overflow-hidden group-hover:border-orange-500/30 transition-colors">
                    <div className="space-y-1.5">
                      <div className="h-2 w-16 rounded bg-foreground/80" />
                      <div className="h-1.5 w-24 rounded bg-orange-500/70" />
                      <div className="mt-2 h-0.5 w-full bg-border" />
                    </div>
                    <div className="space-y-1 py-1">
                      <div className="h-1.5 w-full rounded bg-muted-foreground/30" />
                      <div className="h-1.5 w-5/6 rounded bg-muted-foreground/20" />
                      <div className="h-1.5 w-4/6 rounded bg-muted-foreground/20" />
                    </div>
                    <div className="flex gap-1 pt-1 border-t border-border/60">
                      <div className="h-3 w-8 rounded bg-muted/80" />
                      <div className="h-3 w-8 rounded bg-muted/80" />
                      <div className="h-3 w-8 rounded bg-muted/80" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-foreground">
                      {tTemplates(`items.${tmpl.id}.name`)}
                    </span>
                    <span className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 text-[10px] font-medium text-orange-400">
                      {tmpl.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {tTemplates(`items.${tmpl.id}.description`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section className="py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-orange-400">
                Streamlined Workflow
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                {t('howTitle')}
              </h2>
            </div>

            <ol className="mt-16 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <li
                  key={step.title}
                  className="relative rounded-2xl border border-border/80 bg-card p-7 shadow-sm transition-all hover:border-orange-500/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-orange-500">
                      {step.num}
                    </span>
                    <span className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Final CTA ---------- */}
        <section className="border-t border-border/40 bg-grid-blueprint py-20 text-center sm:py-28 relative">
          <div className="absolute inset-0 bg-radial-gradient pointer-events-none" />
          <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              {t('title')}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground">{t('subtitle')}</p>
            <div className="mt-8 flex justify-center">
              <Button
                asChild
                size="lg"
                className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg font-semibold text-base transition-all hover:shadow-orange-500/20"
              >
                <Link href="/auth/register">
                  {t('finalCta')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-border/40 py-12 bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 text-center sm:flex-row sm:text-left sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground font-black text-xs">
              R
            </span>
            <span className="font-bold tracking-tight">
              Resume<span className="text-orange-500">Forge</span> AI
            </span>
            <span className="text-xs text-muted-foreground ml-2">© 2026</span>
          </div>

          <p className="text-xs text-muted-foreground">{t('footerTagline')}</p>

          <div className="flex items-center gap-5 text-xs text-muted-foreground">
            <Link href="/auth/login" className="hover:text-foreground transition-colors">
              {t('ctaSecondary')}
            </Link>
            <Link href="/auth/register" className="hover:text-foreground transition-colors">
              {t('finalCta')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
