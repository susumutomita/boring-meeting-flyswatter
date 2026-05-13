#!/usr/bin/env node
// Supply-chain audit for the "mini shai-hulud 2nd wave" worm
// (Flatt Tech, 2026-05-12 — https://blog.flatt.tech/entry/mini_shai_hulud_2nd).
//
// What this checks, and why:
//   1. Manifest hygiene — no optionalDependencies pointing at git/github URLs
//      and no surprise install/preinstall/postinstall/prepare scripts in our
//      own package.json files. The worm injects itself via optionalDependencies
//      on attacker-controlled forks and executes a `prepare` runner.
//   2. Lockfile + tracked-source scan — refuse to ship if any IOC string
//      (C2 domain, blackmail token description, dropper filenames) appears.
//   3. Working-tree IOC files — refuse to ship if a known dropper filename
//      (tanstack_runner.js, router_init.js, codeql_analysis.yml on a
//      non-CodeQL workflow path, etc.) exists outside an explicit allowlist.
//
// Exit codes: 0 clean / 1 IOC detected / 2 audit setup error.
//
// Run via: bun scripts/security/check-supply-chain.mjs
// Wired into Makefile (`make security_audit`) and .husky/pre-commit.

import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..'
);

// Indicators of compromise from the Flatt Tech write-up.
const IOC_STRINGS = [
  'git-tanstack.com',
  'filev2.getsession.org',
  'IfYouRevokeThisTokenItWillWipeTheComputerOfTheOwner',
  'gh-token-monitor',
  'tanstack_runner.js',
  'router_init.js',
];

const IOC_FILENAMES = new Set(['tanstack_runner.js', 'router_init.js']);

// .github/workflows/codeql_analysis.yml is suspicious only if it is *not*
// produced by the official CodeQL Action setup wizard. We check for the
// canonical "github/codeql-action" marker; absence => treat as IOC.
const SUSPECT_WORKFLOW = '.github/workflows/codeql_analysis.yml';

// Directories we skip when walking the tree — large, generated, or otherwise
// outside our control. We deliberately *do* walk .github and .husky.
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'coverage',
  '.turbo',
  '.cache',
  '.next',
  '.bun',
  'aidlc-docs', // contains historical audit transcripts that may mention IOCs
  'scripts/security', // this script itself references the IOC strings
]);

// We treat these script names as load-bearing and audit them strictly.
const DANGEROUS_LIFECYCLE = new Set([
  'preinstall',
  'install',
  'postinstall',
  'prepare',
  'prepublish',
  'prepublishOnly',
]);

// Project-local lifecycle scripts that are known-good. Anything else in a
// workspace package.json triggers a warning so a reviewer eyes the change.
const ALLOWED_PROJECT_LIFECYCLE = new Map([
  // Root package.json: husky sets up local git hooks. Safe — runs locally,
  // not from a dependency.
  ['prepare', new Set(['husky'])],
]);

const findings = [];

function flag(kind, message, location) {
  findings.push({ kind, message, location });
}

async function walk(dir, visit) {
  const rel = path.relative(repoRoot, dir);
  if (rel && SKIP_DIRS.has(rel)) return;
  if (rel && [...SKIP_DIRS].some((d) => rel === d || rel.startsWith(`${d}/`))) {
    return;
  }
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      await walk(full, visit);
    } else if (entry.isFile()) {
      await visit(full);
    }
  }
}

async function auditManifest(manifestPath) {
  let raw;
  try {
    raw = await readFile(manifestPath, 'utf8');
  } catch (err) {
    flag('manifest', `unreadable: ${err.message}`, manifestPath);
    return;
  }
  let pkg;
  try {
    pkg = JSON.parse(raw);
  } catch (err) {
    flag('manifest', `unparsable JSON: ${err.message}`, manifestPath);
    return;
  }

  // optionalDependencies sourced from anywhere other than the registry is the
  // mini-shai-hulud 2nd injection vector.
  const optional = pkg.optionalDependencies ?? {};
  for (const [name, spec] of Object.entries(optional)) {
    if (typeof spec !== 'string') continue;
    if (/^(github:|git\+|git:|https?:|file:)/i.test(spec)) {
      flag(
        'optional-deps',
        `optionalDependency "${name}" uses non-registry source "${spec}" — refuse until verified`,
        manifestPath
      );
    }
  }

  // Lifecycle scripts in our own manifests are allowlisted; everything else
  // is at least worth a human read.
  const scripts = pkg.scripts ?? {};
  const isRoot =
    path.resolve(manifestPath) === path.join(repoRoot, 'package.json');
  for (const [name, body] of Object.entries(scripts)) {
    if (!DANGEROUS_LIFECYCLE.has(name)) continue;
    if (typeof body !== 'string') continue;
    const allowed = ALLOWED_PROJECT_LIFECYCLE.get(name);
    if (isRoot && allowed?.has(body.trim())) continue;
    flag(
      'lifecycle',
      `lifecycle script "${name}" = ${JSON.stringify(body)} — confirm intent`,
      manifestPath
    );
  }
}

async function auditFileContents(filePath) {
  // Avoid loading huge binary files into memory.
  let st;
  try {
    st = await stat(filePath);
  } catch {
    return;
  }
  if (st.size > 5 * 1024 * 1024) return;
  // Filename IOC.
  const base = path.basename(filePath);
  if (IOC_FILENAMES.has(base)) {
    flag('ioc-file', `dropper filename "${base}" present on disk`, filePath);
  }
  let buf;
  try {
    buf = await readFile(filePath, 'utf8');
  } catch {
    return;
  }
  for (const ioc of IOC_STRINGS) {
    if (buf.includes(ioc)) {
      flag('ioc-string', `indicator "${ioc}" found in tracked file`, filePath);
    }
  }
}

async function auditSuspectWorkflow() {
  const wf = path.join(repoRoot, SUSPECT_WORKFLOW);
  if (!existsSync(wf)) return;
  const body = await readFile(wf, 'utf8');
  if (!body.includes('github/codeql-action/')) {
    flag(
      'ioc-file',
      `${SUSPECT_WORKFLOW} exists but does not reference github/codeql-action — likely planted`,
      wf
    );
  }
}

async function main() {
  // 1. Manifest hygiene across every workspace package.json.
  await walk(repoRoot, async (file) => {
    if (path.basename(file) === 'package.json') {
      const rel = path.relative(repoRoot, file);
      // Skip vendored package.json files inside node_modules just in case the
      // walker ever ends up there. (SKIP_DIRS already excludes node_modules.)
      if (rel.includes('node_modules/')) return;
      await auditManifest(file);
    }
  });

  // 2. Tracked-source IOC scan. We deliberately include bun.lock here.
  await walk(repoRoot, async (file) => {
    const base = path.basename(file);
    // Plain-text files only; skip well-known binary extensions.
    if (
      /\.(png|jpg|jpeg|gif|webp|ico|pdf|woff2?|ttf|mp[34]|mov|zip|tgz)$/i.test(
        base
      )
    ) {
      return;
    }
    await auditFileContents(file);
  });

  // 3. Workflow planted alongside our real CI.
  await auditSuspectWorkflow();

  if (findings.length === 0) {
    process.stdout.write(
      'supply-chain audit: OK — no mini-shai-hulud 2nd indicators found.\n'
    );
    return;
  }

  process.stderr.write(`supply-chain audit: ${findings.length} finding(s)\n`);
  for (const f of findings) {
    const where = path.relative(repoRoot, f.location);
    process.stderr.write(`  [${f.kind}] ${where}: ${f.message}\n`);
  }
  process.stderr.write(
    '\nIf this is a real detection: do NOT revoke tokens before stopping the\n' +
      "gh-token-monitor service / LaunchAgent — the worm rm -rf ~/'s the host on\n" +
      'revoke. See blog.flatt.tech/entry/mini_shai_hulud_2nd for the full IR steps.\n'
  );
  process.exit(1);
}

main().catch((err) => {
  process.stderr.write(
    `supply-chain audit failed to run: ${err.stack ?? err}\n`
  );
  process.exit(2);
});
