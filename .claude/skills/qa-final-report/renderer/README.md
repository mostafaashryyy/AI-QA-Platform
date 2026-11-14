# qa-final-report renderer

Builds the QA Final Report HTML of **one task** from that task's recorded artifacts and journal,
using the calculation, reconciliation and recommendation rules of [`../SKILL.md`](../SKILL.md)
and the section structure of [`../qa-final-report-html.structure.md`](../qa-final-report-html.structure.md).
Node.js only, no dependencies, no network.

```
node .claude/skills/qa-final-report/renderer/build-report.cjs <task-name> [--out <file>]
```

Default output: `platform/tasks/<task-name>/reports/qa-final-report-preview/index.html`.

## What it is, and what it is not

The renderer is the data and rendering part of the stage. It does **not**:

- journal a `stage_execution`;
- write the Markdown companion;
- request `QA_FINAL_REPORT_APPROVED`.

Its page is therefore labeled *Draft · not journaled · not approved*. It refuses to write
`reports/QA-Final-Report.md` or `.html`, because only a journaled `qa-final-report` stage
execution may own those files (QFR-E09, QFR-V16).

## Pipeline

| Step | File | Responsibility |
|---|---|---|
| Data collection | [`collect.cjs`](collect.cjs) (+ [`lib/md.cjs`](lib/md.cjs)) | Reads and hashes the task's files: journal, workflow run, TestCases (MD + CSV), ExecutionReport, BugReports, AutomationGeneration, execution-metrics.json, healing log, PRD, ProjectContext, ExplorationReport, TestReview. Also reads the withheld-evidence markers. Read only; no judgement. |
| Validation and reconciliation | [`reconcile.cjs`](reconcile.cjs) | Artifact discovery (journal → workflow), availability, approval currency (raw / LF-normalized SHA-256, no later execution) and approved scope. Cross-checks manual results (§3, §4 and journal `test_results`) and defects (BugReports and ExecutionReport §8). Builds the run catalogue per binding (valid, history, early runs without `automation_runs`). Every contradiction becomes a `QINC-###`. |
| Metrics | [`metrics.cjs`](metrics.cjs) | Coverage, manual identities and the latest valid run per case and binding. Failure classes, defects (severity and priority kept separate), self-healing (fixed only with a passing verification run), derived QA case status, requirement and source coverage, `QRSK-###` risks, the ordered recommendation rules and traceability chains. Produces **one data object**. |
| Arabic tooltips | [`tooltips-ar.cjs`](tooltips-ar.cjs) | One ⓘ text per section and metric, in Egyptian Arabic with English technical terms wrapped in Unicode isolates. Each text says what the item is, how it is calculated, why it matters and which artifact or skill provides it. |
| HTML rendering | [`render-html.cjs`](render-html.cjs), [`assets/`](assets/) | The 11 sections, inline SVG charts, filters, search, sorting and expandable evidence. The data object is embedded as `#qa-final-report-data`, and every visible figure is rendered from it. |
| CLI | [`build-report.cjs`](build-report.cjs) | Checks prerequisites 1–7 (no report if one fails) and refuses reserved or foreign output files. Verifies that no bound source changed during the run (QFR-V14), scans for credential values and e-mail addresses (QFR-V15) and writes atomically. |

Nothing here is specific to one application. Project details come only from the task's own
files, such as `context/TaskContext.md`.
