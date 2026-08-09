const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium'
  });
  const page = await browser.newPage();

  // Set viewport
  await page.setViewportSize({ width: 1280, height: 720 });

  // Capture console messages
  const logs = [];
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  try {
    console.log('Navigating to QR page...');
    await page.goto('http://localhost:3002/admin/qr', { waitUntil: 'domcontentloaded' });

    // Wait a bit for React to render
    await page.waitForTimeout(2000);

    // Check if canvas has content
    const canvases = await page.locator('canvas').count();
    console.log(`Found ${canvases} canvas elements`);

    // Get canvas information
    const canvasInfo = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas');
      return Array.from(canvases).map((c, i) => ({
        index: i,
        width: c.width,
        height: c.height,
        hasData: c.toDataURL().length > 50
      }));
    });

    console.log('\nCanvas information:');
    canvasInfo.forEach(info => {
      console.log(`  Canvas ${info.index}: ${info.width}x${info.height}, Has data: ${info.hasData}`);
    });

    // Check for loading text
    const loadingText = await page.locator('text=Hazırlanıyor').count();
    console.log(`\nLoading indicator visible: ${loadingText > 0}`);

    // Check for error messages
    if (logs.length > 0) {
      console.log('\nConsole messages:');
      logs.forEach(log => console.log('  ' + log));
    } else {
      console.log('\nNo console messages');
    }

    // Check page content
    const siteUrlVisible = await page.locator('text=https://berk-homeavm.com').count();
    console.log(`\nSite URL visible: ${siteUrlVisible > 0}`);

    // Take screenshot
    await page.screenshot({ path: '/tmp/qr-test-screenshot.png' });
    console.log('\nScreenshot saved to /tmp/qr-test-screenshot.png');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
