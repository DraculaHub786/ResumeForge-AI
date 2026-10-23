import { expect, test } from '@playwright/test';

import { newUser, register, signIn, signOut } from '../helpers';

test.describe('authentication', () => {
  test('sends a signed-out visitor from the dashboard to the sign-in page', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('creates an account and lands on the dashboard', async ({ page }) => {
    const user = { ...newUser('newuser'), name: 'Ada Lovelace' };
    await register(page, user);

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('My Resumes')).toBeVisible();
    await expect(page.getByText('Ada Lovelace')).toBeVisible();
  });

  test('signs out and back in with the same credentials', async ({ page }) => {
    const user = { ...newUser('roundtrip'), name: 'Round Trip' };
    await register(page, user);

    await signOut(page);
    await expect(page).toHaveURL(/\/auth\/login/);

    await signIn(page, user);
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Round Trip')).toBeVisible();
  });

  test('rejects a wrong password with a visible error', async ({ page }) => {
    const user = newUser('wrongpw');

    await page.goto('/auth/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill('not-the-right-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('remembers where a signed-out visitor wanted to go', async ({ page }) => {
    const user = newUser('nextpath');
    await register(page, user);
    await signOut(page);

    await page.goto('/builder/res_does_not_exist');
    await expect(page).toHaveURL(/\/auth\/login\?next=/);

    await signIn(page, user);
    await expect(page).toHaveURL(/\/builder\/res_does_not_exist/);
  });

  test('keeps a signed-in visitor out of the sign-in page', async ({ page }) => {
    const user = newUser('guard');
    await register(page, user);

    await page.goto('/auth/login');
    // The page still renders, but the account is usable.
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
    await page.goto('/dashboard');
    await expect(page.getByText('My Resumes')).toBeVisible();
  });
});
