import { expect, test } from '@playwright/test';

import { API_URL } from '../config';
import { newUser, register } from '../helpers';

test.describe('live editor', () => {
  test('creates a resume and opens the editor', async ({ page }) => {
    await register(page, newUser('create'));

    await page.getByRole('button', { name: 'New Resume', exact: true }).click();

    await expect(page).toHaveURL(/\/builder\//);
    await expect(page.getByText('Live Preview')).toBeVisible();
    await expect(page.getByTestId('resume-preview')).toBeVisible();
  });

  test('the live preview follows every keystroke', async ({ page }) => {
    await register(page, newUser('preview'));
    await page.getByRole('button', { name: 'New Resume', exact: true }).click();
    await expect(page.getByTestId('resume-preview')).toBeVisible();

    const preview = page.getByTestId('resume-preview');

    await page.getByLabel('Full Name').fill('Grace Hopper');
    await expect(preview.getByText('Grace Hopper')).toBeVisible();

    await page.getByLabel('Headline').fill('Compiler Engineer');
    await expect(preview.getByText('Compiler Engineer')).toBeVisible();

    await page.getByLabel('Location').fill('New York, NY');
    await expect(preview.getByText('New York, NY')).toBeVisible();
  });

  test('adds an experience entry and shows it in the preview', async ({ page }) => {
    await register(page, newUser('experience'));
    await page.getByRole('button', { name: 'New Resume', exact: true }).click();
    await expect(page.getByTestId('resume-preview')).toBeVisible();

    await page.getByRole('button', { name: 'Work Experience' }).click();
    await page.getByRole('button', { name: 'Add experience' }).click();

    await page.getByLabel('Position').fill('Staff Engineer');
    await page.getByLabel('Company').fill('Acme Corp');

    const preview = page.getByTestId('resume-preview');
    await expect(preview.getByText('Staff Engineer')).toBeVisible();
    await expect(preview.getByText('Acme Corp')).toBeVisible();

    await page.getByRole('button', { name: 'Add bullet' }).click();
    await page.getByLabel('Highlight 2').fill('Cut infrastructure costs by 30%.');
    await expect(preview.getByText('Cut infrastructure costs by 30%.')).toBeVisible();
  });

  test('adds a skills category with tags', async ({ page }) => {
    await register(page, newUser('skills'));
    await page.getByRole('button', { name: 'New Resume', exact: true }).click();
    await expect(page.getByTestId('resume-preview')).toBeVisible();

    await page.getByRole('button', { name: 'Skills' }).click();
    await page.getByRole('button', { name: 'Add skill category' }).click();
    await page.getByPlaceholder('Category (e.g. Languages)').fill('Languages');

    for (const skill of ['COBOL', 'Fortran']) {
      await page.getByPlaceholder('Add a skill and press Enter').fill(skill);
      await page.keyboard.press('Enter');
    }

    const preview = page.getByTestId('resume-preview');
    await expect(preview.getByText('Languages')).toBeVisible();
    await expect(preview.getByText(/COBOL · Fortran/)).toBeVisible();
  });

  test('autosaves edits and restores them after a reload', async ({ page }) => {
    await register(page, newUser('autosave'));
    await page.getByRole('button', { name: 'New Resume', exact: true }).click();
    await expect(page.getByTestId('resume-preview')).toBeVisible();

    const resumeId = new URL(page.url()).pathname.split('/').pop()!;
    await page.getByLabel('Full Name').fill('Grace Hopper');

    // Poll the API so the assertion is on persisted state, not on a spinner.
    await expect
      .poll(
        async () => {
          const response = await page.request.get(
            `${API_URL}/api/v1/resumes/${resumeId}`
          );
          if (!response.ok()) return null;
          const body = await response.json();
          return body?.content?.profile?.fullName ?? null;
        },
        { timeout: 20_000, message: 'the edit was never persisted' }
      )
      .toBe('Grace Hopper');

    await page.reload();
    await expect(
      page.getByTestId('resume-preview').getByText('Grace Hopper')
    ).toBeVisible();
  });

  test('applies a different template to the preview', async ({ page }) => {
    await register(page, newUser('template'));
    await page.getByRole('button', { name: 'New Resume', exact: true }).click();
    await expect(page.getByTestId('resume-preview')).toBeVisible();

    await page.getByRole('tab', { name: 'Templates' }).click();
    await page.getByText('Banner Modern', { exact: true }).click();

    await expect(page.getByTestId('template-badge')).toHaveText('Banner Modern');
    await expect(page.getByTestId('resume-preview')).toHaveAttribute(
      'data-layout',
      'banner'
    );
  });

  test('keeps a second resume with the same title apart', async ({ page }) => {
    await register(page, newUser('dupe'));

    await page.getByRole('button', { name: 'New Resume', exact: true }).click();
    await expect(page).toHaveURL(/\/builder\//);
    const firstId = new URL(page.url()).pathname.split('/').pop();

    await page.getByRole('button', { name: 'Back to dashboard' }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    await page.getByRole('button', { name: 'New Resume', exact: true }).click();
    await expect(page).toHaveURL(/\/builder\//);
    const secondId = new URL(page.url()).pathname.split('/').pop();

    expect(firstId).not.toBe(secondId);
    await expect(page.getByTestId('resume-preview')).toBeVisible();
  });

  test('deletes a resume from the dashboard', async ({ page }) => {
    await register(page, newUser('delete'));
    await page.getByRole('button', { name: 'New Resume', exact: true }).click();
    await expect(page).toHaveURL(/\/builder\//);

    await page.goto('/dashboard');
    await expect(page.getByText('New Resume').first()).toBeVisible();

    await page.getByRole('button', { name: 'Delete New Resume' }).click();
    await expect(page.getByText('No resumes yet')).toBeVisible();
  });
});
