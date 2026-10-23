/**
 * Create an account — email + password via Better Auth.
 *
 * The page itself is a server component so it can carry page metadata; the
 * form lives in a client child because it talks to Better Auth.
 */

import type { Metadata } from 'next';

import { RegisterForm } from './register-form';

export const metadata: Metadata = {
  title: 'Create your account',
  description:
    'Create a free ResumeForge AI account and start building a resume that passes both recruiter screens and ATS filters.',
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
