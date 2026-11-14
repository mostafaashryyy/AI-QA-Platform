#!/usr/bin/env node
// qa-final-report renderer — builds a project-aware QA Final Report HTML from one task's recorded artifacts.
//
//   node .claude/skills/qa-final-report/renderer/build-report.cjs <task-name> [--out <file>]
//
// Pipeline: collect.cjs (read + hash) → reconcile.cjs (bind, currency, runs, QINC) → metrics.cjs (skill rules,
// recommendation) → tooltips-ar.cjs (Arabic ⓘ text) → render-html.cjs (one self-contained page).
// Read only for every task artifact. Default output: platform/tasks/<task>/reports/qa-final-report-preview/index.html
// — NOT reports/QA-Final-Report.html, which only a journaled qa-final-report stage execution may write (QFR-E09).
// This script does not journal, does not write the Markdown companion and does not request approval.

const fs = require('fs'), path = require('path');
const { collect, sha } = require('./collect.cjs');
const { reconcile } = require('./reconcile.cjs');
const { calculate } = require('./metrics.cjs');
const T = require('./tooltips-ar.cjs');
const { render } = require('./render-html.cjs');

const MARK = 'id="qa-final-report-data"';
const fail = (code, msg) => { console.error(`ERROR ${code}: ${msg}`); process.exit(2); };

function main() {
  const args = process.argv.slice(2), task = args.find(a => !a.startsWith('--'));
  if (!task) fail('usage', 'node build-report.cjs <task-name> [--out <file>]  (name the task; it is never guessed)');
  const repo = path.resolve(__dirname, '../../../..');
  const taskDir = path.join(repo, 'platform', 'tasks', task);
  if (!fs.existsSync(taskDir)) fail('QFR-E01', `task folder not found: ${path.relative(repo, taskDir)}`);
  const oi = args.indexOf('--out');
  const outFile = path.resolve(oi >= 0 ? args[oi + 1] : path.join(taskDir, 'reports', 'qa-final-report-preview', 'index.html'));
  if (/^QA-Final-Report\.(md|html)$/i.test(path.basename(outFile))) fail('QFR-E09', 'reports/QA-Final-Report.* is reserved for a journaled qa-final-report stage execution');
  if (fs.existsSync(outFile) && !fs.readFileSync(outFile, 'utf8').includes(MARK)) fail('overwrite', `${outFile} exists and was not written by this renderer`);

  // collect + reconcile + calculate
  const c = collect(repo, task);
  if (!c.journal) fail('QFR-E04', 'journal/execution-log.json missing or invalid');
  const r = reconcile(c);
  const m = calculate(c, r);
  const failed = m.prerequisites.filter(p => !p.ok);
  if (failed.length) fail(failed[0].code, `prerequisites not met, no report written: ${failed.map(p => `${p.n} ${p.text}`).join('; ')}`);
  const before = Object.fromEntries(r.sources.filter(s => s.sha256).map(s => [s.path, s.sha256]));

  const id = c.taskContext?.identity || {}, entry = c.taskContext?.entry || {};
  const clean = s => String(s ?? '').replace(/`/g, '').trim();
  const started = r.runs.map(x => x.started).filter(Boolean).sort();
  const d = {
    report: 'qa-final-report', render: 'unjournaled draft (renderer)', status: 'Draft — not journaled, not approved',
    meta: { project: clean(id['Project Name']) || task, task_name: clean(id['Task Name']) || task, task_id: clean(id['Task ID']) || task, application: clean(entry['Project UI URL']) || 'not provided',
      environment: clean(entry.Environment) || 'not provided', workflow: c.workflowRun?.runs?.find(x => x.workflow_run_id === r.runId)?.workflow_id || 'unknown', workflow_version: c.workflow.version,
      run: r.runId, run_started: c.workflowRun?.runs?.find(x => x.workflow_run_id === r.runId)?.started_at || null, generated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
      skill_version: c.skill.version, prompt_version: c.skill.prompt.prompt_version, journal_last: c.journal.entries.at(-1)?.event_id },
    scopeText: { in: c.testCases.scopeIn, out: c.testCases.scopeOut }, period: { autoFirst: started[0] || null, autoLast: started.at(-1) || null },
    sources: r.sources, contextReports: r.contextReports, qinc: r.qinc, warnings: r.warnings, withheld: c.withheld, journalResultsCount: r.journalResultsCount,
    bugs: r.bugs.map(({ traceability, ...b }) => b), runs: r.runs.map(({ notes, files, missing, ...x }) => x), ...m,
  };

  let html = render(d, T, { outFile, taskDir });

  // secret and e-mail scan (QFR-V15): credential values present in this process's environment, raw and base64
  const secrets = Object.entries(process.env).filter(([k, v]) => /PASSWORD|PASSWD|TOKEN|SECRET|API_?KEY|USERNAME/i.test(k) && v && v.length >= 4).map(([, v]) => v);
  const hits = secrets.filter(v => html.includes(v) || html.includes(Buffer.from(v).toString('base64')));
  const emails = html.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/gi) || [];
  if (hits.length || emails.length) fail('QFR-V15', `credential value or e-mail address in the output (${hits.length} credential, ${emails.length} e-mail); nothing written`);

  // QFR-V14: no bound source changed while the report was built
  const changed = Object.entries(before).filter(([p, h]) => { try { return sha(fs.readFileSync(path.join(taskDir, p))) !== h; } catch { return true; } });
  if (changed.length) fail('QFR-E12', `sources changed during the run: ${changed.map(([p]) => p).join(', ')}`);

  // atomic write with a free-space guard
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  if (fs.statfsSync) { const st = fs.statfsSync(path.dirname(outFile)); if (st.bavail * st.bsize < Buffer.byteLength(html) + 50 * 1024 * 1024) fail('space', 'less than 50 MB free on the output drive'); }
  fs.writeFileSync(`${outFile}.tmp`, html);
  fs.renameSync(`${outFile}.tmp`, outFile);
  console.log(`wrote ${path.relative(repo, outFile)} (${Buffer.byteLength(html)} bytes)`);
  console.log(JSON.stringify({ recommendation: `${m.recommendation.value} (rule ${m.recommendation.rule})`, approved: m.scope.approved, inScope: m.scope.inScope, manual: { pass: m.manual.pass, fail: m.manual.fail, blocked: m.manual.blocked, notExecuted: m.manual.notExecuted },
    automation: m.automation.map(b => `${b.id}: ${b.latest.map(l => `${l.case} ${l.outcome} (${l.run})`).join(', ')}`), defects: `${m.defects.total} (${m.defects.open} open, ${m.defects.confirmed} confirmed)`, healing: `${m.healing.fixed}/${m.healing.attempts} fixed, ${m.healing.remaining} runs unresolved`, qinc: r.qinc.map(q => q.id), risks: m.risks.length }));
}

main();
