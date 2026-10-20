/**
 * Manual browser smoke test.
 *
 * Loads the built app in Chrome, seeds a realistic dataset, walks the main
 * routes and captures screenshots. Run with:
 *   node scripts/smoke-test.mjs
 */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHROME =
  process.env.CHROME_PATH ??
  'C:\\Users\\1\\.cache\\puppeteer\\chrome-headless-shell\\win64-155.0.8059.84\\chrome-headless-shell-win64\\chrome-headless-shell.exe';
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const shotDir = path.join(rootDir, '.screenshots');

mkdirSync(shotDir, { recursive: true });

const errors = [];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-sandbox', '--disable-gpu'],
});

const page = await browser.newPage();
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 });

console.log('Loading', BASE);
await page.goto(BASE, { waitUntil: 'networkidle2' });

/* ------------------------------------------------------------------ */
/* Seed data through the UI's own IndexedDB store                     */
/* ------------------------------------------------------------------ */

await page.evaluate(async () => {
  const days = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const iso = () => new Date().toISOString();

  const tx = (type, amount, categoryId, offset, note) => ({
    id: `seed-${categoryId}-${offset}-${amount}`,
    type,
    amount,
    categoryId,
    date: days(offset),
    note,
    createdAt: iso(),
    updatedAt: iso(),
  });

  const transactions = [
    tx('income', 25000, 'inc-father', 2, 'Monthly allowance'),
    tx('income', 8000, 'inc-shakir', 9, 'Project work'),
    tx('income', 15000, 'inc-father', 34, 'Monthly allowance'),
    tx('income', 6000, 'inc-scholarship', 40, 'Scholarship instalment'),
    tx('expense', 4200, 'exp-food', 1, 'Groceries'),
    tx('expense', 900, 'exp-transport', 3, 'Bus pass'),
    tx('expense', 15000, 'exp-education', 6, 'University fees'),
    tx('expense', 3200, 'exp-utilities', 8, 'Electricity bill'),
    tx('expense', 1200, 'exp-health', 12, 'Pharmacy'),
    tx('expense', 5600, 'exp-shopping', 15, 'Course books'),
    tx('expense', 8500, 'exp-rent', 18, 'Hostel rent'),
    tx('expense', 950, 'exp-entertainment', 20, 'Cinema'),
    tx('expense', 700, 'exp-phone', 24, 'Mobile top-up'),
    tx('expense', 3800, 'exp-food', 27, 'Groceries'),
    tx('expense', 12000, 'exp-education', 31, 'Lab fee'),
  ];

  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open('personal-finance-manager', 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('documents')) {
        database.createObjectStore('documents');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  const current = await new Promise((resolve) => {
    const tx = db.transaction('documents', 'readonly');
    const req = tx.objectStore('documents').get('app-state');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  const state = current ?? {
    schemaVersion: 2,
    categories: [],
    budgets: [],
    settings: {
      currency: 'PKR',
      locale: 'en-PK',
      theme: 'dark',
      monthlyBudget: 25000,
      dailyLimit: 0,
      savingsGoal: 10000,
    },
  };

  state.transactions = transactions;
  state.settings = { ...(state.settings ?? {}), monthlyBudget: 25000, savingsGoal: 10000 };

  await new Promise((resolve) => {
    const tx = db.transaction('documents', 'readwrite');
    tx.objectStore('documents').put(state, 'app-state');
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });

  db.close();
});

/* ------------------------------------------------------------------ */

async function shot(name, url, viewport, waitFor) {
  await page.setViewport(viewport);
  await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle2' });
  if (waitFor) {
    await page.waitForSelector(waitFor, { timeout: 10_000 }).catch(() => {
      errors.push(`missing selector on ${url}: ${waitFor}`);
    });
  }

  // Grow the viewport to the full page height *before* capturing. Resizing
  // during the capture would restart the chart animations and screenshot
  // them mid-flight.
  const height = await page.evaluate(
    () => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight),
  );
  await page.setViewport({ ...viewport, height: Math.min(height + 40, 6000) });
  // Recharts restarts its entry animation when the chart is resized. Wait for
  // it to finish so screenshots show a fully drawn chart.
  await new Promise((r) => setTimeout(r, 1200));

  // The viewport was already expanded to the full page height above, so a
  // normal screenshot captures everything. Using `fullPage` here would make
  // Chrome re-composite the page, which can drop SVG chart layers on the first
  // capture.
  await page.screenshot({ path: path.join(shotDir, `${name}.png`), fullPage: false });
  console.log(`  captured ${name}.png`);
}

const desktop = { width: 1440, height: 960 };
const mobile = { width: 390, height: 844, isMobile: true, hasTouch: true };

await shot('01-dashboard-desktop', '/', desktop, 'h1');
await shot('02-transactions-desktop', '/transactions', desktop, 'h1');
await shot('03-new-transaction-desktop', '/transactions/new', desktop, 'form');
await shot('04-budgets-desktop', '/budgets', desktop, 'h1');
await shot('05-settings-desktop', '/settings', desktop, 'h1');
await shot('06-dashboard-mobile', '/', mobile, 'h1');
await shot('07-transactions-mobile', '/transactions', mobile, 'h1');

/* Deep link check — the SPA fallback must resolve /transactions directly. */
await page.setViewport(desktop);
await page.goto(`${BASE}/transactions`, { waitUntil: 'networkidle2' });
const heading = await page.$eval('h1', (el) => el.textContent).catch(() => null);
console.log('  deep link /transactions ->', heading);

/**
 * Updates the theme in both places the app reads it from: the persisted
 * settings (adopted on load) and localStorage (used before first paint).
 * Writing only localStorage would be overwritten by the saved settings.
 */
async function setTheme(theme) {
  await page.evaluate(async (value) => {
    localStorage.setItem('pfm.theme', value);

    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('personal-finance-manager', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const current = await new Promise((resolve) => {
      const tx = db.transaction('documents', 'readonly');
      const req = tx.objectStore('documents').get('app-state');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    });

    if (current) {
      current.settings = { ...(current.settings ?? {}), theme: value };
      await new Promise((resolve) => {
        const tx = db.transaction('documents', 'readwrite');
        tx.objectStore('documents').put(current, 'app-state');
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    }

    db.close();
  }, theme);
}

/* Dark theme check. */
await setTheme('dark');
await shot('08-dashboard-dark', '/', desktop, 'h1');

/* Light theme check. */
await setTheme('light');
await shot('09-transactions-light', '/transactions', desktop, 'h1');

await browser.close();

console.log('\nErrors captured:', errors.length);
for (const error of errors) console.log('  -', error);
process.exit(errors.length > 0 ? 1 : 0);
