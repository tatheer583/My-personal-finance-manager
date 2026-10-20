/**
 * End-to-end interaction test.
 *
 * Drives the real UI in Chrome: creating, editing, deleting and filtering
 * transactions, switching themes, and confirming that data survives a
 * reload.
 */
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME_PATH ??
  'C:\\Users\\1\\.cache\\puppeteer\\chrome-headless-shell\\win64-155.0.8059.84\\chrome-headless-shell-win64\\chrome-headless-shell.exe';
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4173';

const results = [];
const check = (name, passed, detail = '') => {
  results.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'shell',
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 960 });

const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(e.message));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Sets a value on a React-controlled input so the state actually updates. */
async function setReactValue(handle, value) {
  await handle.evaluate((el, next) => {
    const proto =
      el instanceof window.HTMLTextAreaElement
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, next);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
}

/** Replaces the whole value of a text-like input. */
async function replaceValue(handle, value) {
  await setReactValue(handle, value);
}

/** Clicks the first *visible* element matching a selector. */
async function clickVisible(selector) {
  const handles = await page.$$(selector);
  for (const handle of handles) {
    const visible = await handle.evaluate(
      (el) =>
        el.getClientRects().length > 0 &&
        getComputedStyle(el).visibility !== 'hidden' &&
        getComputedStyle(el).display !== 'none',
    );
    if (visible) {
      await handle.click();
      return true;
    }
  }
  return false;
}

await page.goto(BASE, { waitUntil: 'networkidle2' });
await page.waitForSelector('h1');

/* ------------------------------------------------------------------ */
/* 1. Create a transaction                                             */
/* ------------------------------------------------------------------ */

await page.goto(`${BASE}/transactions/new`, { waitUntil: 'networkidle2' });
await page.waitForSelector('form');

// Switch the type to Income.
const incomeTab = await page.$$('button[role="radio"]');
await incomeTab[1].click();
await wait(200);

// Amount
const amountInput = await page.$('input[type="number"]');
await replaceValue(amountInput, '1234.50');

// Source (first select inside the form)
const selects = await page.$$('form select');
await selects[0].select('inc-father');

// Date
const dateInput = await page.$('input[type="date"]');
await setReactValue(dateInput, '2026-06-15');

// Note
const noteInput = await page.$('form textarea');
await noteInput.type('E2E test entry');

await page.click('button[type="submit"]');
await wait(1200);

check('Saving redirects to the transactions list', page.url().includes('/transactions'), page.url());

const rowText = await page.evaluate(() =>
  [...document.querySelectorAll('tbody tr')].map((tr) => tr.innerText).join(' | '),
);
check(
  'The new transaction appears in the table with its exact amount',
  rowText.includes('1,234.5'),
  rowText.slice(0, 140),
);
check('The chosen date is saved', rowText.includes('15 Jun 2026'), rowText.slice(0, 140));

/* ------------------------------------------------------------------ */
/* 2. It persists across a reload                                      */
/* ------------------------------------------------------------------ */

await page.reload({ waitUntil: 'networkidle2' });
await wait(900);
const afterReload = await page.evaluate(() =>
  [...document.querySelectorAll('tbody tr')].map((tr) => tr.innerText).join(' | '),
);
check('The transaction survives a page reload', afterReload.includes('E2E test entry'));

/* ------------------------------------------------------------------ */
/* 3. Search filters the list                                          */
/* ------------------------------------------------------------------ */

const search = await page.$('input[type="search"]');
await search.type('E2E test');
await wait(600);
const searchRows = await page.evaluate(
  () => document.querySelectorAll('tbody tr').length,
);
const resultLabel = await page.evaluate(() => {
  const el = [...document.querySelectorAll('span')].find((s) => /\bresults?\b/.test(s.textContent ?? ''));
  return el?.textContent?.trim() ?? '';
});
check('Search narrows the list to one record', searchRows === 1, `${searchRows} rows, "${resultLabel}"`);

await search.click({ clickCount: 3 });
await search.press('Backspace');
await wait(500);

/* ------------------------------------------------------------------ */
/* 4. Edit the transaction                                             */
/* ------------------------------------------------------------------ */

const editButton = await page.$('tbody a[href*="/edit"]');
await editButton.click();
await wait(900);
await page.waitForSelector('form');

const editAmount = await page.$('input[type="number"]');
await replaceValue(editAmount, '999');
await page.click('button[type="submit"]');
await wait(1000);

const afterEdit = await page.evaluate(() =>
  [...document.querySelectorAll('tbody tr')].map((tr) => tr.innerText).join(' | '),
);
// Intl formats currency with a non-breaking space; normalise before matching.
check(
  'Editing updates the amount',
  /Rs\s+999\b/.test(afterEdit.replace(/\u00a0/g, ' ')),
  afterEdit.slice(0, 140),
);

/* ------------------------------------------------------------------ */
/* 5. Delete the transaction                                           */
/* ------------------------------------------------------------------ */

// Target the row that belongs to our test entry specifically.
const deletedTarget = await page.evaluate(() => {
  const row = [...document.querySelectorAll('tbody tr')].find((tr) =>
    tr.innerText.includes('E2E test entry'),
  );
  if (!row) return 'row not found';
  const button = row.querySelector('button[aria-label^="Delete"]');
  if (!button) return 'delete button not found';
  button.click();
  return 'clicked';
});
await wait(500);

const confirmClicked = await page.evaluate(() => {
  const dialog = document.querySelector('[role="dialog"]');
  if (!dialog) return false;
  const button = [...dialog.querySelectorAll('button')].find(
    (b) => b.textContent?.trim() === 'Delete',
  );
  if (!button) return false;
  button.click();
  return true;
});
await wait(1000);

const afterDelete = await page.evaluate(() =>
  [...document.querySelectorAll('tbody tr')].map((tr) => tr.innerText).join(' | '),
);
check(
  'Deleting removes the row',
  !afterDelete.includes('E2E test entry'),
  `target=${deletedTarget} confirm=${confirmClicked}`,
);

/* ------------------------------------------------------------------ */
/* 6. Theme toggle                                                     */
/* ------------------------------------------------------------------ */

await page.goto(BASE, { waitUntil: 'networkidle2' });
await wait(500);
const beforeTheme = await page.evaluate(() =>
  document.documentElement.classList.contains('dark'),
);
const themeToggled = await clickVisible('button[aria-label*="theme"]');
await wait(500);
const afterTheme = await page.evaluate(() =>
  document.documentElement.classList.contains('dark'),
);
check(
  'Theme toggle switches the theme',
  themeToggled && beforeTheme !== afterTheme,
  `${beforeTheme} -> ${afterTheme}`,
);

/* ------------------------------------------------------------------ */
/* 7. Mobile navigation                                                */
/* ------------------------------------------------------------------ */

await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await page.goto(BASE, { waitUntil: 'networkidle2' });
await wait(700);

const bottomNavVisible = await page.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="Primary"]');
  if (!nav) return false;
  const rect = nav.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.bottom <= window.innerHeight + 2;
});
check('Bottom navigation is visible on a phone', bottomNavVisible);

const canNavigateOnMobile = await page.evaluate(() => {
  const link = [...document.querySelectorAll('nav[aria-label="Primary"] a')].find((a) =>
    a.textContent?.includes('Budgets'),
  );
  if (!link) return false;
  link.click();
  return true;
});
await wait(900);
check(
  'Tapping a bottom tab navigates',
  canNavigateOnMobile && page.url().includes('/budgets'),
  page.url(),
);

await browser.close();

/* ------------------------------------------------------------------ */

console.log('\nConsole errors:', consoleErrors.length);
for (const error of consoleErrors) console.log('  -', error);

const failed = results.filter((r) => !r.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length > 0 || consoleErrors.length > 0 ? 1 : 0);
