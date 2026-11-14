---
name: qa-final-report
description: QA Final Report stage of the AI QA Platform, the last QA stage (after automation-execution and the conditional self-healing loop). Read-only analysis that discovers, validates and consolidates the outputs of every earlier stage of one task (PRD, ProjectContext, ExplorationReport, approved TestCases, TestReview, manual ExecutionReport and BugReports, AutomationGeneration, automation runs and execution-metrics.json, healing-log.md, evidence and the journal) into one evidence-based final QA report with a QA release recommendation (GO, CONDITIONAL GO, NO-GO or INSUFFICIENT EVIDENCE). Writes platform/tasks/<task-name>/reports/QA-Final-Report.md and reports/QA-Final-Report.html with equivalent content, never modifies an upstream artifact, result or approval, and then HARD STOPS until the exact standalone key QA_FINAL_REPORT_APPROVED. Use when asked to "write the final QA report", "summarize the QA results", "is it ready for release from a QA perspective", or "revise the final QA report".
---

# QA Final Report

## Stage Identity

| Field | Value |
|---|---|
| Skill | `qa-final-report` |
| Skill version | `1.0.0` |
| stage_id | `qa-final-report` (ordering is owned by the workflow, not this skill) |
| Stage name | QA Final Report |
| Prompt | `.claude/prompts/qa-final-report.md` (not published in this repository). `prompt_id: qa-final-report`, `prompt_version: 1.0.0` |
| Output structure | [`QA-Final-Report.template.md`](QA-Final-Report.template.md) (Markdown), [`qa-final-report-html.structure.md`](qa-final-report-html.structure.md) (HTML) |
| Journal event template | [`journal-event.template.json`](journal-event.template.json) |
| Journal schemas | [`journal-event.schema.json`](../../../platform/schemas/journal-event.schema.json) (v1.8.0: `final_report`), [`prompt-record.schema.json`](../../../platform/schemas/prompt-record.schema.json), [`workflow-run.schema.json`](../../../platform/schemas/workflow-run.schema.json) |
| Upstream | Every earlier stage. Required: `test-review` (`TEST_REVIEW_APPROVED`, current) on top of the approved design chain. Read when performed: `manual-execution`, `automation-generation`, `automation-execution`, `self-healing`. |
| Downstream | None among the QA stages. The planned `reporting` stage (deliverable packaging, HTML journal) may consume the approved report. |
| Approval key | `QA_FINAL_REPORT_APPROVED` |
| MCP | **Not used.** The report is built from recorded artifacts only. |

```
approved design chain (PRD → ProjectContext → Exploration → TestCases → TestReview, all current)
  + manual execution (ExecutionReport, BugReports, evidence)            ─┐
  + automation (AutomationGeneration, runs, execution-metrics.json)      ├─ whatever was performed
  + self-healing (healing-log.md, healing_attempts, verification runs)   ─┘
  + journal (approvals, hashes, run IDs)
        ↓  discover → bind (path, version, SHA-256, approval) → reconcile → calculate → classify → recommend
   reports/QA-Final-Report.md  +  reports/QA-Final-Report.html   (same report data, 11 sections)
        ↓
   ⛔ HARD STOP → HUMAN REVIEW → QA_FINAL_REPORT_APPROVED
```

## Purpose

Answer, from recorded evidence only: what was tested and what was not; how much
of the approved scope was covered; how many cases passed, failed, were blocked or
were not executed; which defects were found; which failures were application
defects and which were caused by automation, framework, configuration,
environment or test data; what self-healing resolved and what remains open; what
the QA risks are; and whether QA evidence supports release within the tested
scope.

This is a **reporting** stage. It never executes tests, opens a browser, uses
Playwright MCP, changes test code, heals, raises or edits bugs, or changes any
result or approval. A QA release recommendation is **not** a business or
production release approval.

## Separation of concerns

| Concept | For this stage |
|---|---|
| **Skill** (this file) | *How* sources are discovered, bound, reconciled, calculated, classified, recommended, rendered, validated, gated and journaled. |
| **Prompt** (`.claude/prompts/qa-final-report.md`) | The versioned *instruction*, recorded by id and version with its text in `prompts.json`. |
| **Workflow** (`default-qa-workflow.yaml`) | *When* the stage runs, and that `QA_FINAL_REPORT_APPROVED` closes the QA workflow. |
| **Journal** (`journal/*.json`) | *What happened*: the bound sources, metrics, inconsistencies, recommendation, validation and gate replies. |
| **Artifacts** | `reports/QA-Final-Report.md` and `reports/QA-Final-Report.html`. Nothing else is written. |
| **Upstream artifacts** | Authoritative for their own data. Read only. |

## Trigger Conditions

Run when a human, or the orchestration layer, asks for the final QA report (or a
revision of it) of a **named task**. If no task is named, ask. Never guess a
task. The skill never starts itself and never starts another stage.

Typical moment: after `automation-execution` (and any `self-healing` loop) has
stopped. The stage may also run earlier, e.g. when automation is not part of the
task; stages that were not performed are reported as **Not performed**, never
inferred.

## Prerequisites

Check all of these, in order, before analyzing anything:

| # | Prerequisite | Failure |
|---|---|---|
| 1 | `platform/tasks/<task-name>/` exists and is not under `platform/templates/` | `QFR-E01` / `QFR-E02` |
| 2 | `journal/workflow-run.json` → `active_run_id` is non-null. It is owned by orchestration; this skill never creates it | `QFR-E03` |
| 3 | `journal/execution-log.json` exists and is valid JSON with an `entries` array | `QFR-E04` |
| 4 | `test-design/TestCases.md` exists and is not the template placeholder | `QFR-E05` |
| 5 | `TEST_DESIGN_APPROVED` and `TEST_REVIEW_APPROVED` exist in the active run and are **current** (each approval's post-approval hash equals the current file, no later `stage_execution` of that stage, and the review binding S1–S5 of the `test-review` skill holds) | `QFR-E06` |
| 6 | The prompt file exists and declares `prompt_id` / `prompt_version` | `QFR-E07` |
| 7 | The prompt id and version are not already recorded in `prompts.json` with a different SHA-256 | `QFR-E08` |

Prerequisite 5 exists because the approved, reviewed `TestCases.md` is the
denominator of every coverage figure. Without it there is no approved scope to
report against.

If any prerequisite fails: write no report, append a `stage_execution` event with
`status: blocked` (MCP not used), report the exact failure and the report
sections it would have affected, and STOP.

Everything else is **optional**. A missing optional artifact never blocks the
stage: it is listed in §2 and §9 of the report, recorded as a warning
(`QFR-W01`), and weighed by the recommendation rules.

## Inputs

All paths are relative to `platform/tasks/<task-name>/`. They are the paths the
workflow declares; [Artifact Discovery](#artifact-discovery) decides which files
are actually used.

| Input | Default path | Producing stage | Use |
|---|---|---|---|
| Task identity | `context/TaskContext.md` § Identity | orchestration | Project name, application, task ID |
| PRD | `prd/PRD.md` | `prd-generation` | Requirement IDs (`PRD FR-###` etc.), scope, release criteria if documented |
| ProjectContext | `context/ProjectContext.md` | `project-context` | Scope and boundaries, out of scope, `PC BR/EB/RK/DEP/GAP/OQ-###` |
| ExplorationReport | `exploration/ExplorationReport.md`, `exploration/evidence/` | `exploration` | Observations, POTENTIAL BUGs (`PB-###`), coverage limits, environment |
| TestCases | `test-design/TestCases.md` (+ `TestCases.csv` if present) | `test-design` | **Approved scope**: active cases, Valid in Scope, Needs Automation, traceability matrix, coverage gaps (`CG-###`) |
| TestReview | `test-review/TestReview.md` | `test-review` | Binding, findings (open Advisory, resolved Change Required) |
| ExecutionReport | `execution/ExecutionReport.md`, `execution/evidence/` | `manual-execution` | Manual per-case results, failure analysis, blocked cases, test case issues, deviations |
| BugReports | `bugs/BugReports.md` | `manual-execution` | Defects: ID, title, severity, priority, affected cases, evidence, status |
| AutomationGeneration | `automation/AutomationGeneration.md`, `automation/<project-dir>/` | `automation-generation` | Bindings, candidates, generated tests, case mapping, static validation |
| Automation runs | `automation-execution/results/<run-id>/<project-dir>/`, `automation-execution/execution-metrics.json`, `automation-execution/<project-dir>/automation-report.html` | `automation-execution` | Per-run outcome, failure class, durations, evidence |
| Healing log | `self-healing/healing-log.md` | `self-healing` | Attempts, classifications, changes, verification runs, results, escalations |
| Journal | `journal/execution-log.json`, `journal/prompts.json`, `journal/workflow-run.json` | all stages | Approvals and their currency, producing events, hashes, `automation_runs`, `healing_attempts`, evidence IDs |
| Other reports | `reports/**` | `reporting` / ad-hoc | **Context only**. Never a source of results (they are derived, not authoritative) |
| Previous report | `reports/QA-Final-Report.md`, `.html` | this stage | Revisions only: report version, revision history, risk and inconsistency IDs |
| Prompt | `.claude/prompts/qa-final-report.md` | — | Loaded, hashed and recorded |

## Outputs

| Kind | Path | Notes |
|---|---|---|
| **Report (Markdown)** | `reports/QA-Final-Report.md` | Structure: [`QA-Final-Report.template.md`](QA-Final-Report.template.md). GitHub / Azure DevOps friendly. |
| **Report (HTML)** | `reports/QA-Final-Report.html` | Structure: [`qa-final-report-html.structure.md`](qa-final-report-html.structure.md). One self-contained file. |
| Journal | `journal/execution-log.json`, `journal/prompts.json` | Events and the prompt snapshot. |

Both files are created on attempt 1 and **updated in place** on every later attempt
(workflow `approval_policy.revisions: update_artifact_in_place`): no `-v2`,
`-final` or dated copies. History is kept by the report's Revision History table
and by the journal, which records each version's SHA-256.

A `reports/QA-Final-Report.*` file without a journaled `qa-final-report` origin is
never overwritten (`QFR-E09`).

**Nothing else is created or modified.** In particular PRD.md, ProjectContext.md,
ExplorationReport.md, TestCases.md, TestReview.md, ExecutionReport.md,
BugReports.md, AutomationGeneration.md, automation code, execution-metrics.json,
run folders and logs, evidence, healing-log.md, approvals, TaskContext.md,
`workflow-run.json` and the template are never written.

## Responsibilities

- **Discover** the artifacts the task actually has, and record for each: path,
  version, SHA-256, producing event, approval event and whether the approval is
  current, or that it is missing / not performed.
- **Bind** the report to exactly those versions (the `final_report.sources` block
  and the report's §11).
- **Calculate** manual, automation, defect and healing metrics with the
  [Calculation and Reconciliation Rules](#calculation-and-reconciliation-rules).
- **Reconcile** sources and record every contradiction as an inconsistency
  (`QINC-###`) with its impact, instead of choosing silently.
- **Classify** automation failures with the source classifications only.
- **Assess** risks (`QRSK-###`), each with its source or labeled analysis-derived.
- **Recommend** with the [Release Recommendation Rules](#release-recommendation-rules).
- **Render** both formats from one report data object, so they cannot diverge.
- **Validate**, gate and journal.

## Non-Responsibilities

This stage never does any of the following:

- Execute or re-run tests, open a browser or use Playwright MCP.
- Edit, add or remove test cases, results, bugs, automation code, run outputs,
  metrics, logs, evidence or the healing log; change a severity, priority, bug
  status, failure class or approval.
- Raise a new bug, confirm a POTENTIAL BUG, or turn an automation failure into a
  defect. An application-class automation failure without a bug report is listed
  as **unconfirmed** and sent to the human for the bug process.
- Heal, or decide that a healing attempt succeeded.
- Redact or rewrite upstream evidence. Evidence that is flagged as containing a
  secret is not linked (see [Security](#security-and-secret-handling)).
- Create a `workflow_run_id`, or start any stage.
- Approve a release. The recommendation is QA advice within the tested scope.

## Artifact Discovery

The workflow paths are the default, not an assumption that every task has every
file. Resolve each input in this order and record which rule found it:

1. **Journal:** the latest `stage_execution` of the producing stage in the active
   run, and its `output_artifacts[].path` (for runs: `automation_runs[].result_files`
   and `evidence[].path`). The journal is the authority on where a stage wrote.
2. **Workflow:** the stage's `outputs` in `platform/workflows/default-qa-workflow.yaml`.
3. **Search:** a file with the expected name elsewhere inside the task folder only.
   It is used only if exactly one match exists, and is recorded with
   `discovered_by: search` and a warning (`QFR-W02`), because no stage claims it.

Then classify each input:

| Availability | Meaning | Report wording |
|---|---|---|
| `available` | Exists, readable, not a placeholder | — |
| `placeholder` | Carries the `<!-- AI-QA-PLATFORM:PLACEHOLDER … -->` marker | Treated as absent |
| `not_performed` | No `stage_execution` of the producing stage exists in the run | **Not performed** |
| `missing` | The journal says it was written, but the file is gone | **Evidence Not Available** + inconsistency |
| `unreadable` | Exists but cannot be parsed | **Evidence Not Available**; a required input → hard stop |

**Absence is never a result.** No ExecutionReport means *manual execution not
performed*, not "nothing failed". A placeholder BugReports.md means *no defects*
only when an approved, current ExecutionReport records `Bugs raised = 0`;
otherwise the defect status is **Evidence Not Available**.

## Source-of-Truth Rules

| Data | Authoritative source | Never taken from |
|---|---|---|
| Approved scope (cases, flags, traceability) | Approved, current `TestCases.md` | ExecutionReport, automation code |
| Manual result per case | Approved, current `ExecutionReport.md` §4 (cross-checked with its `stage_execution.test_results`) | BugReports, automation runs |
| Defect identity, severity, priority, status | `BugReports.md` | Failure counts, automation runs |
| Automation candidates and generated tests | `AutomationGeneration.md` §2 / §4 and its journal `automated_cases` | Run results |
| Automation run outcome and failure class | The run's `automation_runs` journal entry, cross-checked with its machine-readable result file | `automation-report.html`, other reports |
| Run metrics (durations) | `execution-metrics.json` | Hand-typed values |
| Healing result | `healing_attempts[].result` **and** the verification run's outcome | The healing log's prose alone |
| Approval state | `approval_decision` events and their post-approval hashes | Status lines inside documents |

Rules:

1. Each upstream artifact stays authoritative for its own data. The report quotes,
   counts and links; it never re-judges a result.
2. Use the latest **valid** artifact and result: approved and current where the
   stage has a gate; for automation, the [latest valid run](#automation-execution).
3. Verify versions, approvals and hashes, and record them.
4. Never overwrite a source result with an inferred one.
5. Never assume PASS because no bug exists, or because a test was generated.
6. Never treat a failed automation assertion as an application defect without a
   bug report or an `application` failure class backed by evidence.
7. Never resolve a contradiction silently: record a `QINC-###` (sources, both
   values, which value the report shows and why, impact on sections and on the
   recommendation).
8. Every important conclusion cites its evidence (artifact section, event ID,
   run ID, `EVD-###`, `BUG-###`, `H-###`). If none exists, write
   **Evidence Not Available**.

**Hash comparison:** compare raw SHA-256 first. If it differs, compare the SHA-256
of the LF-normalized text. Equal normalized hashes mean a line-ending-only
difference (e.g. a Git `core.autocrlf` checkout): the artifact is treated as
unchanged, and the difference is recorded once as an informational `QINC-###`.
Different normalized hashes mean the artifact changed: the approval is stale.

## Calculation and Reconciliation Rules

Every count below is a count of **test case IDs** unless stated otherwise. Every
percentage is shown as `numerator / denominator (x.x %)`, names both, and is
`N/A — no denominator` when the denominator is 0 or the data is incomplete.
No metric is calculated from missing or unreconciled data.

### Approved scope

| Metric | Definition |
|---|---|
| Approved (active) | Active cases in the approved, current TestCases.md (withdrawn cases excluded and listed) |
| In execution scope | Approved with `Valid in Scope = TRUE` and an established expected result |
| Out of execution scope | Approved minus in execution scope, with the reason per case (`CG-###`, Exploratory / `TQ-###`) |
| Automation candidates | Approved with `Needs Automation = TRUE` |

### Manual execution

From the approved, current ExecutionReport (latest version):

```
Executed = PASS + FAIL + BLOCKED
Approved = Executed + NOT_EXECUTED
```

- Counts come from the §4 per-case rows. The §3 summary and the journal
  `test_results` are cross-checked against them; any difference is a `QINC-###`,
  and the metric is shown as **unreconciled** with both values.
- A case appears once, with its latest recorded status. Earlier statuses from
  revisions are history (ExecutionReport Revision History), not extra cases.
- Coverage: `Executed / Approved` and `Executed / In execution scope`.
- An ExecutionReport that is not approved, or whose approval is stale, is shown
  as **Draft / stale**, its figures are labeled unapproved, and the recommendation
  cannot be GO.

### Automation execution

Per **binding** (e.g. `playwright-ts`, `shaft-java-testng`), never combined:

- **Valid run:** journaled in an `automation-execution` `automation_runs` entry,
  outcome one of `passed | failed | not_run | harness_failed`, result files
  present. A run designated in the journal or metrics as a warm-up, benchmark-only
  or demonstration run is history, not a result: it is listed, not used as the
  latest result.
- **Latest valid run per case and binding:** the valid run with the latest
  `started_at` that included the case. After a healing change, this is the
  verification run (it cites the healing ID).
- **Case status per binding** comes from that run: `passed`, `failed`, `not_run`,
  `harness_failed` (never counted as passed), or `Not generated` / `Not run`.
- **Run history** (all valid runs, with outcome counts) is reported separately and
  never added to case counts. A case run in two bindings, or ten times, is still
  one case per binding.
- Generated is not executed: `Generated tests` and `Executed tests` are separate
  rows, and a generated test with no valid run is **Not run**.
- Coverage: `Cases with a latest valid run / Automation candidates`, per binding.
- Durations: only from `execution-metrics.json` / runner output; mean and median
  of passing runs; no conclusion from one sample.

### Overall view

Manual and automation statistics stay separate; their totals are **never added**.
The report may add a per-case matrix (manual status | automation status per
binding | linked bugs | healing IDs) and a derived **QA case status** with this
rule, which the report states verbatim:

| Derived status | When |
|---|---|
| `FAIL (defect)` | A non-withdrawn bug in BugReports.md lists the case and is not closed |
| `PASS` | Latest approved manual result is PASS and no open bug lists the case (automation failures with a non-application class are shown as automation risk, not as a product failure) |
| `FAIL` | Latest approved manual result is FAIL and no bug explains it (test case issue, data, environment): see failure analysis |
| `BLOCKED` | Latest approved manual result is BLOCKED |
| `AUTOMATION ONLY` | No manual result, latest automation result exists: shown per binding, not merged |
| `NOT EXECUTED` | No manual result and no valid automation run |

If the sources cannot be reconciled for a case, its derived status is
`UNRECONCILED` with the `QINC-###`.

### Defects

- Total = distinct `BUG-###` in BugReports.md. Withdrawn bugs are listed and not
  counted. Automation `bug_ids` refer to the same IDs: a bug seen by manual and
  automation execution is **one** defect with two detection stages.
- Severity counts and priority counts are separate tables. A bug is never placed
  in a combined severity/priority bucket.
- Status as recorded (e.g. Open, Suspected, Fixed, Closed). The report never
  upgrades a status (a "Suspected" bug stays suspected).
- An `application`-class automation failure without a `BUG-###` is listed under
  §6 as **unconfirmed application failure**, not as a defect.
- Exploration POTENTIAL BUGs (`PB-###`) without a bug report are risks, not defects.

### Automation failure analysis

Counts per source failure class (`application`, `test_script`, `framework_defect`,
`environment`, `configuration`, `test_data`, `unknown`) and per outcome
(`harness_failed`, `not_run`), over **valid non-passing runs**, per binding. The
class is copied from the run's journal entry (or the latest healing attempt that
re-classified it, cited). Percentages use the binding's non-passing valid runs as
denominator. Unclassified runs are counted as `unknown` with
**Evidence Not Available**.

### Self-healing

From `healing_attempts` (journal) cross-checked with `healing-log.md`:

| Metric | Definition |
|---|---|
| Investigated failures | Distinct failed run IDs with at least one attempt |
| Attempts | Attempt entries (`E-###` / `H-###`) |
| Fixed | `result: fixed` **and** `verified_by_run_id` is a valid run with outcome `passed` |
| Not fixed | `result: not_fixed`, or `fixed` without a passing verification run (the latter is also a `QINC-###`) |
| Escalated | `result: escalated` |
| Not healed (application) | `result: not_healed_application_defect` |
| Remaining unresolved | Investigated failures whose latest attempt is not `fixed`, plus non-passing latest runs with no attempt |

## Release Recommendation Rules

The report gives exactly one recommendation. Apply the rules **in order**; the
first that applies decides. If the task or project has an approved release policy
(PRD, ProjectContext or TaskContext, cited), that policy takes precedence and the
report quotes it.

| # | Recommendation | Applies when |
|---|---|---|
| 1 | **INSUFFICIENT EVIDENCE** | Manual execution was not performed or not approved for the in-scope cases and no valid automation result covers them; or coverage cannot be established; or a required artifact is missing or unreadable; or an unreconciled `QINC-###` affects a result the recommendation depends on |
| 2 | **NO-GO** | An open defect with severity Critical exists in the tested scope; or an open High-severity defect affects a case or requirement the approved sources mark as critical / high priority; or evidence shows important functionality failing |
| 3 | **CONDITIONAL GO** | None of the above, but at least one remains: an open defect (any severity, including Suspected); an in-scope case BLOCKED or NOT EXECUTED; an unresolved automation failure; open self-healing items; a stale or unapproved upstream artifact that does not affect results; environment or data limitations; open Advisory findings that touch tested cases |
| 4 | **GO** | None of the above: all in-scope cases executed with recorded evidence, no open defects, no unresolved inconsistencies, no unresolved critical risk |

Rules that always hold:

- A high pass percentage alone never justifies GO.
- Blocked, unexecuted and out-of-scope cases, missing evidence and scope limits
  are always disclosed in §10, whatever the recommendation.
- Every CONDITIONAL GO lists explicit, checkable conditions (e.g. "BUG-003 fixed
  and TC-012 re-executed PASS").
- Every recommendation states: supporting evidence, blocking issues, remaining
  risks, required actions, and what would change it.
- The recommendation is a QA recommendation within the tested scope, not a
  business or production release approval. The report says so.

## Risks

Each risk is `QRSK-###` with: description, category (open defect, critical
defect, blocked, not executed, environment, test data, automation, coverage,
unverified requirement, inconsistency), impact, **source** (upstream ID such as
`PC RK-###`, `BUG-###`, `QINC-###`, `H-###`, `EVD-###`) or the label
**analysis-derived** with the reasoning. Upstream risk IDs are reused, never
renumbered; `QRSK` IDs are only for the report's own entries and stay stable
across revisions.

## Traceability

Use existing IDs only (`PRD FR-###`, `PC BR/EB/RK-###`, `OBS/PB-###`, `TC-###`,
`CG-###`, `TQ-###`, `TR-###`, `EXEC-###`, `BUG-###`, `TCI-###`, `EVD-###`, run IDs,
`E-###` / `H-###`, `EVT-####`). Never create replacement IDs. Chains shown in §11:

- Requirement → TestCase (from the approved traceability matrix only; requirement
  coverage is reported **only** when that matrix exists, otherwise
  **Evidence Not Available**)
- TestCase → manual result → evidence → bug
- TestCase → automated test → run ID → outcome → evidence
- Automation failure → healing attempt → verification run
- Each §1 / §10 conclusion → its sources

A relationship that cannot be established is shown as unavailable, never guessed.

## Report Structure

Both formats contain these sections, in this order (details in the templates):

1. Executive Summary
2. Project & Testing Overview
3. Test Coverage Summary
4. Manual Testing Results
5. Automation Testing Results
6. Defect Summary
7. Automation Failure Analysis
8. Self-Healing Summary
9. Risks & Known Issues
10. Release Recommendation
11. Evidence & Traceability

A header (task, run, report version, status, generation time, skill and prompt
versions) precedes §1; a Revision History follows the header. A section without
content says "None." A section whose data is unavailable says
**Evidence Not Available** and why.

**One data object, two renderings.** All figures are computed once into a report
data object. Markdown and HTML are rendered from it. The HTML embeds it as
`<script type="application/json" id="qa-final-report-data">`; the Markdown carries
the same object in a trailing HTML comment (`<!-- qa-final-report-data … -->`).
Validation compares both with each other and with the visible tables.

## Security and Secret Handling

- Credentials are referenced by **environment variable name or source name only**.
  No password, token, session cookie, API key or personal credential appears in
  either report or the journal; a secret found in a quoted source is shown as
  `[REDACTED: <kind>]` and recorded.
- Evidence is **linked** (relative paths), never embedded or copied. Evidence that
  a journal entry or upstream report marks as withheld or as containing a secret is
  listed by path without a link, with the reason.
- Before presenting, scan both outputs for credential values available in the
  session's environment variables (raw text and decoded base64 blocks) and for
  e-mail addresses. Any hit is removed and recorded in `fixes`.

## Validation Rules (self-checks before presenting)

| Check | Rule |
|---|---|
| QFR-V01 | All prerequisites (1–7) were verified before any analysis. |
| QFR-V02 | Both `QA-Final-Report.md` and `QA-Final-Report.html` exist; the HTML parses. |
| QFR-V03 | Both contain the 11 sections, in order, with the same headings. |
| QFR-V04 | The embedded data objects of both files are identical, and every figure in the visible tables of both equals the data object. |
| QFR-V05 | Every calculated metric names its source; every percentage shows numerator and denominator; nothing is computed from missing or unreconciled data. |
| QFR-V06 | Manual and automation statistics are separate; no case is counted twice across bindings or runs; run history is not added to case counts; warm-up / demonstration runs are not used as results. |
| QFR-V07 | `Executed = PASS + FAIL + BLOCKED` and `Approved = Executed + NOT_EXECUTED` hold, or the difference is a recorded `QINC-###`. |
| QFR-V08 | Defect totals equal the distinct non-withdrawn `BUG-###` in BugReports.md; severity and priority are tabulated separately; no defect is duplicated across manual and automation. |
| QFR-V09 | Every healing attempt reported as fixed has a passing verification run; any other is reported as not fixed. |
| QFR-V10 | BLOCKED, NOT EXECUTED and out-of-scope cases are visible in §3/§4 with reasons; unavailable stages and data are marked **Not performed** / **Evidence Not Available**. |
| QFR-V11 | The recommendation is exactly one of the four values, follows the ordered rules, and has supporting evidence, blocking issues, remaining risks, required actions and change conditions. |
| QFR-V12 | Every `QRSK-###` has a source or is labeled analysis-derived; every `QINC-###` states sources, values, the value shown and the impact. |
| QFR-V13 | Every cited ID exists in its source; every relative link resolves; no withheld evidence is linked. |
| QFR-V14 | **No upstream artifact was modified:** the SHA-256 of every bound source at the end equals the hash recorded at the start. |
| QFR-V15 | No credential value or e-mail address in either output (raw and base64-decoded). |
| QFR-V16 | Exactly one `QA-Final-Report.md` and one `QA-Final-Report.html` exist under `reports/`, with no `-v2` / `-final` copies. |
| QFR-G01 | (gate) The reply is exactly `QA_FINAL_REPORT_APPROVED`, standalone. |
| QFR-G02 | (gate) The report is still current at the moment of the reply (stale conditions F1–F4 below). |

If a check fails because of the report, correct the report and record the
correction in `fixes`. If it fails because of the sources, record a `QINC-###` and
let the recommendation rules weigh it. Never pass a check by inventing content.
If any check still fails, present the report as **not fully validated**, name the
failing checks, and do not request approval as if it were validated. QFR-V14
failing means something changed an upstream artifact during the run: stop
(`QFR-E12`), and present nothing as a valid report.

## Failure Conditions

| Code | Condition | Event status |
|---|---|---|
| QFR-E01 / E02 | Task folder missing / target is the template | `blocked` |
| QFR-E03 | No active workflow run (event `workflow_run_id: null`); a run ID is never created | `blocked` |
| QFR-E04 | Journal missing or invalid JSON. Nothing is recreated. | `blocked` |
| QFR-E05 | TestCases.md missing or still the template placeholder | `blocked` |
| QFR-E06 | `TEST_DESIGN_APPROVED` or `TEST_REVIEW_APPROVED` missing or stale | `blocked` |
| QFR-E07 / E08 | Prompt missing or unreadable / same id and version recorded with a different hash | `blocked` |
| QFR-E09 | A report file exists without a journaled `qa-final-report` origin (never overwritten) | `blocked` |
| QFR-E10 | A source needed for a required section is corrupted or cannot be parsed reliably (e.g. ExecutionReport §4 table, `execution-metrics.json`), and the affected figures cannot be marked unavailable without misleading | `failed` |
| QFR-E11 | Critical contradictions prevent reliable reporting (e.g. two approved, current versions of one artifact; a case with contradictory approved results and no way to state both) | `failed` |
| QFR-E12 | An upstream artifact changed during the run (QFR-V14) | `failed` |
| QFR-E13 | An output cannot be written, or Markdown and HTML cannot be reconciled (QFR-V04 still failing after correction) | `failed` |
| QFR-E14 | The journal cannot be appended. If the report was already written, state that the run is **not journaled** | `failed` |

| Warning | Condition |
|---|---|
| QFR-W01 | An optional artifact or stage is missing, a placeholder, or not performed |
| QFR-W02 | An input was found by search, not by the journal or the workflow path |
| QFR-W03 | An upstream artifact is unapproved or its approval is stale (non-required stages) |
| QFR-W04 | A line-ending-only hash difference was found |

Every failure names the exact cause and the report sections it affects. A failure
never produces a GO recommendation: if a report is presented at all, it says
which sections are incomplete.

## Revision Behavior

When the report is requested again (new upstream results, or a human change
request):

1. On a change request, append a `revision_request` event with the verbatim
   message (secrets redacted).
2. Re-check prerequisites and re-discover all sources.
3. Compare with the bound sources of the latest `qa-final-report`
   `stage_execution`: versions, SHA-256, approval events, run IDs, healing IDs,
   bug IDs. List what changed.
4. Recalculate every affected metric (in practice, rebuild the data object), and
   re-assess every earlier `QINC` / `QRSK` (resolved, still open, new; IDs kept).
5. Regenerate both formats in place; bump the report's minor version; add a
   Revision History row (reason, changed sources, changed figures, recommendation
   before → after); reset Status to Draft.
6. Re-run all validation checks, then append a `stage_execution` with the
   `revision` object, present, and STOP.

Earlier results are never rewritten: earlier figures stay in the Revision History
and in earlier journal events. **Changing an approved report voids its approval.**

## Hard-Stop Behavior

After the report is written (initial or revision) and validated:

- **STOP.** Present: both report paths, the recommendation with its main
  supporting evidence and blocking issues, the major risks and unresolved issues,
  missing or not-performed stages, inconsistencies, and the validation result.
- Do not modify any upstream artifact, start any stage, re-run tests, heal, or
  raise bugs.
- Stop **before writing** (no misleading report) when source data is corrupted,
  critical contradictions prevent reliable reporting, the task or report
  destination cannot be identified, a required approval is invalid, or a critical
  result would have to be guessed. Never bypass a stop to produce a GO.

## Approval Gate

- The only valid key is the **exact, case-sensitive, standalone** value:

  ```
  QA_FINAL_REPORT_APPROVED
  ```

- **Invalid:** `approved`, `looks good`, `continue`, `ship it`, `GO`, the key with
  other text, another stage's key, silence. Each is journaled as an
  `approval_decision` with `not_accepted`; the stage stays stopped. A message that
  also contains a change request proceeds to revision.
- Approval is requested only for a report that passed validation, or with the
  failing checks stated plainly.
- **Stale** (the key is then not accepted, QFR-G02):

  | # | Stale when |
  |---|---|
  | F1 | The current report SHA-256 (either file) differs from the latest `stage_execution` output hash |
  | F2 | A later `qa-final-report` `stage_execution` exists |
  | F3 | A bound source's SHA-256 changed (after LF normalization), or a bound approval is no longer current |
  | F4 | A newer upstream result exists: a later `stage_execution` of `manual-execution`, `automation-execution` or `self-healing`, or a new `approval_decision` upstream |

- **When accepted:** set Status to `Approved` in both files (version unchanged),
  append an `approval_decision` (`accepted`) with the **post-update SHA-256** of
  both files and the full `final_report` binding, and report that the QA workflow
  is complete for this run. `next_stage` is `reporting` (planned) or `null`.
- Approval does **not** approve a release, and the skill never starts another stage.

## Journal Integration

Use the existing journal only:

- `journal/execution-log.json` (events, schema v1.8.0)
- `journal/prompts.json` (prompt records)

The stage's constant values are in
[`journal-event.template.json`](journal-event.template.json). Entries are appended;
earlier entries are never modified.

| Moment | Event type | Status |
|---|---|---|
| Prerequisite not met | `stage_execution` | `blocked` |
| QFR-E10 – E14 | `stage_execution` | `failed` |
| Report written and validated (each attempt) | `stage_execution` | `awaiting_approval` |
| Change requested | `revision_request` | `revision_requested` |
| Reply is the key and the report is current | `approval_decision` | `approved` |
| Any other reply, or the key on a stale report | `approval_decision` | `approval_not_accepted` |

Field rules (`stage_execution`):

- **Identity:** `event_id` / `step_number` next in sequence; `attempt` counts this
  stage's executions in the run; `workflow_run_id` read from `workflow-run.json`
  (null only on QFR-E03); `task_id`, `timestamp` (system clock, UTC), stage and
  skill identity and versions.
- **Prompt:** `prompt_id` / `prompt_version`; on first use in the task, append the
  verbatim content, SHA-256 (of the LF-normalized text), `captured_at` and
  `first_used_by_event_id`. `prompt_variables`: `task_name`, `task_path`,
  `workflow_run_id`.
- **`trigger`**: reason and the verbatim user message (secrets redacted, recorded
  in `trigger.redactions`).
- **`input_references`**: every bound source (`upstream_artifact`, SHA-256, version
  in `notes`, status `read` / `missing` / `unreadable` / `not_applicable`), every
  approval used (`upstream_approval`, `journal:EVT-NNNN`), PRD (`task_prd`),
  TaskContext (`task_metadata`), the prompt, and on revisions the previous report
  (`previous_version_of_output`) and the change request.
- **`final_report`** (schema 1.8.0): `sources`, `run_ids`, `metrics`,
  `inconsistencies`, `recommendation`, `outputs` (both paths and hashes,
  `formats_consistent`).
- **`tools_used`**: file read, hash, parse and write tools only.
- **`mcp_used`**: `{ used: false, servers: [], intentionally_not_used: [{ server: "playwright", reason: "The final report is built from recorded artifacts only; no live application access." }] }`.
- **`actions`**, **`decisions`** (reconciliation choices, recommendation rule
  applied), **`assumptions`**, **`gaps`** (missing / not-performed stages),
  **`open_questions`**.
- **`output_artifacts`**: both files (operation, status, version, SHA-256, summary).
- **`validation.checks`**: QFR-V01…V16 with their real results.
- **`errors`** (QFR-E codes) and warnings (QFR-W codes, as `errors` entries with a
  `resolution`), **`fixes`**, `revision` (null on attempt 1), `notes`.
- **Gate fields:** `status`, `stop_reason`, `approval_required: true`,
  `approval_key: "QA_FINAL_REPORT_APPROVED"`, `approval_outcome` (null except on
  `approval_decision`), `next_stage` (`reporting`, unlocked only after an accepted
  approval).
- `evidence` is empty: the report produces no evidence; upstream `EVD` items are
  referenced through `final_report` and the report.
- **Never fabricate** runtime values. Unavailable values are `null`, explained in
  `notes`.

## HTML Journal Observability

The platform's HTML journal is not implemented yet (planned `reporting` skill;
specification in [`ai-qa-execution-journal.md`](../../../docs/architecture/ai-qa-execution-journal.md)).
It must be able to show all of the following for this stage from the journal plus
the two report files, without rerunning anything:

| # | Shown | From |
|---|---|---|
| 1 | Why the stage ran (first report, refresh, revision) | `trigger.reason`, `trigger.user_message` |
| 2 | Exact prompt version | `prompt_id` / `prompt_version` → `prompts.json` |
| 3 | Workflow run | `workflow_run_id` |
| 4 | Status of the stage | `status`, `stop_reason` |
| 5 | Report files (Markdown, HTML) with links and hashes | `final_report.outputs`, `output_artifacts` |
| 6 | Release recommendation, its rule and conditions | `final_report.recommendation` |
| 7 | Sources used: path, version, hash, approval, availability | `final_report.sources`, `input_references` |
| 8 | Runs used as latest results and runs kept as history | `final_report.run_ids` |
| 9 | Headline metrics (manual, automation per binding, defects, healing) | `final_report.metrics` |
| 10 | Inconsistencies and their impact | `final_report.inconsistencies` |
| 11 | Missing / not-performed stages | `gaps`, `errors` (QFR-W01) |
| 12 | Validation results | `validation.checks` |
| 13 | Approval requirement and result | `approval_key`, `approval_decision` events |
| 14 | Revisions | `revision_request` events, `revision` |
| 15 | Links to source artifacts | `final_report.sources[].path` |

**Navigation paths:**

- **Recommendation → Rule → Blocking issues → Source**:
  `final_report.recommendation.rule` → `.blocking_issues[]` → `BUG-###` / `QINC-###`
  → BugReports.md / the source event.
- **Metric → Source artifact → Approval**: `final_report.metrics` →
  `final_report.sources[]` → `approval_event_id`.
- **Automation case status → Run → Healing**: `final_report.run_ids.latest[]` →
  the `automation_runs` entry → `healing_ids` → `healing_attempts`.
