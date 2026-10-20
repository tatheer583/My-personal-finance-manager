#!/usr/bin/env node
/**
 * Fallback deployment for GitHub Pages.
 *
 * Publishes the production build to the `gh-pages` branch. Use this when the
 * repository's Pages source is set to "Deploy from a branch" instead of
 * "GitHub Actions".
 *
 *   node scripts/deploy-gh-pages.mjs
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  rmSync,
  mkdirSync,
  cpSync,
  writeFileSync,
  readdirSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const workDir = path.join(rootDir, '.deploy-worktree');

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    encoding: 'utf8',
    ...options,
  });
}

function main() {
  if (!existsSync(distDir)) {
    console.error('No build found. Run "npm run build" first.');
    process.exit(1);
  }

  const branch = 'gh-pages';
  const remote = 'origin';

  console.log(`\nPublishing dist/ to the ${branch} branch…\n`);

  // Build fresh so the base path matches the repository sub-path.
  // `npm` is a shell script on Windows, so it must be invoked as `npm.cmd`.
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], {
    env: {
      ...process.env,
      GITHUB_REPOSITORY:
        process.env.GITHUB_REPOSITORY ?? guessRepositoryName(),
    },
  });

  rmSync(workDir, { recursive: true, force: true });
  mkdirSync(workDir, { recursive: true });

  // A worktree keeps the current branch untouched while we prepare the
  // publishing branch.
  const refExists = (ref) => {
    try {
      run('git', ['rev-parse', '--verify', '--quiet', ref], { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  };

  const hasLocalBranch = refExists(branch);
  const hasRemoteBranch = refExists(`origin/${branch}`);

  if (hasLocalBranch) {
    run('git', ['worktree', 'add', workDir, branch]);
  } else if (hasRemoteBranch) {
    // Start from the published branch so the new commit is a fast-forward.
    run('git', ['worktree', 'add', '-B', branch, workDir, `origin/${branch}`]);
  } else {
    run('git', ['worktree', 'add', '--detach', workDir]);
    run('git', ['checkout', '--orphan', branch], { cwd: workDir });
  }

  try {
    // Replace the contents of the publishing branch, preserving only Git's
    // worktree metadata.
    for (const entry of readdirSync(workDir)) {
      if (entry === '.git') continue;
      rmSync(path.join(workDir, entry), { recursive: true, force: true });
    }

    cpSync(path.join(distDir, 'assets'), path.join(workDir, 'assets'), {
      recursive: true,
    });
    cpSync(path.join(distDir, 'index.html'), path.join(workDir, 'index.html'));

    // GitHub Pages serves 404.html for unknown paths, which lets the client
    // side router handle deep links.
    if (existsSync(path.join(distDir, '404.html'))) {
      cpSync(path.join(distDir, '404.html'), path.join(workDir, '404.html'));
    }

    // Stop Jekyll from ignoring files that start with an underscore.
    writeFileSync(path.join(workDir, '.nojekyll'), '');

    run('git', ['add', '-A'], { cwd: workDir });
    run('git', ['commit', '-m', 'chore: deploy production build'], { cwd: workDir });
    // Push from the worktree so `HEAD` is the publishing commit, not master.
    run('git', ['push', remote, `HEAD:${branch}`], { cwd: workDir });

    console.log('\nDeployed. Your site will be live in a minute or two.');
  } finally {
    run('git', ['worktree', 'remove', '--force', workDir], { stdio: 'pipe' });
    rmSync(workDir, { recursive: true, force: true });
  }
}

/** Falls back to the folder name when the CI variable is unavailable. */
function guessRepositoryName() {
  try {
    const url = run('git', ['remote', 'get-url', 'origin'], { stdio: 'pipe' }).trim();
    const match = /github\.com[:/]([^/]+)\/([^/.]+)/.exec(url);
    if (match) return `${match[1]}/${match[2]}`;
  } catch {
    /* ignore */
  }
  return 'unknown/unknown';
}

main();
