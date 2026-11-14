// METRICS CALCULATION — the skill's Calculation and Reconciliation Rules, Release Recommendation Rules, Risks and
// Traceability, applied to the reconciled data. Output: ONE report data object; every visible figure is rendered from it.

const md = require('./lib/md.cjs');

const pct = (n, d) => (d ? { n, d, p: Math.round((1000 * n) / d) / 10 } : { n, d, p: null });
const SEV = ['Critical', 'High', 'Medium', 'Low'], PRIO = ['Critical', 'High', 'Medium', 'Low'];
const CLASSES = ['application', 'test_script', 'framework_defect', 'environment', 'configuration', 'test_data', 'unknown'];
const OUTS = ['passed', 'failed', 'not_run', 'harness_failed'];
const stats = xs => { const v = xs.filter(x => typeof x === 'number').sort((a, b) => a - b); if (!v.length) return null;
  const mean = v.reduce((a, b) => a + b, 0) / v.length, med = v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
  return { n: v.length, mean: Math.round(mean), median: Math.round(med), min: v[0], max: v.at(-1) }; };

function prerequisites(c, r) {
  const tcS = r.sources.find(s => s.path === 'test-design/TestCases.md');
  const list = [
    ['1', 'Task folder exists and is not the template', !!c.journal && !/templates/.test(c.taskDir), 'QFR-E01/E02'],
    ['2', 'Active workflow run (journal/workflow-run.json)', !!r.runId, 'QFR-E03'],
    ['3', 'journal/execution-log.json is valid JSON with entries', Array.isArray(c.journal?.entries), 'QFR-E04'],
    ['4', 'TestCases.md exists and is not the placeholder', !!tcS && tcS.availability === 'available', 'QFR-E05'],
    ['5', 'TEST_DESIGN_APPROVED and TEST_REVIEW_APPROVED current', r.gate('test-design') === 'current' && r.gate('test-review') === 'current', 'QFR-E06'],
    ['6', 'Prompt file declares prompt_id / prompt_version', !!(c.skill.prompt.prompt_id && c.skill.prompt.prompt_version), 'QFR-E07'],
    ['7', 'Prompt id/version not recorded with a different hash', !(c.prompts?.prompts || []).some(p => p.prompt_id === c.skill.prompt.prompt_id && p.prompt_version === c.skill.prompt.prompt_version), 'QFR-E08'],
  ];
  return list.map(([n, text, ok, code]) => ({ n, text, ok, code }));
}

function calculate(c, r, opts) {
  const tc = c.testCases, ex = c.execution;
  const active = r.cases;
  const inScope = active.filter(x => x.inExecutionScope), candidates = active.filter(x => x.needsAutomation);
  const M = r.manualCounts;

  // ---------- evidence index (journal) + withheld ----------
  const withheld = new Map(c.withheld.map(w => [w.path, w]));
  const evidence = {};
  r.inRun.forEach(e => (e.evidence || []).forEach(v => { if (v.id && !evidence[v.id]) { const p = c.taskRel(v.path); evidence[v.id] = { path: p || null, type: v.type, captured: v.capture_status, exists: p ? c.exists(p) : false, event: e.event_id, withheld: withheld.has(p) ? withheld.get(p).reason : null }; } }));

  // ---------- automation per binding ----------
  const valid = r.runs.filter(x => x.valid), results = valid.filter(x => !x.history);
  const latestFor = (b, id) => results.filter(x => x.binding === b && x.cases.includes(id)).sort((a, z) => (a.started && z.started ? (a.started < z.started ? -1 : 1) : 0)).at(-1) || null;
  // runs are pre-sorted by run-ID sequence within a binding; started_at decides between journaled runs
  const lastBySeq = (b, id) => { const xs = results.filter(x => x.binding === b && x.cases.includes(id)); return xs.length ? xs.reduce((a, z) => (z.started && a.started ? (z.started > a.started ? z : a) : xs.indexOf(z) > xs.indexOf(a) ? z : a)) : null; };
  const automation = r.bindings.map(b => {
    const latest = candidates.map(x => { const g = b.generated.find(y => y.id === x.id); const run = g ? lastBySeq(b.id, x.id) : null;
      return { case: x.id, generated: !!g, test: g ? `${g.file}${g.method && g.method !== x.title ? ` → ${g.method}` : ''}` : null, run: run?.id || null, outcome: !g ? 'not_generated' : run ? run.outcome : 'not_run_never', failureClass: run?.failureClass || null, healing: run?.healing || [], evidence: run?.evidence || [] }; });
    const hist = results.filter(x => x.binding === b.id);
    const out = Object.fromEntries(OUTS.map(o => [o, latest.filter(l => l.outcome === o).length]));
    const passing = hist.filter(x => x.outcome === 'passed');
    return { id: b.id, framework: b.framework, language: b.language, runner: b.runner, build: b.build, dir: b.dir, generationEvent: b.event,
      candidates: candidates.length, generated: b.generated.length, withLatest: latest.filter(l => l.run).length, notRun: latest.filter(l => l.generated && !l.run).length, notGenerated: latest.filter(l => !l.generated).length,
      latest, outcomes: out, coverage: pct(latest.filter(l => l.run).length, candidates.length),
      history: { runs: hist.length, ...Object.fromEntries(OUTS.map(o => [o, hist.filter(x => x.outcome === o).length])) },
      excluded: r.runs.filter(x => x.binding === b.id && (x.history || !x.valid)).map(x => ({ id: x.id, why: !x.valid ? `not valid (${x.missing.length ? 'result files missing' : 'outcome not recorded'})` : `${x.history} run: history, not a result` })),
      durations: { test: stats(passing.map(x => x.durations.test)), wall: stats(passing.map(x => x.durations.wall)) } };
  });

  // ---------- failure analysis (valid, non-history, non-passing runs) ----------
  const failures = automation.map(b => {
    const np = results.filter(x => x.binding === b.id && x.outcome !== 'passed');
    const classes = Object.fromEntries(CLASSES.map(k => [k, np.filter(x => x.failureClass === k).length]));
    const sig = {};
    np.forEach(x => { const k = `${x.failureClass}|${(x.summary || 'no summary recorded').replace(/\s+/g, ' ').slice(0, 110)}`; (sig[k] = sig[k] || { cls: x.failureClass, text: (x.summary || 'no summary recorded').replace(/\s+/g, ' ').slice(0, 220), runs: [], healing: new Set() }).runs.push(x.id); x.healing.forEach(h => sig[k].healing.add(h)); });
    return { binding: b.id, nonPassing: np.length, harness_failed: np.filter(x => x.outcome === 'harness_failed').length, not_run: np.filter(x => x.outcome === 'not_run').length,
      classes, signatures: Object.values(sig).map(s => ({ ...s, healing: [...s.healing] })), applicationUnconfirmed: np.filter(x => x.failureClass === 'application' && !(x.bugIds || []).length).map(x => x.id) };
  });

  // ---------- defects ----------
  const live = r.bugs.filter(b => !/withdrawn/i.test(b.status)), open = live.filter(b => !/closed|fixed|resolved/i.test(b.status));
  const defects = { total: live.length, open: open.length, withdrawn: r.bugs.length - live.length,
    severity: Object.fromEntries(SEV.map(s => [s, live.filter(b => b.severity === s).length])), priority: Object.fromEntries(PRIO.map(s => [s, live.filter(b => b.priority === s).length])),
    classification: [...new Set(live.map(b => b.classification))].map(k => ({ k, n: live.filter(b => b.classification === k).length })),
    confirmed: live.filter(b => /^confirmed/i.test(b.classification)).length,
    potentialUnreported: (c.exploration?.potentialBugs || []).filter(p => !r.bugs.some(b => b.related.includes(p.id))),
    potentialLinked: (c.exploration?.potentialBugs || []).filter(p => r.bugs.some(b => b.related.includes(p.id))).map(p => ({ ...p, bug: r.bugs.find(b => b.related.includes(p.id)).id })),
    unconfirmedApplication: failures.flatMap(f => f.applicationUnconfirmed) };

  // ---------- self-healing ----------
  const runById = id => r.runs.find(x => x.id === id);
  const attempts = r.attempts.map(h => { const v = runById(h.verified_by_run_id);
    const fixed = h.result === 'fixed' && v && v.valid && v.outcome === 'passed';
    return { id: h.healing_id, binding: h.binding_id, failed: h.failed, cls: h.classification, symptom: h.symptom, change: h.change, files: (h.files_changed || []).map(f => c.taskRel(f.path)),
      assertionChanged: h.assertion_changed, verify: h.verified_by_run_id || null, verifyOutcome: v ? v.outcome : null, recorded: h.result, effective: fixed ? 'fixed' : h.result === 'fixed' ? 'not_fixed' : h.result, event: h.event, inLog: (c.healingLog?.ids || []).includes(h.healing_id), notes: h.notes || '' }; });
  const investigated = [...new Set(attempts.flatMap(a => a.failed))];
  const lastAttemptFor = id => attempts.filter(a => a.failed.includes(id)).at(-1);
  const latestNonPassing = automation.flatMap(b => b.latest.filter(l => l.run && l.outcome !== 'passed').map(l => l.run));
  const unresolvedRuns = [...new Set([...investigated.filter(id => lastAttemptFor(id)?.effective !== 'fixed'), ...latestNonPassing.filter(id => !lastAttemptFor(id))])];
  const healing = { investigated: investigated.length, attempts: attempts.length, fixed: attempts.filter(a => a.effective === 'fixed').length, notFixed: attempts.filter(a => a.effective === 'not_fixed').length,
    escalated: attempts.filter(a => a.effective === 'escalated').length, notHealedApplication: attempts.filter(a => a.effective === 'not_healed_application_defect').length,
    remaining: unresolvedRuns.length, remainingRuns: unresolvedRuns, fixedWithoutVerification: attempts.filter(a => a.recorded === 'fixed' && a.effective !== 'fixed').map(a => a.id), missingInLog: attempts.filter(a => !a.inLog).map(a => a.id) };
  if (healing.fixedWithoutVerification.length) r.qinc.push({ id: `QINC-${String(r.qinc.length + 1).padStart(3, '0')}`, kind: 'healing', title: 'Healing recorded as fixed without a passing verification run', sources: healing.fixedWithoutVerification, shown: 'not fixed', impact: 'Counted as not fixed.', affects: false });

  // ---------- per-case matrix and derived QA case status ----------
  const openBugsFor = id => open.filter(b => b.cases.includes(id));
  const matrix = active.map(x => {
    const m = r.manual[x.id] || { status: 'NOT EXECUTED' }, bugs = openBugsFor(x.id);
    const auto = automation.map(b => { const l = b.latest.find(y => y.case === x.id); return { binding: b.id, outcome: l ? l.outcome : null, run: l?.run || null }; });
    const hasAuto = auto.some(a => a.run);
    let derived = 'NOT EXECUTED';
    if (bugs.length) derived = 'FAIL (defect)';
    else if (m.status === 'PASS') derived = 'PASS';
    else if (m.status === 'FAIL') derived = 'FAIL';
    else if (m.status === 'BLOCKED') derived = 'BLOCKED';
    else if (hasAuto) derived = 'AUTOMATION ONLY';
    return { id: x.id, title: x.title, type: x.type, priority: x.priority, inScope: x.inExecutionScope, outReason: x.outReason, needsAutomation: x.needsAutomation, manual: m.status, manualText: m.statusText, reason: m.reason,
      evidence: m.evidence || [], auto, bugs: bugs.map(b => ({ id: b.id, cls: b.classification })), healing: [...new Set(auto.flatMap(a => (r.runs.find(z => z.id === a.run)?.healing) || []))], derived };
  });

  // ---------- requirements and traced sources (approved traceability matrix only) ----------
  const execd = id => ['PASS', 'FAIL', 'BLOCKED'].includes(r.manual[id]?.status);
  const srcRows = tc.traceSources.map(s => { const id = md.clean(s['Source ID']), cs = md.ids(s['Test Cases'], /TC-\d{3}/g).filter(i => active.some(a => a.id === i));
    return { id, type: md.clean(s['Source Type']), description: md.clean(s.Description), cases: cs, gap: md.ids(s['Test Cases'], /CG-\d{3}/g)[0] || null,
      executed: cs.filter(execd).length, pass: cs.filter(i => r.manual[i]?.status === 'PASS').length, fail: cs.filter(i => r.manual[i]?.status === 'FAIL').length, blocked: cs.filter(i => r.manual[i]?.status === 'BLOCKED').length,
      bugs: [...new Set(cs.flatMap(i => openBugsFor(i).map(b => b.id)))] }; });
  const reqRows = srcRows.filter(s => /^PRD /.test(s.id));
  const prdIds = (c.prd?.frs || []).map(f => `PRD ${f.id}`);
  const requirements = { prdTotal: prdIds.length, inMatrix: reqRows.length, notInMatrix: prdIds.filter(i => !reqRows.some(r2 => r2.id === i)), rows: reqRows,
    covered: pct(reqRows.filter(x => x.cases.length).length, reqRows.length), executed: pct(reqRows.filter(x => x.executed).length, reqRows.length) };
  const gapNames = Object.fromEntries((tc.coverageGaps || []).map(g => [md.clean(g.ID), { category: md.clean(g.Category), item: md.clean(g.Item), followUp: md.clean(g['Follow-up required']), impact: md.clean(g['Impact (if known)']) }]));
  const traced = { total: srcRows.length, covered: pct(srcRows.filter(x => x.cases.length).length, srcRows.length), executed: pct(srcRows.filter(x => x.executed).length, srcRows.length),
    uncoveredByGap: Object.entries(srcRows.filter(x => !x.cases.length).reduce((a, x) => ((a[x.gap || 'none'] = a[x.gap || 'none'] || []).push(x.id), a), {})).map(([g, ids]) => ({ gap: g, name: gapNames[g]?.item || '', n: ids.length, ids })) };

  const notExecReasons = Object.fromEntries((ex?.notExecuted || []).map(x => [md.clean(x.Case), md.clean(x.Reason)]));
  const manual = { ...M, approved: active.length, inScope: inScope.length, coverageApproved: pct(M.executed, active.length), coverageInScope: pct(inScope.filter(x => execd(x.id)).length, inScope.length),
    passRate: pct(M.pass, M.executed), summary: r.summary, checks: r.checks, reconciled: !r.manualQinc, approval: r.manualSource?.approval || 'not performed',
    version: r.manualSource?.version || null, event: r.manualExec?.event_id || null, approvalEvent: r.manualSource?.approval_event || null,
    failedBlocked: matrix.filter(x => x.manual === 'FAIL' || x.manual === 'BLOCKED'), notExecutedList: matrix.filter(x => x.manual === 'NOT EXECUTED').map(x => ({ id: x.id, title: x.title, reason: notExecReasons[x.id] || x.outReason || 'not recorded', observed: /observed/i.test(x.manualText || '') })),
    inScopeNotExecuted: inScope.filter(x => !execd(x.id)).map(x => x.id),
    history: (ex?.revisions || []).filter(h => md.clean(h['Changed results']) && !/^(none|n\/a|—)$/i.test(md.clean(h['Changed results']))).map(h => ({ version: md.clean(h.Version), date: md.clean(h['Date (UTC)']), change: md.clean(h['Changed results']) })),
    caseIssues: (ex?.caseIssues || []).map(i => ({ id: md.clean(i.ID), case: md.clean(i.Case), type: md.clean(i.Type), description: md.clean(i.Description), resolved: /\bResolved\b/i.test(i['Recommended action'] || ''), action: md.clean(i['Recommended action']) })),
    deviations: (ex?.deviations || []).map(d => ({ id: md.clean(d.ID), case: md.clean(d.Case), deviation: md.clean(d.Deviation), performed: md.clean(d['Performed?']) })),
    environment: md.clean(md.findKey(ex?.info, /^Environment$/) || ''), build: md.clean(md.findKey(ex?.info, /Build/) || ''), browser: md.clean(md.findKey(ex?.info, /^Browser$/) || ''),
    started: md.clean(md.findKey(ex?.info, /Execution started/) || ''), ended: md.clean(md.findKey(ex?.info, /Execution ended/) || ''), reexec: md.clean(md.findKey(ex?.info, /Re-execution/) || ''), failureAnalysis: ex?.failureAnalysis || '' };

  // ---------- review findings, upstream risks, known issues ----------
  const findings = (c.review?.findings || []).map(f => ({ id: md.clean(f.ID), cls: md.clean(f.Classification), category: md.clean(f.Category), affected: md.clean(f.Affected), status: md.clean(f.Status) }));
  const openAdvisory = findings.filter(f => /advisory/i.test(f.cls) && /open/i.test(f.status));
  const openChangeRequired = findings.filter(f => /change required/i.test(f.cls) && /open/i.test(f.status));
  const upstreamRisks = [...(c.projectContext?.risks || []).map(x => ({ id: `PC ${md.clean(x.ID)}`, text: md.clean(x.Description), impact: md.clean(x['Why it matters']), source: 'context/ProjectContext.md §9' })),
    ...(c.generation?.risks || []).filter(x => /risk/i.test(md.clean(x.Type))).map(x => ({ id: md.clean(x.ID), text: md.clean(x.Description), impact: md.clean(x.Impact), source: 'automation/AutomationGeneration.md §10' }))];
  const knownIssues = [
    ...(c.bugs?.envIssues || []).map(x => ({ id: md.clean(x.Finding), text: md.clean(x.Summary), kind: 'Environment / test data (not a bug)', source: 'bugs/BugReports.md', evidence: md.ids(x.Evidence, /EVD-\d{3}/g) })),
    ...manual.caseIssues.filter(i => !i.resolved).map(i => ({ id: i.id, text: `${i.case !== '—' ? `${i.case}: ` : ''}${i.description}`, kind: `Test case issue (${i.type})`, source: 'execution/ExecutionReport.md §7', evidence: [] })),
    ...openAdvisory.map(f => ({ id: f.id, text: `${f.category.replace(/_/g, ' ')} — ${f.affected}`, kind: 'Open Advisory review finding', source: 'test-review/TestReview.md §6', evidence: [] })),
  ];

  // ---------- QA risks (QRSK: the report's own entries, deterministic order) ----------
  const risks = [];
  const R = (category, text, impact, source, basis) => risks.push({ id: `QRSK-${String(risks.length + 1).padStart(3, '0')}`, category, text, impact, source, basis });
  open.forEach(b => R(/^confirmed/i.test(b.classification) ? 'open defect' : 'open defect (suspected)', `${b.id} ${b.title} — ${b.classification}, status ${b.status}; affects ${b.cases.join(', ') || 'no case'}`,
    b.severity === 'Critical' || b.severity === 'High' ? 'High' : b.severity === 'Medium' ? 'Medium' : 'Low', b.id, `Severity ${b.severity} / priority ${b.priority} as recorded in BugReports.md`));
  automation.forEach(b => b.latest.filter(l => l.run && l.outcome !== 'passed').forEach(l => R('automation', `${b.id}: latest valid run of ${l.case} (${l.run}) is ${l.outcome.replace('_', ' ')} (${l.failureClass}); regression evidence from this binding is not reliable until resolved`, 'Medium', [l.run, ...l.healing].join(', '), 'analysis-derived: latest run not passing; application behaviour itself passed manually and in the other binding')));
  automation.forEach(b => b.latest.filter(l => l.generated && !l.run).forEach(l => R('automation', `${b.id}: ${l.case} generated but never run`, 'Medium', b.generationEvent, 'analysis-derived')));
  const outScope = active.filter(x => !x.inExecutionScope);
  if (outScope.length) R('coverage', `${outScope.length} approved cases have no established expected result (Exploratory): observed during execution, but no PASS/FAIL verdict`, 'Medium', `TestCases.md §7; ${[...new Set((tc.openQuestions || []).map(q => md.clean(q.ID)))].length} open questions (${md.clean(tc.openQuestions?.[0]?.ID || '')}–${md.clean(tc.openQuestions?.at(-1)?.ID || '')})`, 'analysis-derived: behaviour without an agreed expected result is not verified');
  if (requirements.notInMatrix.length) R('unverified requirement', `${requirements.notInMatrix.length} of ${requirements.prdTotal} PRD functional requirements are not rows of the approved traceability matrix (${requirements.notInMatrix[0]} – ${requirements.notInMatrix.at(-1)}); their coverage cannot be established from it`, 'Low', 'test-design/TestCases.md §5; prd/PRD.md §8', 'analysis-derived');
  Object.entries(gapNames).filter(([, g]) => /^yes/i.test(g.followUp)).forEach(([id, g]) => R(/environment/i.test(g.category) ? 'environment' : /data/i.test(g.category) ? 'test data' : 'coverage', `${g.item} (${g.category})`, g.impact && g.impact !== '—' ? 'Medium' : 'Low', id, g.impact && g.impact !== '—' ? `Impact recorded upstream: ${g.impact}` : 'Follow-up required = Yes upstream'));
  r.qinc.filter(q => q.affects).forEach(q => R('inconsistency', q.title, 'High', q.id, 'Unreconciled source data'));

  // ---------- release recommendation (ordered rules; first match wins) ----------
  const tcS = r.sources.find(s => s.path === 'test-design/TestCases.md'), trS = r.sources.find(s => s.path === 'test-review/TestReview.md');
  const manualOK = r.manualSource && r.manualSource.availability === 'available' && r.manualSource.approval === 'current';
  const autoCoversScope = inScope.every(x => automation.some(b => b.latest.some(l => l.case === x.id && l.outcome === 'passed')));
  const rule1 = [];
  if (!manualOK && !autoCoversScope) rule1.push({ text: 'Manual execution not performed or not approved for the in-scope cases, and no valid automation result covers them', src: r.manualSource?.path || 'execution/ExecutionReport.md' });
  if (!inScope.length || !r.checks.rowsCoverScope) rule1.push({ text: 'Coverage cannot be established (no in-scope cases, or results do not cover the approved scope)', src: 'TestCases.md / ExecutionReport.md §4' });
  [tcS, trS].filter(s => !s || s.availability !== 'available').forEach(s => rule1.push({ text: `Required artifact ${s ? s.path : 'TestCases/TestReview'} is ${s ? s.availability : 'missing'}`, src: s?.path }));
  r.qinc.filter(q => q.affects).forEach(q => rule1.push({ text: `Unreconciled: ${q.title}`, src: q.id }));
  const critCases = new Set(active.filter(x => /^(critical|high)$/i.test(x.priority)).map(x => x.id));
  const rule2 = [];
  open.filter(b => b.severity === 'Critical').forEach(b => rule2.push({ text: `${b.id} is an open Critical defect`, src: b.id }));
  open.filter(b => b.severity === 'High' && b.cases.some(i => critCases.has(i))).forEach(b => rule2.push({ text: `${b.id} is an open High defect on a High/Critical-priority case`, src: b.id }));
  matrix.filter(x => x.manual === 'FAIL' && x.bugs.length && critCases.has(x.id)).forEach(x => rule2.push({ text: `${x.id} (priority ${x.priority}) fails with ${x.bugs.map(b => b.id).join(', ')}`, src: x.id }));
  const rule3 = [];
  open.forEach(b => rule3.push({ text: `Open defect ${b.id} (${b.classification}, ${b.severity})`, src: b.id }));
  manual.inScopeNotExecuted.forEach(i => rule3.push({ text: `In-scope case ${i} not executed`, src: i }));
  manual.failedBlocked.filter(x => x.manual === 'BLOCKED').forEach(x => rule3.push({ text: `In-scope case ${x.id} BLOCKED`, src: x.id }));
  automation.forEach(b => b.latest.filter(l => l.run && l.outcome !== 'passed').forEach(l => rule3.push({ text: `Unresolved automation failure: ${b.id} ${l.case} latest run ${l.run} ${l.outcome.replace('_', ' ')}`, src: l.run })));
  if (healing.remaining) rule3.push({ text: `Open self-healing items: ${healing.remainingRuns.length} run(s) whose latest attempt is not fixed (${[...new Set(attempts.filter(a => a.effective !== 'fixed').map(a => a.id))].join(', ')})`, src: 'self-healing/healing-log.md' });
  r.sources.filter(s => s.approval === 'stale' || s.approval === 'not approved').forEach(s => rule3.push({ text: `${s.path} is ${s.approval}`, src: s.path }));
  const envLimits = Object.entries(gapNames).filter(([, g]) => /^yes/i.test(g.followUp) && /environment|data|role/i.test(g.category)).map(([id]) => id);
  if (/unavailable|not provided|shared|demo/i.test(manual.environment) || envLimits.length) rule3.push({ text: `Environment / data limitations: ${manual.environment ? `${manual.environment.split(';')[0]}; ` : ''}${envLimits.join(', ')}`, src: ['execution/ExecutionReport.md §1', ...envLimits].join(', ') });
  const advTouch = openAdvisory.filter(f => md.ids(f.affected, /TC-\d{3}/g).some(execd) || /established cases/i.test(f.affected));
  if (advTouch.length) rule3.push({ text: `Open Advisory findings touching tested cases: ${advTouch.map(f => f.id).join(', ')}`, src: 'test-review/TestReview.md §6' });
  const ruleN = rule1.length ? 1 : rule2.length ? 2 : rule3.length ? 3 : 4;
  const value = ['INSUFFICIENT EVIDENCE', 'NO-GO', 'CONDITIONAL GO', 'GO'][ruleN - 1];
  const conditions = [
    ...open.map(b => `${b.id} (${b.classification}, ${b.severity}/${b.priority}) is decided by the business or design owner: rejected as intended behaviour, or fixed with ${b.cases.join(', ') || 'its scenario'} re-executed and PASS.`),
    ...automation.flatMap(b => b.latest.filter(l => l.run && l.outcome !== 'passed').map(l => `${b.id}: ${l.healing.length ? `${l.healing.join(', ')} resolved and ` : ''}one verification run of ${l.case}${l.healing.length ? ` citing ${l.healing.join(', ')}` : ''} passes (latest: ${l.run}, ${l.outcome.replace('_', ' ')}, ${l.failureClass}).`)),
    ...manual.inScopeNotExecuted.map(i => `${i} executed with recorded evidence.`),
  ];
  const actions = [
    outScope.length ? `Decide expected results for the ${outScope.length} Exploratory cases (${md.clean(tc.openQuestions?.[0]?.ID || '')} – ${md.clean(tc.openQuestions?.at(-1)?.ID || '')}) through test-design, then execute them; or record them as accepted out-of-scope.` : null,
    knownIssues.some(k => /^TCI-/.test(k.id)) ? `Resolve open test case issues ${knownIssues.filter(k => /^TCI-/.test(k.id)).map(k => k.id).join(', ')} through test-design.` : null,
    openAdvisory.length ? `Review the open Advisory findings ${openAdvisory.map(f => f.id).join(', ')} (non-blocking).` : null,
    c.withheld.length ? `Redact the ${c.withheld.length} withheld evidence files (credential value found by a secret scan) or keep them unlinked.` : null,
    'Have a business / release owner decide release; this report is QA advice only.',
  ].filter(Boolean);
  const recommendation = { value, rule: ruleN, policy: c.prd?.acceptance ? `No project release policy: PRD §10 says "${c.prd.acceptance.replace(/\s*\(See.*$/, '')}"; platform default rules applied` : 'No project release policy found; platform default rules applied',
    rule1, rule2, rule3, supporting: [
      `Manual execution approved and current (${manual.approvalEvent}): ${M.executed}/${inScope.length} in-scope cases executed, ${M.pass} PASS, ${M.fail} FAIL, ${M.blocked} BLOCKED.`,
      `${defects.confirmed} confirmed defects; ${defects.open} open defects, all ${[...new Set(open.map(b => b.classification.split(/[ ,.]/)[0]))].join('/') || '—'}; highest severity ${SEV.find(s => defects.severity[s]) || 'none'}.`,
      ...automation.map(b => `${b.id}: ${b.latest.map(l => `${l.case} latest ${l.run || 'no run'} ${l.outcome.replace(/_never$/, '').replace('_', ' ')}`).join('; ')} (${b.history.runs} valid result runs: ${b.history.passed} passed).`),
      `All ${r.sources.filter(s => s.approval_key).length} gated sources approved and current; ${r.qinc.filter(q => q.affects).length} unreconciled inconsistencies.`,
    ], blocking: ruleN <= 2 ? (ruleN === 1 ? rule1 : rule2) : [], remaining: risks.map(x => `${x.id} ${x.text}`), conditions: ruleN === 3 ? conditions : [], actions,
    change: [
      ruleN !== 4 ? 'GO: every condition above is met, with no new open defect, unresolved automation failure, open healing item or unreconciled inconsistency.' : null,
      ruleN !== 2 ? 'NO-GO: a defect is confirmed with Critical severity, or High severity on a High/Critical-priority case, or a re-executed in-scope case fails on application behaviour.' : null,
      ruleN !== 1 ? 'INSUFFICIENT EVIDENCE: a bound source changes (its approval becomes stale) or a source contradiction affecting results appears.' : null,
    ].filter(Boolean),
    limits: [...(tc.scopeOut || []).map(s => `Out of scope: ${s}`), `${outScope.length} approved cases without an established expected result (no verdict)`, ...Object.entries(gapNames).filter(([, g]) => /^yes/i.test(g.followUp)).map(([id, g]) => `${id}: ${g.item}`)] };

  // ---------- stages overview ----------
  const stageRows = c.workflow.stages.map(s => {
    const ex2 = r.inRun.filter(e => e.event_type === 'stage_execution' && e.stage_id === s.id), last = ex2.at(-1);
    const srcs = r.sources.filter(x => x.stage === s.id);
    const main = srcs[0];
    return { id: s.id, order: s.order, key: s.approval_key, executions: ex2.length, lastEvent: last?.event_id || null, lastStatus: last?.status || null, skill: last ? `${last.skill_name}${/^\d/.test(last.skill_version || '') ? ` v${last.skill_version}` : ''}` : null,
      performed: ex2.length > 0, adHoc: ex2.filter(e => /without a skill/i.test(e.skill_name || '')).map(e => e.event_id), artifact: main?.path || null, version: main?.version || null, sha: main?.sha256 || null, approval: s.approval_key ? (main?.approval || 'not approved') : 'no gate', approvalEvent: main?.approval_event || null };
  });

  // ---------- traceability chains ----------
  const chains = {
    requirements: reqRows.map(x => ({ req: x.id, cases: x.cases, executed: x.executed, pass: x.pass, bugs: x.bugs })),
    manual: matrix.filter(x => x.bugs.length || x.manual !== 'PASS' && x.manual !== 'NOT EXECUTED').map(x => ({ case: x.id, manual: x.manual, evidence: x.evidence, bugs: x.bugs.map(b => b.id) })),
    automation: automation.flatMap(b => b.latest.map(l => ({ case: l.case, binding: b.id, test: l.test, run: l.run, outcome: l.outcome, evidence: l.evidence }))),
    healing: attempts.map(a => ({ failed: a.failed, healing: a.id, verify: a.verify, outcome: a.verifyOutcome, result: a.effective })),
  };

  return { prerequisites: prerequisites(c, r), scope: { approved: active.length, inScope: inScope.length, outOfScope: active.length - inScope.length, candidates: candidates.length, candidateIds: candidates.map(x => x.id), withdrawn: r.withdrawn.map(x => x.id) },
    manual, automation, failures, defects, healing, attempts, matrix, requirements, traced, findings, openAdvisory, openChangeRequired, upstreamRisks, knownIssues, risks, recommendation, stages: stageRows, chains, evidence };
}

module.exports = { calculate, pct };
