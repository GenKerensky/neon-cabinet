const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.goto('http://localhost:4200/?test=1&seed=42', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__TEST__?.ready === true, { timeout: 10000 });

  console.log('1. Scene:', await page.evaluate(() => window.__TEST__.scene));

  // Start the game
  await page.evaluate(() => window.__TEST__.commands.start());
  console.log('2. Called start()');

  // Step 10 frames with timing
  const t0 = Date.now();
  await page.evaluate(() => window.__TEST__.time.stepSync(10));
  console.log(`3. stepSync(10) took ${Date.now() - t0}ms`);

  // Check scene
  const scene = await page.evaluate(() => window.__TEST__.scene);
  console.log('4. Scene after stepSync:', scene);

  // Try move command
  const t1 = Date.now();
  try {
    await page.evaluate((d) => {
      const result = window.__TEST__?.commands?.move(d);
      return { moved: true, result };
    }, 'RIGHT');
    console.log(`5. Move RIGHT took ${Date.now() - t1}ms`);
  } catch (e) {
    console.log(`5. Move RIGHT FAILED after ${Date.now() - t1}ms:`, e.message);
  }

  await browser.close();
})().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
