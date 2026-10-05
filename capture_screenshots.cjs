const puppeteer = require('./services/whatsapp/node_modules/puppeteer');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, 'manual_assets');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('Launching browser for comprehensive screenshots...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1366,850'],
    defaultViewport: { width: 1366, height: 850 }
  });

  const page = await browser.newPage();

  try {
    // 1. Login Page
    console.log('1. Capturing Login Page...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01_login_page.png') });

    // Set Admin session for full access to all screens
    await page.evaluate(() => {
      sessionStorage.setItem('user', JSON.stringify({
        id: 6,
        username: 'admin',
        nama: 'Administrator IT',
        role: 'admin',
        telp: '08123456789'
      }));
    });

    // 2. Dashboard
    console.log('2. Capturing Dashboard...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02_dashboard.png') });

    // 3. Kronologi List
    console.log('3. Capturing Kronologi List...');
    await page.goto('http://localhost:5173/kronologi', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03_kronologi_list.png') });

    // 4. Kronologi Form (IKP-1)
    console.log('4. Capturing Kronologi Form (IKP-1)...');
    await page.goto('http://localhost:5173/kronologi/form', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04_kronologi_form.png') });

    // 5. Grading List (IKP-2)
    console.log('5. Capturing Grading List (IKP-2)...');
    await page.goto('http://localhost:5173/grading', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05_grading_list.png') });

    // 6. Click first item in Grading to open the form
    console.log('6. Capturing Grading Form Detail (Rincian Kejadian)...');
    try {
      const row = await page.$('.table-minimal tbody tr');
      if (row) {
        await row.click();
        await new Promise(r => setTimeout(r, 1000));

        // Switch to Tab II. RINCIAN
        const buttons = await page.$$('.mobile-tabs-container button');
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.includes('RINCIAN')) {
            await btn.click();
            break;
          }
        }
        await new Promise(r => setTimeout(r, 800));
        await page.screenshot({ path: path.join(OUTPUT_DIR, '06_grading_rincian.png') });

        // Switch to Tab TTD & VERIFIKASI
        console.log('7. Capturing Grading Tab TTD & Verifikasi...');
        for (const btn of buttons) {
          const text = await page.evaluate(el => el.textContent, btn);
          if (text && text.includes('TTD & VERIFIKASI')) {
            await btn.click();
            break;
          }
        }
        await new Promise(r => setTimeout(r, 800));
        await page.screenshot({ path: path.join(OUTPUT_DIR, '07_grading_verifikasi_kasie.png') });
      }
    } catch (e) {
      console.warn('Could not click grading row:', e.message);
    }

    // 8. Investigasi Mutu (IKP-3)
    console.log('8. Capturing Investigasi Mutu (IKP-3)...');
    await page.goto('http://localhost:5173/investigasi', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1200));
    // Click first item in table if present
    try {
      const invRow = await page.$('table tbody tr');
      if (invRow) {
        await invRow.click();
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {}
    await page.screenshot({ path: path.join(OUTPUT_DIR, '08_investigasi_mutu.png') });

    // 9. Profile Page
    console.log('9. Capturing Profile & WhatsApp Settings...');
    await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(OUTPUT_DIR, '09_profile_page.png') });

    console.log('All detailed screenshots captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

run();
