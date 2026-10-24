import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/afjal/.gemini/antigravity-ide/brain/3b943fd2-8265-437a-ae31-22e39e1a2e26';

async function capture() {
  console.log('Launching browser to capture screenshots...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  const page = await context.newPage();

  // 1. Capture Landing Page Hero
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const heroPath = path.join(ARTIFACT_DIR, 'new_landing_hero.png');
  await page.screenshot({ path: heroPath, fullPage: false });
  console.log(`Saved hero screenshot to: ${heroPath}`);

  // 2. Capture Entire Landing Page
  const fullPagePath = path.join(ARTIFACT_DIR, 'new_landing_full.png');
  await page.screenshot({ path: fullPagePath, fullPage: true });
  console.log(`Saved full landing screenshot to: ${fullPagePath}`);

  // 3. Capture Login Page
  console.log('Navigating to http://localhost:3000/auth/login...');
  await page.goto('http://localhost:3000/auth/login', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const loginPath = path.join(ARTIFACT_DIR, 'new_auth_login.png');
  await page.screenshot({ path: loginPath, fullPage: false });
  console.log(`Saved login screenshot to: ${loginPath}`);

  // 4. Capture Register Page
  console.log('Navigating to http://localhost:3000/auth/register...');
  await page.goto('http://localhost:3000/auth/register', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const registerPath = path.join(ARTIFACT_DIR, 'new_auth_register.png');
  await page.screenshot({ path: registerPath, fullPage: false });
  console.log(`Saved register screenshot to: ${registerPath}`);

  // 5. Sign up a test user to capture Dashboard and Builder
  console.log('Creating session to capture Dashboard and Builder...');
  const testEmail = `designer_${Date.now()}@example.com`;
  await page.fill('#name', 'Alex Designer');
  await page.fill('#email', testEmail);
  await page.fill('#password', 'Password123!');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);

  const dashboardPath = path.join(ARTIFACT_DIR, 'new_dashboard.png');
  await page.screenshot({ path: dashboardPath, fullPage: false });
  console.log(`Saved dashboard screenshot to: ${dashboardPath}`);

  // 6. Create a resume and capture Builder
  const newResumeBtn = await page.$('button:has-text("New Resume")');
  if (newResumeBtn) {
    await newResumeBtn.click();
    await page.waitForURL('**/builder/**', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);

    const builderPath = path.join(ARTIFACT_DIR, 'new_builder.png');
    await page.screenshot({ path: builderPath, fullPage: false });
    console.log(`Saved builder screenshot to: ${builderPath}`);
  }

  await browser.close();
  console.log('Screenshot capture complete!');
}

capture().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
