#!/usr/bin/env node
// Repository hygiene checks for the public AI QA Platform repository.
// Node.js only, no dependencies, no network. Exit code 1 when any check fails.
//
//   node .github/scripts/validate-repo.cjs
//
// Checks:
//   1. Every *.json file parses.
//   2. Every relative Markdown link resolves to an existing file or folder.
//   3. No secret-like values (private keys, cloud/API tokens, JWTs, inline passwords).
//   4. No absolute local filesystem paths or personal e-mail addresses.
//   5. No task instances, MCP output or office documents are present.
//   6. YAML files contain no tab indentation.

'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'target']);

// Links that intentionally point to files not yet created. Each entry needs a reason.
const KNOWN_MISSING_LINKS = {
  '.claude/skills/security-testing/SKILL.md': {
    reason: 'security-testing is partially implemented; see its Integration Status section',
    targets: [
      '.claude/prompts/security-testing.md',
      '.claude/skills/security-testing/SecurityRiskAssessment.template.md',
      '.claude/skills/security-testing/SecurityTestScenarios.template.md',
      '.claude/skills/security-testing/SecurityTestCases.template.csv',
      '.claude/skills/security-testing/SecurityExecutionReport.template.md',
      '.claude/skills/security-testing/SecurityFindings.template.md',
      '.claude/skills/security-testing/security-testing-report-html.structure.md',
      '.claude/skills/security-testing/journal-event.template.json',
    ],
  },
};

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const files = walk(ROOT);
const failures = [];
const warnings = [];
const fail = (check, file, msg) => failures.push(`[${check}] ${file}: ${msg}`);

// 1. JSON
for (const f of files.filter((f) => f.endsWith('.json'))) {
  try { JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, '')); }
  catch (e) { fail('json', rel(f), e.message); }
}

// 2. Markdown relative links (ignores fenced code blocks)
const linkRe = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
for (const f of files.filter((f) => f.endsWith('.md'))) {
  const text = fs.readFileSync(f, 'utf8').replace(/```[\s\S]*?```/g, '');
  const known = KNOWN_MISSING_LINKS[rel(f)];
  let m;
  while ((m = linkRe.exec(text))) {
    let target = m[1];
    if (/^(https?:|mailto:|#)/i.test(target)) continue;
    if (/[<>{}]/.test(target)) continue; // placeholder paths in templates
    target = decodeURIComponent(target.split('#')[0]);
    if (!target) continue;
    const resolved = path.resolve(path.dirname(f), target);
    if (fs.existsSync(resolved)) continue;
    if (known && known.targets.includes(rel(resolved))) {
      warnings.push(`[link] ${rel(f)} -> ${target} (known missing: ${known.reason})`);
      continue;
    }
    if (/\.template\.md$/.test(f)) {
      // Output templates are copied into a task folder; their links resolve there.
      warnings.push(`[link] ${rel(f)} -> ${target} (runtime-relative link in an output template)`);
      continue;
    }
    fail('link', rel(f), `broken relative link -> ${m[1]}`);
  }
}

// 3 + 4. Secrets, local paths, personal e-mail addresses (text files only)
const TEXT_EXT = /\.(md|json|ya?ml|cjs|js|ts|java|xml|properties|template|csv|txt|example)$|(^|\/)(\.gitignore|\.gitkeep|LICENSE)$/;
const patterns = [
  ['secret', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['secret', /\bAKIA[0-9A-Z]{16}\b/],
  ['secret', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
  ['secret', /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ['secret', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ['secret', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
  ['secret', /\b(password|passwd|pwd|secret|api[_-]?key|token)\b\s*[:=]\s*["'][^"'<>{}$\s]{4,}["']/i],
  ['local-path', /\b[A-Za-z]:\\(Users|Documents and Settings)\\/],
  ['local-path', /(^|[\s"'(])\/(Users|home)\/[A-Za-z0-9._-]+\//],
  ['email', /\b[A-Za-z0-9._%+-]+@(?!example\.(com|org|net|test)\b)(?!users\.noreply\.github\.com\b)[A-Za-z0-9-]+\.[A-Za-z0-9.-]+\b/],
];
for (const f of files.filter((f) => TEXT_EXT.test(rel(f)))) {
  if (rel(f) === '.github/scripts/validate-repo.cjs') continue;
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const [check, re] of patterns) {
      if (re.test(line)) fail(check, `${rel(f)}:${i + 1}`, line.trim().slice(0, 120));
    }
  });
}

// 5. Forbidden content
for (const f of files) {
  const r = rel(f);
  if (r.startsWith('platform/tasks/') && r !== 'platform/tasks/.gitkeep') fail('forbidden', r, 'task instance content');
  if (r.startsWith('reports/') && r !== 'reports/.gitkeep') fail('forbidden', r, 'generated report');
  if (r.startsWith('.playwright-mcp/') && !['.playwright-mcp/.gitkeep', '.playwright-mcp/README.md'].includes(r)) fail('forbidden', r, 'Playwright MCP output');
  if (/\.(docx|xlsx|pptx|vsdx|pdf|zip|png|jpe?g|log)$/i.test(r)) fail('forbidden', r, 'binary/office/log file');
  if (/(^|\/)\.env$/.test(r) || /(^|\/)settings\.local\.json$/.test(r)) fail('forbidden', r, 'local environment/settings file');
}

// 6. YAML tabs
for (const f of files.filter((f) => /\.ya?ml$/.test(f))) {
  fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach((line, i) => {
    if (/^\s*\t/.test(line)) fail('yaml', `${rel(f)}:${i + 1}`, 'tab indentation');
  });
}

for (const w of [...new Set(warnings)]) console.log('WARN ' + w);
for (const e of failures) console.log('FAIL ' + e);
console.log(`\nChecked ${files.length} files: ${failures.length} failure(s), ${new Set(warnings).size} warning(s).`);
process.exit(failures.length ? 1 : 0);
