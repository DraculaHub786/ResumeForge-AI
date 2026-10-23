/**
 * Landing page — the public face of the product.
 *
 * It is a server component so it can export route metadata, and it reads its
 * copy from the message catalogue like every other page. The only interactive
 * piece is the language switcher, which is a client component of its own.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, FileText, Gauge, Lock, Pencil, Sparkles } from 'lucide-react';
import { Button } from '@resume-builder/ui';
import { LocaleSwitcher } from '@/components/locale-switcher';

export const metadata: Metadata = {
  title: 'ResumeForge AI — AI-powered resume builder',
  description:
    'Build, enhance and export a resume that passes both recruiter screens and ATS filters — with live preview and real AI assistance.',
  alternates: { canonical: '/' },
};

/** The templates shown on the landing page — a taste of the full gallery. */
const SHOWCASE_TEMPLATES = [
  'ats-classic',
  'modern-pro',
  'executive',
  'sidebar-elegant',
] as const;

export default async function LandingPage() {
  const t = await getTranslations('landing');
  const tTemplates = await getTranslations('templates');

  const features = [
    {
      icon: Pencil,
      title: t('features.liveTitle'),
      description: t('features.liveDescription'),
    },
    {
      icon: Sparkles,
      title: t('features.aiTitle'),
      description: t('features.aiDescription'),
    },
    {
      icon: Gauge,
      title: t('features.atsTitle'),
      description: t('features.atsDescription'),
    },
    {
      icon: FileText,
      title: t('features.exportTitle'),
      description: t('features.exportDescription'),
    },
    {
      icon: Lock,
      title: t('features.privacyTitle'),
      description: t('features.privacyDescription'),
    },
  ];

  const steps = [
    { title: t('step1Title'), description: t('step1Description') },
    { title: t('step2Title'), description: t('step2Description') },
    { title: t('step3Title'), description: t('step3Description') },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Resume<span className="text-primary">Forge</span>
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">AI</span>
          </Link>
          <nav className="flex items-center gap-2">
            <LocaleSwitcher />
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">{t('ctaSecondary')}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/register">{t('ctaPrimary')}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <section className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <span className="inline-flex items-center rounded-full border bg-muted/40 px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
            {t('badge')}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            {t('subtitle')}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/auth/register">
                {t('ctaPrimary')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/login">{t('ctaSecondary')}</Link>
            </Button>
          </div>
        </section>

        {/* ---------- Features ---------- */}
        <section className="border-y bg-muted/25 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('features.title')}
              </h2>
              <p className="mt-4 text-muted-foreground">{t('features.subtitle')}</p>
            </div>

            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border bg-card p-6 shadow-sm"
                >
                  <feature.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- Templates ---------- */}
        <section className="py-20">
          <div className="mx-auto max-w-6xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('templatesTitle')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              {t('templatesSubtitle')}
            </p>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {SHOWCASE_TEMPLATES.map((id) => (
                <div
                  key={id}
                  className="rounded-xl border bg-card p-5 text-left shadow-sm"
                >
                  <div className="mb-4 h-24 w-full rounded border bg-muted/30" />
                  <div className="text-sm font-medium">
                    {tTemplates(`items.${id}.name`)}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {tTemplates(`items.${id}.description`)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- How it works ---------- */}
        <section className="border-y bg-muted/25 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {t('howTitle')}
              </h2>
            </div>

            <ol className="mt-14 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="rounded-xl border bg-card p-6 shadow-sm">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------- Final CTA ---------- */}
        <section className="py-20 text-center">
          <div className="mx-auto max-w-2xl px-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('title')}
            </h2>
            <p className="mt-4 text-muted-foreground">{t('subtitle')}</p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/auth/register">
                {t('finalCta')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* ---------- Footer ---------- */}
      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
          <p className="text-sm text-muted-foreground">{t('footerTagline')}</p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/auth/login" className="text-muted-foreground hover:text-foreground">
              {t('ctaSecondary')}
            </Link>
            <Link
              href="/auth/register"
              className="text-muted-foreground hover:text-foreground"
            >
              {t('finalCta')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
