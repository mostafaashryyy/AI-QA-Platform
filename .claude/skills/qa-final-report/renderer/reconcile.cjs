// DATA VALIDATION AND RECONCILIATION — applies the skill's Artifact Discovery, Source-of-Truth and hash rules
// (SKILL.md) to the collected data. Produces: bound sources with availability and approval currency, the approved
// scope, manual results, the run catalogue per binding, healing attempts, defects, and every contradiction as an
// inconsistency (QINC) instead of a silent choice.

const md = require('./lib/md.cjs');

const DEFAULT_PATHS = { // the skill's Inputs table (platform defaults, used only when the journal names no output)
  'prd-generation': ['prd/PRD.md'], 'project-context': ['context/ProjectContext.md'], exploration: ['exploration/ExplorationReport.md'],
  'test-design': ['test-design/TestCases.md'], 'test-review': ['test-review/TestReview.md'],
  'manual-execution': ['execution/ExecutionReport.md', 'bugs/BugReports.md'], 'automation-generation': ['automation/AutomationGeneration.md'],
  'automation-execution': ['automation-execution/execution-metrics.json'], 'self-healing': ['self-healing/healing-log.md'],
};
const REPORT_STAGES = ['qa-final-report', 'reporting'];
const OUTCOMES = ['passed', 'failed', 'not_run', 'harness_failed'];
const HISTORY_ONLY = /warm-?up|demonstration|demo run|benchmark-only|diagnostic/i;

function reconcile(c) {
  const qinc = [], warnings = [];
  const addQinc = q => { const id = `QINC-${String(qinc.length + 1).padStart(3, '0')}`; qinc.push({ id, ...q }); return id; };
  const E = c.journal.entries;
  const runId = c.workflowRun?.active_run_id ?? null;
  const inRun = E.filter(e => e.workflow_run_id === runId);
  const evOf = id => E.find(e => e.event_id === id);
  const execs = st => inRun.filter(e => e.event_type === 'stage_execution' && e.stage_id === st);
  const outPath = o => c.taskRel(o.path);

  // ---------------- sources (discover → bind → currency) ----------------
  const lfOnly = [];
  const sources = [];
  for (const st of c.workflow.stages.filter(s => !REPORT_STAGES.includes(s.id))) {
    const runs = execs(st.id);
    const journaled = [...new Set(runs.flatMap(e => (e.output_artifacts || []).map(outPath)))].filter(p => !/\/(evidence|results)\//.test(p) && !/\/$/.test(p));
    const paths = journaled.length ? journaled : DEFAULT_PATHS[st.id] || [];
    const approvals = inRun.filter(e => e.event_type === 'approval_decision' && e.stage_id === st.id && e.approval_outcome === 'accepted');
    const approval = approvals.at(-1) || null;
    for (const p of paths) {
      const f = c.read(p);
      const writers = E.filter(e => (e.output_artifacts || []).some(o => outPath(o) === p));
      const producing = [...runs].reverse().find(e => (e.output_artifacts || []).some(o => outPath(o) === p)) || null;
      const ref = approval && (approval.output_artifacts || []).some(o => outPath(o) === p) ? approval : writers.at(-1) || null;
      const refOut = ref ? ref.output_artifacts.find(o => outPath(o) === p) : null;
      let availability = 'available', discovered = journaled.length ? 'journal' : 'workflow';
      if (!runs.length) availability = 'not_performed';
      else if (!f.exists) availability = writers.length ? 'missing' : 'not_performed';
      else if (f.placeholder) availability = 'placeholder';
      let hashState = 'unrecorded';
      if (f.exists && refOut?.sha256) hashState = refOut.sha256 === f.rawHash ? 'equal' : refOut.sha256 === f.lfHash ? 'lf-equal' : 'changed';
      if (hashState === 'lf-equal') lfOnly.push(p);
      const laterExec = approval ? runs.some(e => e.timestamp > approval.timestamp) : false;
      let approvalState = st.approval_key ? 'not approved' : 'no gate';
      if (st.approval_key && approval) approvalState = (hashState === 'equal' || hashState === 'lf-equal') && !laterExec ? 'current' : 'stale';
      sources.push({ stage: st.id, order: st.order, path: p, version: refOut?.artifact_version || null, sha256: f.rawHash || null, recorded_sha256: refOut?.sha256 || null,
        hashState, availability, discovered_by: discovered, producing_event: producing?.event_id || null, reference_event: ref?.event_id || null,
        approval_key: st.approval_key, approval_event: approval?.event_id || null, approval: approvalState, later_execution: laterExec });
      if (availability === 'missing') addQinc({ kind: 'missing', title: `${p} is recorded in the journal but missing`, sources: writers.map(e => e.event_id), shown: 'Evidence Not Available', impact: 'Sections using this artifact show Evidence Not Available.', affects: true });
      if (hashState === 'changed') addQinc({ kind: 'stale', title: `${p} changed after ${ref.event_id}`, sources: [ref.event_id, p], values: [refOut.sha256, f.rawHash], shown: 'Current file, labeled stale', impact: st.approval_key ? `${st.approval_key} is stale.` : 'Content differs from its producing event.', affects: !!st.approval_key });
      if (availability !== 'available') warnings.push({ code: 'QFR-W01', text: `${st.id}: ${p} is ${availability.replace('_', ' ')}` });
    }
  }
  if (lfOnly.length) addQinc({ kind: 'info', severity: 'info', title: 'Line-ending-only hash differences (Git core.autocrlf checkout)', sources: lfOnly,
    values: ['recorded SHA-256 (LF)', 'current raw SHA-256 (CRLF)'], shown: 'Artifacts treated as unchanged: the SHA-256 of the LF-normalized text equals the recorded hash', impact: 'None; informational (QFR-W04).', affects: false });
  const src = p => sources.find(s => s.path === p);
  const gate = st => { const s = sources.find(x => x.stage === st && x.approval_key); return s ? s.approval : 'n/a'; };

  // Context-only reports: listed with currency, never used as a source of results.
  const contextReports = [...new Set(inRun.filter(e => e.stage_id === 'reporting').flatMap(e => (e.output_artifacts || []).map(outPath)))].filter(p => p.startsWith('reports/')).map(p => {
    const f = c.read(p), w = E.filter(e => (e.output_artifacts || []).some(o => outPath(o) === p)).at(-1), o = w?.output_artifacts.find(x => outPath(x) === p);
    return { path: p, exists: f.exists, event: w?.event_id, state: !f.exists ? 'missing' : !o?.sha256 ? 'unrecorded' : o.sha256 === f.rawHash || o.sha256 === f.lfHash ? 'unchanged' : 'changed since its event' };
  });

  // ---------------- approved scope (TestCases.md is authoritative; CSV and per-case blocks cross-checked) ----------------
  const tc = c.testCases;
  const cases = tc.index.map(r => {
    const id = md.clean(r.ID), b = tc.blocks[id] || { fields: {} }, f = b.fields;
    const expected = md.clean(f['Expected Result'] || '');
    return { id, title: md.clean(r.Title), type: md.clean(r.Type), priority: md.clean(r.Priority), status: md.clean(r.Status),
      validInScope: /^TRUE/i.test(md.clean(r['Valid in Scope'])), needsAutomation: /^TRUE/i.test(md.clean(r['Needs Automation'])),
      established: !!expected && !/^Not established/i.test(expected), expected, traceability: md.ids(f.Traceability, /\b(?:PRD|PC) [A-Z]+-\d{3}\b|\b(?:OBS|PB|XGAP|XDEP|XQ)-\d{3}\b/g) };
  });
  const withdrawn = cases.filter(x => /withdrawn/i.test(x.status));
  const active = cases.filter(x => !/withdrawn/i.test(x.status));
  const flagDiff = [];
  for (const x of active) {
    const b = tc.blocks[x.id]?.fields || {}, csv = c.testCasesCsv.find(r => r.id === x.id);
    const blk = { v: /^TRUE/i.test(md.clean(b['Valid in Scope'])), n: /^TRUE/i.test(md.clean(b['Needs Automation'])) };
    if (!tc.blocks[x.id] || blk.v !== x.validInScope || blk.n !== x.needsAutomation) flagDiff.push(`${x.id} (index vs case block)`);
    if (c.testCasesCsv.length && (!csv || /^TRUE/i.test(csv['valid in scope']) !== x.validInScope || /^TRUE/i.test(csv['needs automation']) !== x.needsAutomation)) flagDiff.push(`${x.id} (index vs CSV)`);
  }
  if (flagDiff.length) addQinc({ kind: 'scope', title: 'Valid in Scope / Needs Automation differ between TestCases.md views', sources: ['test-design/TestCases.md', 'test-design/TestCases.csv'], values: flagDiff, shown: 'TestCases.md Index (authoritative)', impact: 'Scope and candidate counts follow the Index.', affects: false });
  const outReason = x => {
    const q = tc.exploratory.find(r => md.clean(r.Case) === x.id);
    if (!x.validInScope) return 'Valid in Scope = FALSE';
    if (!x.established) return `Expected result not established${q ? ` (Exploratory, ${md.clean(q.Question)})` : ''}`;
    return null;
  };
  active.forEach(x => { x.inExecutionScope = x.validInScope && x.established; x.outReason = outReason(x); });

  // ---------------- manual results (ExecutionReport §4, cross-checked with §3 and the journal) ----------------
  const ex = c.execution;
  const manualExec = execs('manual-execution').filter(e => e.status !== 'blocked').at(-1) || null;
  const norm = s => { const t = md.clean(s); return /^PASS$/i.test(t) ? 'PASS' : /^FAIL$/i.test(t) ? 'FAIL' : /^BLOCKED$/i.test(t) ? 'BLOCKED' : 'NOT EXECUTED'; };
  const manual = {};
  (ex?.perCase || []).forEach(r => { manual[md.clean(r.ID)] = { status: norm(r.Status), statusText: md.clean(r.Status), reason: md.clean(r.Reason), evidence: md.ids(r.Evidence, /EVD-\d{3}/g), earlier: md.ids((/earlier attempts?:([^)]*)/i.exec(r.Evidence) || [])[1], /EVD-\d{3}/g) }; });
  const count = s => active.filter(x => (manual[x.id]?.status || 'NOT EXECUTED') === s).length;
  const manualCounts = { pass: count('PASS'), fail: count('FAIL'), blocked: count('BLOCKED'), notExecuted: count('NOT EXECUTED') };
  manualCounts.executed = manualCounts.pass + manualCounts.fail + manualCounts.blocked;
  const sumV = re => { const v = md.findKey(ex?.summary, re); return v == null ? null : parseInt(md.clean(v), 10); };
  const summary = { executed: sumV(/^Executed$/), pass: sumV(/^PASS$/), fail: sumV(/^FAIL$/), blocked: sumV(/^BLOCKED$/), notExecuted: sumV(/^Not executed/), approved: sumV(/^Total approved/) };
  const journalResults = manualExec?.test_results || [];
  const jMismatch = journalResults.filter(t => manual[t.test_case_id] && manual[t.test_case_id].status !== t.status).map(t => `${t.test_case_id}: report ${manual[t.test_case_id].status}, journal ${t.status}`);
  const jMissing = active.filter(x => ['PASS', 'FAIL', 'BLOCKED'].includes(manual[x.id]?.status) && !journalResults.some(t => t.test_case_id === x.id)).map(x => x.id);
  const checks = {
    summaryVsRows: ['executed', 'pass', 'fail', 'blocked', 'notExecuted'].every(k => summary[k] === manualCounts[k]),
    journalVsRows: !jMismatch.length && !jMissing.length,
    identityExecuted: manualCounts.executed === manualCounts.pass + manualCounts.fail + manualCounts.blocked,
    identityApproved: active.length === manualCounts.executed + manualCounts.notExecuted,
    rowsCoverScope: active.every(x => manual[x.id]),
  };
  let manualQinc = null;
  if (!checks.summaryVsRows) manualQinc = addQinc({ kind: 'manual', title: 'ExecutionReport §3 summary differs from the §4 per-case rows', sources: ['execution/ExecutionReport.md §3', '§4'], values: [JSON.stringify(summary), JSON.stringify(manualCounts)], shown: '§4 per-case rows, labeled unreconciled', impact: 'Manual figures unreconciled.', affects: true });
  if (!checks.journalVsRows) manualQinc = addQinc({ kind: 'manual', title: `ExecutionReport §4 differs from the journal test_results of ${manualExec?.event_id}`, sources: ['execution/ExecutionReport.md §4', manualExec?.event_id], values: [...jMismatch, ...jMissing.map(i => `${i}: not in journal`)], shown: '§4 per-case rows, labeled unreconciled', impact: 'Manual figures unreconciled.', affects: true });
  const manualSource = src('execution/ExecutionReport.md');

  // ---------------- defects (BugReports.md is authoritative; ExecutionReport §8 cross-checked) ----------------
  const bugs = (c.bugs?.index || []).map(r => {
    const id = md.clean(r.Bug), d = (c.bugs.details || []).find(x => x.id === id) || {};
    const cases = md.ids(r['Related test cases'] || d.affected, /TC-\d{3}/g);
    return { id, title: md.clean(r.Title), classification: md.clean(r.Classification), severity: md.clean(r.Severity), priority: md.clean(r.Priority), status: md.clean(r.Status),
      cases, problemReview: md.clean(r['Problem Review']), evidence: md.ids(d.evidence, /EVD-\d{3}/g), related: md.ids(`${d.classification} ${d.traceability}`, /\bPB-\d{3}\b/g), traceability: d.traceability || '' };
  });
  const bugDiff = [];
  for (const b of bugs) {
    const d = (c.bugs.details || []).find(x => x.id === b.id);
    if (d && (!d.severity.startsWith(b.severity) || !d.priority.startsWith(b.priority) || d.status !== b.status)) bugDiff.push(`${b.id}: index vs detail section`);
    const r = (ex?.bugsRaised || []).find(x => md.clean(x.Bug) === b.id);
    if (r && (md.clean(r.Severity) !== b.severity || md.clean(r.Priority) !== b.priority || md.clean(r.Status) !== b.status)) bugDiff.push(`${b.id}: BugReports vs ExecutionReport §8`);
  }
  (ex?.bugsRaised || []).forEach(r => { if (!bugs.some(b => b.id === md.clean(r.Bug))) bugDiff.push(`${md.clean(r.Bug)}: in ExecutionReport §8 only`); });
  if (bugDiff.length) addQinc({ kind: 'defects', title: 'Defect data differs between sources', sources: ['bugs/BugReports.md', 'execution/ExecutionReport.md §8'], values: bugDiff, shown: 'BugReports.md Index (authoritative)', impact: 'Severity / priority counts follow BugReports.md.', affects: false });

  // ---------------- automation: bindings, generated tests, runs ----------------
  const genEvents = execs('automation-generation');
  const bindings = [];
  for (const e of genEvents) {
    const b = e.automation_binding; if (!b) continue;
    const dir = c.taskRel(b.project_dir).replace(/\/$/, '');
    const entry = { id: b.binding_id, framework: b.framework, language: b.language, runner: b.runner, build: b.build_tool, dir, dirName: dir.split('/').pop(), event: e.event_id,
      generated: (e.automated_cases || []).filter(x => x.status === 'generated').map(x => ({ id: x.test_case_id, file: x.test_file, method: x.test_method, steps: x.steps_mapped })) };
    const i = bindings.findIndex(x => x.id === b.binding_id);
    if (i >= 0) bindings[i] = entry; else bindings.push(entry);
  }
  const bindingOf = name => bindings.find(b => b.id === name || b.dirName === name);
  const metricsRuns = c.metrics?.runs || [];
  const mOf = id => metricsRuns.find(r => r.run_id === id);
  const seq = id => { const m = /-(\d{8})-[A-Z](\d+)$/.exec(id); return m ? `${m[1]}-${m[2].padStart(4, '0')}` : id; };
  const healEvents = inRun.filter(e => e.healing_attempts);
  const attempts = healEvents.flatMap(e => e.healing_attempts.map(h => ({ ...h, event: e.event_id, failed: String(h.failed_run_id || '').split(/\s*,\s*/).filter(Boolean) })));
  const runs = [];
  for (const e of execs('automation-execution')) {
    for (const r of e.automation_runs || []) {
      const m = mOf(r.run_id), files = (r.result_files || []).map(c.taskRel), missing = files.filter(p => !c.exists(p));
      const role = m?.series_role || null;
      const history = (role && role !== 'measured') || HISTORY_ONLY.test(r.notes || '') ? (role || 'designated history') : null;
      const reclass = [...attempts].reverse().find(h => h.failed.includes(r.run_id) && h.classification && h.classification !== r.failure_class);
      runs.push({ id: r.run_id, binding: r.binding_id, event: e.event_id, source: 'automation_runs', started: r.started_at, ended: r.ended_at, cases: r.test_case_ids || [], outcome: r.outcome,
        failureClass: reclass ? reclass.classification : r.outcome === 'passed' ? null : r.failure_class || 'unknown', classSource: reclass ? reclass.healing_id : r.failure_class ? e.event_id : null,
        summary: r.failure_summary, evidence: r.evidence_ids || [], healing: r.healing_ids || [], files, missing, series: m?.series || null, role, history,
        valid: OUTCOMES.includes(r.outcome) && files.length > 0 && !missing.length, durations: { test: r.test_duration_ms, runner: r.runner_total_ms, wall: r.wall_clock_ms }, notes: r.notes || '' });
    }
  }
  // Runs journaled before automation_runs existed (schema < 1.7.0): only test_results + execution-metrics.json + run folder.
  const legacy = [];
  for (const m of metricsRuns.filter(m => !runs.some(r => r.id === m.run_id))) {
    const e = execs('automation-execution').find(x => (x.test_results || []).some(t => String(t.actual_result || '').startsWith(`[${m.run_id}]`)));
    const t = e?.test_results.find(x => String(x.actual_result || '').startsWith(`[${m.run_id}]`));
    const b = bindingOf(m.framework);
    const folder = b ? `automation-execution/results/${m.run_id}/${b.dirName}` : null;
    const outcome = m.test_status === 'passed' && m.build === 'FAILURE' ? 'harness_failed' : OUTCOMES.includes(m.test_status) ? m.test_status : null;
    const h = [...attempts].reverse().find(x => x.failed.includes(m.run_id));
    const run = { id: m.run_id, binding: b?.id || m.framework, event: e?.event_id || null, source: 'test_results + execution-metrics.json', started: null, ended: null, cases: t ? [t.test_case_id] : [],
      outcome, journalStatus: t?.status || null, failureClass: outcome === 'passed' ? null : h ? h.classification : 'unknown', classSource: h ? h.healing_id : null,
      summary: (m.error || '').split('\n')[0] || null, evidence: t?.evidence_ids || [], healing: h ? [h.healing_id] : [], files: folder ? [folder] : [], missing: folder && !c.exists(folder) ? [folder] : [],
      series: m.series || null, role: m.series_role || null, history: m.series_role && m.series_role !== 'measured' ? m.series_role : null,
      valid: !!(e && outcome && folder && c.exists(folder)), durations: { test: m.test_duration_ms, runner: m.runner_total_ms, wall: m.wall_clock_ms }, notes: '' };
    runs.push(run); legacy.push(run);
  }
  runs.sort((a, b) => (a.binding < b.binding ? -1 : a.binding > b.binding ? 1 : seq(a.id) < seq(b.id) ? -1 : 1));
  if (legacy.length) addQinc({ kind: 'runs', severity: 'info', title: `${legacy.length} early runs have no automation_runs journal entry (journaled before schema 1.7.0)`,
    sources: [...new Set(legacy.map(r => r.event).filter(Boolean)), 'automation-execution/execution-metrics.json', 'automation-execution/results/'],
    values: legacy.filter(r => r.journalStatus && r.outcome !== 'passed').map(r => `${r.id}: journal test_results ${r.journalStatus}, metrics ${metricsRuns.find(m => m.run_id === r.id).test_status}${r.outcome === 'harness_failed' ? ' + build FAILURE' : ''}`),
    shown: 'Treated as valid runs: outcome from execution-metrics.json (test status + build result), failure class from the healing attempt that investigated the run, run folder present; ordered by run ID sequence (no started_at recorded)',
    impact: `None on the latest results (later journaled runs supersede them). They are the verification runs of ${[...new Set(attempts.filter(h => legacy.some(r => r.id === h.verified_by_run_id)).map(h => h.healing_id))].join(', ') || 'no healing attempt'}.`, affects: false });
  // started_at ordering check for journaled runs
  for (const b of bindings) {
    const j = runs.filter(r => r.binding === b.id && r.started);
    const bad = j.filter((r, i) => i && r.started < j[i - 1].started);
    if (bad.length) addQinc({ kind: 'runs', title: `${b.id}: run ID order differs from started_at order`, sources: bad.map(r => r.id), shown: 'started_at order', impact: 'Latest run chosen by started_at.', affects: false });
  }

  return { qinc, warnings, runId, inRun, evOf, sources, contextReports, gate, cases: active, withdrawn, manual, manualCounts, summary, checks, manualQinc, manualExec, manualSource,
    bugs, bindings, runs, attempts, journalResultsCount: journalResults.length };
}

module.exports = { reconcile };
