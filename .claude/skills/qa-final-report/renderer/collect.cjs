// DATA COLLECTION — reads one task's recorded artifacts (read only) and returns them in raw, parsed form.
// No judgement happens here: availability, currency, reconciliation and metrics are decided in reconcile.cjs / metrics.cjs.
// Every file read is hashed (raw and LF-normalized) so the run can prove it changed nothing (QFR-V14).

const fs = require('fs'), path = require('path'), crypto = require('crypto');
const md = require('./lib/md.cjs');

const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const PLACEHOLDER = 'AI-QA-PLATFORM:PLACEHOLDER';

function store(taskDir) {
  const cache = {};
  return function read(rel) {
    if (cache[rel]) return cache[rel];
    const abs = path.join(taskDir, rel);
    let f = { rel, exists: false };
    try {
      const b = fs.readFileSync(abs);
      const text = b.toString('utf8').replace(/^﻿/, '');
      f = { rel, exists: true, size: b.length, rawHash: sha(b), lfHash: sha(Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n'))), text, placeholder: text.includes(PLACEHOLDER) };
    } catch (e) { if (e.code !== 'ENOENT') f.error = e.message; }
    return (cache[rel] = f);
  };
}

const json = f => { if (!f.exists) return null; try { return JSON.parse(f.text); } catch (e) { f.unreadable = e.message; return null; } };
const exists = (taskDir, rel) => fs.existsSync(path.join(taskDir, rel));

// Strip the "platform/tasks/<task>/" prefix journal paths sometimes carry.
const taskRel = (p, taskId) => String(p || '').replace(/\\/g, '/').replace(new RegExp(`^platform/tasks/${taskId}/`), '');

function testCases(f) {
  const t = f.text;
  if (!t) return null;
  const blocks = Object.fromEntries(md.sections(t, /^(TC-\d+)\s+—\s+(.*)$/, 3).map(s => [s.match[1], { title: s.match[2], fields: md.kv(md.firstTable(s.body)) }]));
  const traceSec = md.section(t, /Source → Test Cases/);
  const trace = md.tables(traceSec);
  return {
    info: md.kv(md.firstTable(md.section(t, /Test Design Information/))),
    index: md.objects(md.firstTable(md.section(t, /^Index$/), x => x.header[0] === 'ID')),
    blocks,
    traceSources: md.objects(trace[0]),
    traceUncovered: md.objects(trace[1]),
    exploratory: md.objects(md.firstTable(md.section(t, /Exploratory Cases/))),
    openQuestions: md.objects(md.firstTable(md.section(t, /^\d+\.\s*Open Questions/))),
    coverageGaps: md.objects(md.firstTable(md.section(t, /Coverage Gaps/))),
    summary: md.kv(md.firstTable(md.section(t, /Coverage Summary/))),
    revisions: md.objects(md.firstTable(md.section(t, /Revision History/))),
    scopeIn: bullets(md.section(t, /^In scope$/)), scopeOut: bullets(md.section(t, /^Out of scope$/)),
  };
}
const bullets = s => (s || '').split(/\r?\n/).filter(l => /^\s*[-*]\s+/.test(l)).map(l => md.clean(l.replace(/^\s*[-*]\s+/, '')));

function csvRows(text) {
  if (!text) return [];
  const rows = [], re = /("([^"]|"")*"|[^,\r\n]*)(,|\r?\n|$)/g;
  let row = [], m;
  while ((m = re.exec(text)) && m[0] !== '') {
    let v = m[1];
    if (v.startsWith('"')) v = v.slice(1, -1).replace(/""/g, '"');
    row.push(v);
    if (m[3] !== ',') { rows.push(row); row = []; }
  }
  const [head, ...body] = rows;
  return body.filter(r => r.length > 1).map(r => Object.fromEntries(head.map((h, i) => [h.trim().toLowerCase(), r[i]])));
}

function execution(f) {
  const t = f.text;
  if (!t) return null;
  return {
    info: md.kv(md.firstTable(md.section(t, /Execution Information/))),
    revisions: md.objects(md.firstTable(md.section(t, /Revision History/))),
    notExecuted: md.objects(md.firstTable(md.section(t, /^Not executed$/))),
    summary: md.kv(md.firstTable(md.section(t, /Execution Summary/))),
    perCase: md.objects(md.firstTable(md.section(t, /Per-Case Results/), x => x.header[0] === 'ID')),
    failureAnalysis: md.para(md.section(t, /Failure Analysis/)),
    blocked: md.para(md.section(t, /Blocked Cases/)),
    caseIssues: md.objects(md.firstTable(md.section(t, /Test Case Issues/))),
    deviations: md.objects(md.firstTable(md.section(t, /^Deviations$/))),
    bugsRaised: md.objects(md.firstTable(md.section(t, /Bugs Raised/))),
  };
}

function bugs(f) {
  const t = f.text;
  if (!t) return null;
  const one = s => {
    const sub = re => md.clean(md.para(md.section(s.body, re)));
    return { id: s.match[1], title: sub(/^Title$/), classification: sub(/^Classification$/), severity: sub(/^Severity$/), priority: sub(/^Priority$/),
      affected: md.section(s.body, /^Affected Test Cases$/) || '', evidence: md.section(s.body, /^Evidence$/) || '', status: sub(/^Status$/), traceability: sub(/^Traceability$/) };
  };
  return {
    info: md.kv(md.firstTable(t, x => x.header[0] === 'Field')),
    index: md.objects(md.firstTable(md.section(t, /^Index$/))),
    details: md.sections(t, /^(BUG-\d+)$/, 2).map(one),
    envIssues: md.objects(md.firstTable(md.section(t, /not application bugs/i))),
  };
}

function workflow(text) {
  // Light reader for the workflow YAML: stage id, order, approval key, outputs.
  const stages = [];
  (text || '').split(/\r?\n(?=  - id: )/).forEach(chunk => {
    const id = /^  - id:\s*([\w-]+)/m.exec(chunk);
    if (!id) return;
    const order = /^\s+order:\s*(\d+)/m.exec(chunk), key = /approval_key:\s*([A-Z_]+|null)/.exec(chunk), status = /^\s+status:\s*([\w-]+)/m.exec(chunk);
    stages.push({ id: id[1], order: order ? +order[1] : null, approval_key: key && key[1] !== 'null' ? key[1] : null, status: status ? status[1] : null });
  });
  const ver = /^\s*version:\s*"?([\d.]+)"?/m.exec(text || '');
  return { version: ver ? ver[1] : null, stages: stages.filter(s => s.order != null).sort((a, b) => a.order - b.order) };
}

function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text || '');
  return m ? Object.fromEntries(m[1].split(/\r?\n/).map(l => /^(\w+):\s*(.*)$/.exec(l)).filter(Boolean).map(x => [x[1], x[2].replace(/^["']|["']$/g, '')])) : {};
}

// Paths that an upstream report or the journal marks as withheld (secret found); they are listed, never linked.
function withheld(taskDir, read, journal, taskId) {
  const out = [];
  const walk = d => { let es = []; try { es = fs.readdirSync(path.join(taskDir, d), { withFileTypes: true }); } catch { return; }
    es.forEach(e => { const r = `${d}/${e.name}`; if (e.isDirectory()) walk(r); else if (/\.json$/.test(e.name)) { const j = json(read(r)); (j && Array.isArray(j.withheld_evidence) ? j.withheld_evidence : []).forEach(w => (w.files || []).forEach(p => out.push({ path: taskRel(p, taskId), reason: w.reason, source: r }))); } }); };
  walk('reports');
  (journal?.entries || []).forEach(e => (e.evidence || []).forEach(v => { if (/withheld|contains (a )?(secret|credential)/i.test(v.notes || '')) out.push({ path: taskRel(v.path, taskId), reason: v.notes, source: `journal ${e.event_id}` }); }));
  return out;
}

function collect(repoRoot, taskName) {
  const taskDir = path.join(repoRoot, 'platform', 'tasks', taskName);
  const read = store(taskDir);
  const repoRead = store(repoRoot);
  const journalF = read('journal/execution-log.json');
  const journal = json(journalF);
  const tc = read('test-design/TestCases.md'), ex = read('execution/ExecutionReport.md'), bg = read('bugs/BugReports.md');
  const gen = read('automation/AutomationGeneration.md'), heal = read('self-healing/healing-log.md');
  const exp = read('exploration/ExplorationReport.md'), pc = read('context/ProjectContext.md'), prd = read('prd/PRD.md');
  const tr = read('test-review/TestReview.md'), tctx = read('context/TaskContext.md');
  const metricsF = read('automation-execution/execution-metrics.json');
  const skillF = repoRead('.claude/skills/qa-final-report/SKILL.md'), promptF = repoRead('.claude/prompts/qa-final-report.md');
  const skillVer = /Skill version\s*\|\s*`?([\d.]+)/.exec(skillF.text || '');
  return {
    repoRoot, taskDir, taskName, read, exists: rel => exists(taskDir, rel), taskRel: p => taskRel(p, taskName),
    skill: { id: 'qa-final-report', version: skillVer ? skillVer[1] : null, prompt: frontmatter(promptF.text) },
    workflow: workflow(repoRead('platform/workflows/default-qa-workflow.yaml').text),
    journalF, journal,
    workflowRun: json(read('journal/workflow-run.json')),
    prompts: json(read('journal/prompts.json')),
    taskContext: tctx.exists ? { identity: md.kv(md.firstTable(md.section(tctx.text, /Identity/))), entry: md.kv(md.firstTable(md.section(tctx.text, /Entry Points/))) } : null,
    prd: prd.exists ? { info: md.kv(md.firstTable(md.section(prd.text, /Document Information/))), frs: md.sections(prd.text, /^(FR-\d+)$/, 3).map(s => ({ id: s.match[1], text: md.clean(md.para(s.body)) })),
      acceptance: md.clean(md.para(md.section(prd.text, /Acceptance Criteria/))) } : null,
    projectContext: pc.exists ? { risks: md.objects(md.firstTable(md.section(pc.text, /^\d+\.\s*Risks$/))), scopeIn: md.section(pc.text, /^In Scope$/), scopeOut: md.section(pc.text, /^Explicitly Out of Scope$/) } : null,
    exploration: exp.exists ? { info: md.kv(md.firstTable(md.section(exp.text, /Exploration Information/))), environment: md.kv(md.firstTable(md.section(exp.text, /^\d+\.\s*Environment$/))),
      potentialBugs: md.sections(exp.text, /^(PB-\d+)\b.*?—\s*(.*)$/, 3).map(s => ({ id: s.match[1], title: s.match[2] })) } : null,
    testCases: testCases(tc), testCasesCsv: csvRows(read('test-design/TestCases.csv').text),
    review: tr.exists ? { info: md.kv(md.firstTable(md.section(tr.text, /Review Information/))), findings: md.objects(md.firstTable(md.section(md.section(tr.text, /^\d+\.\s*Findings$/), /^Index$/))) } : null,
    execution: execution(ex), bugs: bugs(bg),
    generation: gen.exists ? { info: md.kv(md.firstTable(md.section(gen.text, /Generation Information/))), scope: md.objects(md.firstTable(md.section(gen.text, /^\d+\.\s*Scope$/))),
      risks: md.objects(md.firstTable(md.section(gen.text, /Risks, Assumptions/))) } : null,
    metrics: json(metricsF),
    healingLog: heal.exists ? { ids: md.ids(heal.text, /\b[EH]-\d{3}\b/g) } : null,
    withheld: withheld(taskDir, read, journal, taskName),
  };
}

module.exports = { collect, sha };
