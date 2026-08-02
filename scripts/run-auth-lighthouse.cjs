const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { chromium } = require('@playwright/test');

(async () => {
  const token = Buffer.from(process.env.TOKEN_B64 || '', 'base64').toString('utf8');
  if (!token) {
    throw new Error('TOKEN_B64 missing in environment');
  }

  const key = 'sb-macnyqeakdiydttzenrp-auth-token';
  const origin = 'https://ecole-2-0-copie-2-opentechsn.vercel.app';
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lh-auth-'));

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: process.env.PW_CHANNEL || 'msedge',
    args: ['--remote-debugging-port=9222', '--no-sandbox'],
  });

  try {
    const page = await context.newPage();
    await page.goto(origin + '/login', { waitUntil: 'domcontentloaded' });
    await page.evaluate(({ k, v }) => localStorage.setItem(k, v), { k: key, v: token });

    const routes = ['eleves', 'cahier', 'planning'];
    for (const route of routes) {
      const url = origin + '/' + route;
      await page.goto(url, { waitUntil: 'networkidle' });

      const cmd = [
        'corepack pnpm dlx lighthouse',
        url,
        '--port=9222',
        '--only-categories=performance',
        '--disable-storage-reset',
        '--emulated-form-factor=mobile',
        '--throttling.cpuSlowdownMultiplier=4',
        '--output=json',
        '--output-path=./captures/lh-mobile-auth-' + route + '.json',
        '--quiet',
      ].join(' ');

      execSync(cmd, { stdio: 'inherit', shell: true });
    }
  } finally {
    await context.close();
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }
})();
