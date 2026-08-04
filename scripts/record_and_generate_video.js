const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function recordFlow() {
  console.log('Starting browser recording...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 }, 
    recordVideo: { dir: 'video_output/', size: { width: 1920, height: 1080 } } 
  });
  const page = await context.newPage();

  console.log('Step 1: Open dashboard & login');
  await page.goto('https://metaaimoderator.vercel.app/', { waitUntil: 'networkidle' });
  await page.fill('#username', 'domya');
  await page.fill('#password', 'domya2026');
  await page.click('button:has-text("تسجيل الدخول")');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'video_output/step1_dashboard.png' });

  console.log('Step 2: Show connect account button & OAuth flow initiation');
  await page.goto('https://metaaimoderator.vercel.app/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'video_output/step2_connect.png' });

  console.log('Step 3: Show inbox & message stream');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'video_output/step3_inbox.png' });

  console.log('Step 4: Show privacy pages');
  await page.goto('https://metaaimoderator.vercel.app/privacy', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'video_output/step4_privacy.png' });

  await page.goto('https://metaaimoderator.vercel.app/terms', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'video_output/step5_terms.png' });

  await context.close();
  await browser.close();

  const files = fs.readdirSync('video_output/');
  const videoFile = files.find(f => f.endsWith('.webm'));
  console.log('Raw video recorded:', videoFile);
  return path.join('video_output/', videoFile || '');
}

recordFlow().catch(console.error);
