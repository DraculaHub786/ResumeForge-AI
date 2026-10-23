/**
 * Sign in — email + password via Better Auth.
 *
 * The page itself is a server component so it can carry page metadata; the
 * form lives in a client child because it needs `useSearchParams`.
 */

import type { Metadata } from 'next';

import { LoginForm } from './login-form';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to ResumeForge AI to keep building, enhancing and exporting your resume.',
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return <LoginForm />;
}
