import { chromium } from '@playwright/test';
import path from 'path';

const ARTIFACT_DIR = 'C:/Users/afjal/.gemini/antigravity-ide/brain/3b943fd2-8265-437a-ae31-22e39e1a2e26';

async function capture() {
  console.log('Launching browser to capture all Builder views and tabs...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1500, height: 950 },
    colorScheme: 'light',
  });
  const page = await context.newPage();

  // Sign up a user
  console.log('Registering test user...');
  await page.goto('http://localhost:3000/auth/register', { waitUntil: 'networkidle' });
  const testEmail = `aistudio_${Date.now()}@example.com`;
  await page.fill('#name', 'Jordan Developer');
  await page.fill('#email', testEmail);
  await page.fill('#password', 'Password123!');
  await page.click('button[type="submit"]');

  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Create new resume
  console.log('Creating new resume...');
  await page.click('button:has-text("New Resume")');
  await page.waitForURL('**/builder/**', { timeout: 10000 });
  await page.waitForTimeout(2000);

  // 1. Capture Content Editor Tab (with Alignment toolbar, reordering, and AI tools)
  console.log('Capturing Content tab...');
  const editorPath = path.join(ARTIFACT_DIR, 'builder_content_editor.png');
  await page.screenshot({ path: editorPath, fullPage: false });
  console.log(`Saved Content Editor: ${editorPath}`);

  // 2. Click AI Studio Tab and Capture
  console.log('Navigating to AI Studio tab...');
  await page.click('button[role="tab"]:has-text("AI Studio")');
  await page.waitForTimeout(1000);
  const aiPath = path.join(ARTIFACT_DIR, 'builder_ai_studio.png');
  await page.screenshot({ path: aiPath, fullPage: false });
  console.log(`Saved AI Studio: ${aiPath}`);

  // 3. Click Templates Studio Tab and Capture
  console.log('Navigating to Templates tab...');
  await page.click('button[role="tab"]:has-text("Templates")');
  await page.waitForTimeout(1000);
  const templatesPath = path.join(ARTIFACT_DIR, 'builder_templates_studio.png');
  await page.screenshot({ path: templatesPath, fullPage: false });
  console.log(`Saved Templates Studio: ${templatesPath}`);

  // 4. Click Design & Alignment Tab and Capture
  console.log('Navigating to Design tab...');
  await page.click('button[role="tab"]:has-text("Design")');
  await page.waitForTimeout(1000);
  const designPath = path.join(ARTIFACT_DIR, 'builder_design_alignment.png');
  await page.screenshot({ path: designPath, fullPage: false });
  console.log(`Saved Design & Alignment: ${designPath}`);

  // 5. Click LaTeX Live Compiler Tab and Capture
  console.log('Navigating to LaTeX tab...');
  await page.click('button[role="tab"]:has-text("LaTeX")');
  await page.waitForTimeout(1000);
  const latexPath = path.join(ARTIFACT_DIR, 'builder_latex_compiler.png');
  await page.screenshot({ path: latexPath, fullPage: false });
  console.log(`Saved LaTeX Live: ${latexPath}`);

  // 6. Test Compile Live in LaTeX tab and capture compilation output
  console.log('Triggering Live Compilation in LaTeX tab...');
  const compileBtn = await page.$('button:has-text("Compile Live PDF")');
  if (compileBtn) {
    await compileBtn.click();
    await page.waitForTimeout(2500);
    const compiledPath = path.join(ARTIFACT_DIR, 'builder_latex_compiled.png');
    await page.screenshot({ path: compiledPath, fullPage: false });
    console.log(`Saved LaTeX Compiled State: ${compiledPath}`);
  }

  await browser.close();
  console.log('All tab captures completed successfully!');
}

capture().catch((err) => {
  console.error('Error during capture:', err);
  process.exit(1);
});
