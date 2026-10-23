/**
 * Shared helpers for the end-to-end suite.
 */

import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { API_URL } from './config';

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

let counter = 0;

/**
 * A unique email per call.
 *
 * The users table has a unique index on `email`, and the suite shares one
 * database, so every test needs its own account.
 */
export function uniqueEmail(prefix = 'user'): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}@example.com`;
}

/** A fresh account for a test. */
export function newUser(prefix = 'user'): TestUser {
  return {
    name: 'Test User',
    email: uniqueEmail(prefix),
    password: 'correct-horse-battery',
  };
}

/** Create an account through the UI and wait for the dashboard. */
export async function register(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/register');
  await page.getByLabel('Full name').fill(user.name);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL(/\/dashboard/);
}

/** Sign in through the UI. */
export async function signIn(page: Page, user: TestUser): Promise<void> {
  // Do not navigate if we are already on the sign-in page: the `?next=`
  // parameter that remembers where the visitor wanted to go would be lost.
  if (!page.url().includes('/auth/login')) {
    await page.goto('/auth/login');
  }
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/(dashboard|builder)/);
}

/** Sign out through the header menu. */
export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL(/\/auth\/login/);
}

/**
 * Create an account over the API.
 *
 * The returned context carries the session cookie, so it can call the
 * authenticated endpoints exactly like the browser does.
 */
export async function apiSignUp(
  request: APIRequestContext,
  user: TestUser
): Promise<void> {
  const response = await request.post(`${API_URL}/api/auth/sign-up/email`, {
    data: { name: user.name, email: user.email, password: user.password },
  });
  expect(
    response.ok(),
    `sign-up failed: ${response.status()} ${await response.text()}`
  ).toBeTruthy();
}

/** A minimal but valid resume document. */
export function sampleResumeContent() {
  return {
    profile: {
      fullName: 'Grace Hopper',
      headline: 'Compiler Engineer',
      email: 'grace@example.com',
      phone: '',
      location: 'New York, NY',
      about: '',
      links: [],
    },
    summary: 'Compiler pioneer with 40 years of experience.',
    experience: [
      {
        id: 'exp_e2e',
        position: 'Staff Engineer',
        company: 'Acme Corp',
        period: { start: '2020-01', current: true },
        highlights: ['Cut infrastructure costs by 30%.'],
      },
    ],
    education: [],
    skills: [{ id: 'sk_e2e', name: 'Languages', skills: ['COBOL', 'Fortran'] }],
    projects: [],
    achievements: [],
    certifications: [],
    publications: [],
    languages: [],
    volunteer: [],
    interests: [],
    customSections: [],
  };
}
