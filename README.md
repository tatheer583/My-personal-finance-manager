# Personal Finance Manager

A fast, private, local-first web app for tracking income, expenses, budgets and savings. It runs entirely in the browser: there is no account, no server and no tracking, and your data never leaves your device unless you export it.

![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)
![Tests](https://img.shields.io/badge/tests-35_passing-22c55e)

## Features

- **Dashboard** — current balance, total income and expenses, savings rate, monthly budget progress, income-vs-expense trend chart, spending breakdown by category, recent transactions and budget alerts.
- **Transactions** — add, edit and delete income or expenses; search notes and categories; filter by type, category or a date preset/custom range; sort by date or amount; paginated history (25 per page).
- **Budgets** — an overall monthly ceiling, an optional daily spending limit and per-category budgets with live progress and over-limit warnings.
- **Categories** — rename the built-in income sources and expense categories, add your own, pick colours, and safely delete categories without losing their transactions (they become “Uncategorised”).
- **Settings** — currency (PKR, USD, EUR, GBP, SAR, AED, INR, BDT), number/date locale, light/dark/system theme and a savings goal.
- **Backups** — download a complete JSON backup and restore it later; export transactions as spreadsheet-ready CSV.
- **Responsive interface** — desktop sidebar, mobile bottom navigation, keyboard-friendly controls, reduced-motion support and accessible labels.
- **Offline-friendly** — static assets are bundled locally; no CDN or runtime API is required.
- **Data migration** — data from the original version of the app (stored in `localStorage`) is imported automatically on first launch and mapped onto the new category model.

## Tech stack

| Layer | Tools |
| --- | --- |
| UI | React 19, React Router 7, Tailwind CSS 4, Lucide icons |
| Charts | Recharts 3 |
| Language | TypeScript 5.9 (strict) |
| Build | Vite 8 |
| Validation | Zod 4 (backup files), hand-written record sanitisation (storage) |
| Tests | Vitest, Testing Library, jest-dom |
| Storage | IndexedDB, with JSON export/import |

## Getting started

**Prerequisites:** Node.js 22 or newer and npm.

```bash
git clone https://github.com/tatheer583/My-personal-finance-manager.git
cd My-personal-finance-manager
npm install
npm run dev
```

The dev server runs at <http://localhost:3000>.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check the project and create a production build in `dist/` |
| `npm run preview` | Serve the production build at <http://localhost:4173> |
| `npm run typecheck` | Run the TypeScript compiler without emitting files |
| `npm run lint` | Run ESLint |
| `npm test` | Run the unit test suite once |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run deploy:pages` | Build and publish `dist/` to the `gh-pages` branch (fallback deployment) |

## How to use it

1. Choose **New transaction**, pick Income or Expense, enter an amount, date and category, and optionally add a note.
2. Open **Transactions** to search, filter, edit or delete entries.
3. Use **Budgets** to set a monthly ceiling, a daily limit or category budgets; progress updates from the current month’s expenses.
4. In **Settings**, adjust currency, locale and theme, manage categories, and download a backup before changing devices.
5. To move data, use **Download backup (JSON)** on the old device and **Restore from backup** on the new one.

## Data and privacy

- Everything is stored in **IndexedDB** in your browser, under the database `personal-finance-manager`.
- The app makes **no network requests** for your data. There is no login, analytics or telemetry.
- The theme preference is mirrored to `localStorage` (`pfm.theme`) so the correct theme is applied before first paint.
- Clearing your browser’s site data deletes the app’s records. Keep regular JSON backups.
- JSON backups are validated with Zod on import; malformed individual records are skipped with a warning instead of rejecting the whole file.
- On first launch, data saved by version 1 is migrated from the legacy `transactions` and `senders` keys. Legacy entries are matched to built-in categories by name (for example “groceries” → “Food & meals”).

### Backup format

```json
{
  "app": "personal-finance-manager",
  "version": 2,
  "exportedAt": "2026-10-20T12:00:00.000Z",
  "state": {
    "schemaVersion": 2,
    "transactions": [],
    "categories": [],
    "budgets": [],
    "settings": {}
  }
}
```

## Project structure

```text
.
├── .github/workflows/deploy.yml   # CI: typecheck, lint, test, build, deploy Pages
├── public/favicon.svg
├── scripts/
│   ├── deploy-gh-pages.mjs        # Fallback branch-based deployment
│   ├── e2e-test.mjs               # Browser interaction checks
│   └── smoke-test.mjs             # Route walkthrough and screenshots
├── src/
│   ├── components/
│   │   ├── charts/                # Trend and category charts
│   │   ├── dashboard/             # Stat cards
│   │   ├── layout/                # Shell, sidebar, mobile nav, theme toggle
│   │   ├── transactions/          # Form and filters
│   │   └── ui/                    # Buttons, cards, fields, modals
│   ├── context/                   # Finance, theme and toast providers
│   ├── lib/                       # Storage, stats, CSV, backup, formatting
│   ├── pages/                     # Dashboard, transactions, budgets, settings
│   ├── App.tsx                    # Routes and providers
│   ├── constants.ts               # Schema version, defaults, currencies
│   └── types.ts                   # Domain model
├── index.html
├── vite.config.ts                 # Base path, chunking, SPA 404 fallback
└── vitest.config.ts
```

## Deployment

The included workflow (`.github/workflows/deploy.yml`) runs type-checking, linting, unit tests and a production build, then publishes `dist/` to GitHub Pages.

1. Push the repository to GitHub.
2. Open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
3. Push to `master` (or `main`), or run the **Deploy to GitHub Pages** workflow manually.

The Vite base path is derived from the `GITHUB_REPOSITORY` environment variable, so the site works from `https://<user>.github.io/<repo>/` without editing configuration. The build also emits `404.html` as an SPA fallback, so deep links such as `/transactions` resolve correctly on Pages.

If the repository is configured to deploy from a branch instead, run:

```bash
npm run deploy:pages
```

This builds with the correct base path and pushes the output to the `gh-pages` branch.

## Testing

```bash
npm test          # 35 unit tests
npm run typecheck
npm run lint
```

Unit tests cover storage migration and per-record sanitisation, legacy imports, statistics, formatting, CSV generation and backup validation.

Browser checks are optional and use `puppeteer-core` with an installed Chrome/Chromium:

```bash
npm run build
npm run preview
# in another terminal:
node scripts/e2e-test.mjs
node scripts/smoke-test.mjs
```

Set `BASE_URL` to target another origin and `CHROME_PATH` to point at Chrome if it is not in the default location. Screenshots from the smoke test are written to `.screenshots/` (ignored by Git).

## Browser support

The app targets evergreen browsers with IndexedDB and ES2022 support: current Chrome, Edge, Firefox and Safari. It is a static single-page app and can be hosted on GitHub Pages, Netlify, Vercel or any static file server with SPA rewrites.
