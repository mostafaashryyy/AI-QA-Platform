# QA Final Report (HTML) — structure

<!--
OUTPUT STRUCTURE for the qa-final-report skill (HTML). This file is a structure
reference, not an artifact. The skill writes ONE self-contained file to
platform/tasks/<task-name>/reports/QA-Final-Report.html, rendered from the same
report data object as reports/QA-Final-Report.md (QA-Final-Report.template.md).
Every section is always present, in the Markdown order; an empty section says "None.",
unavailable data says "Evidence Not Available — <why>", a stage not run says
"Not performed". No secrets: environment variable / source NAMES only. No e-mail addresses.
-->

## Visual reference and renderer

[`renderer/`](renderer/README.md) builds this HTML from a task's recorded artifacts
(collect → reconcile → calculate → Arabic ⓘ tooltips → render), with the visual language of
`reports/AIPromptOutputHistory.html`: its colour tokens, header band, cards, pills, tables and
ⓘ tooltips (Egyptian Arabic, right-to-left, same hover / focus / pin behaviour), plus a sticky
section navigation. Run on its own it writes an unjournaled draft to
`reports/qa-final-report-preview/index.html`; it never writes `reports/QA-Final-Report.*`.

## Technical rules

- One file. Inline CSS and JS only; no external scripts, fonts, images or network
  requests. Opens from disk (`file://`) without a server.
- The report data object is embedded once:
  `<script type="application/json" id="qa-final-report-data">{…}</script>`.
  It is byte-identical (after parsing) to the object in the Markdown's trailing
  `qa-final-report-data` comment (QFR-V04). All visible figures are rendered from it.
- Responsive: no horizontal page scroll at 400 px; wide tables scroll inside their
  own container.
- Light and dark themes via `prefers-color-scheme`; text contrast WCAG AA.
- No animations, no decorative imagery.
- Relative links only (relative to `reports/`). Evidence is linked, never embedded.
  Withheld evidence is shown as plain text with the reason.
- Print-friendly: sections do not depend on JavaScript to be readable; JS only adds
  table sorting and filtering.

## Status styling

Status is never shown by colour alone: every badge has its text label, and
optionally an icon.

| Meaning | Labels | Colour role |
|---|---|---|
| Positive | PASS, passed, fixed, GO | good (green) |
| Negative | FAIL, failed, NO-GO, open Critical / High defect | critical (red) |
| Blocked / harness | BLOCKED, harness_failed, not_run | serious (orange) |
| Conditional / warning | CONDITIONAL GO, Suspected, stale, not_fixed | warning (amber) |
| Unknown / unavailable | NOT EXECUTED, Not performed, Evidence Not Available, INSUFFICIENT EVIDENCE, unknown | neutral (grey) |

Framework / binding identity in charts uses categorical colours that are distinct
from the status colours, and every series is labeled.

## Charts

Charts are inline SVG and appear only when their data is valid (complete, non-zero
denominator, reconciled). Otherwise the place shows "Chart not shown — <reason>".
Each chart has a text title, a legend or direct labels, a hover title per mark, and
the same numbers in an adjacent table. One value axis per chart; no dual axes.

| Chart | Data | Shown when |
|---|---|---|
| Manual results (stacked bar or donut) | PASS / FAIL / BLOCKED / NOT EXECUTED over approved cases | Manual execution performed and reconciled |
| Automation results per binding (grouped bars) | latest-run case outcomes per binding | At least one binding has a valid run |
| Defects by severity (bar) | counts per severity | ≥ 1 defect |
| Defects by priority (bar) | counts per priority (separate chart) | ≥ 1 defect |
| Automation failure classes (bar per binding) | class counts | ≥ 1 classified non-passing run |

## 1. Header and navigation

Task, project, workflow run, report version, status (Draft / Approved), generation
time, skill and prompt versions, link to `QA-Final-Report.md`. A sticky (or top)
section navigation with links to §1–§11. Revision History table (collapsible).

## 2. Executive summary (§1)

Recommendation banner (value, deciding reason, "QA recommendation within the tested
scope, not a release approval"). Summary cards: approved cases; manual executed n / d;
PASS / FAIL / BLOCKED / NOT EXECUTED; automation latest result per binding; open
defects (with Critical / High counts); open inconsistencies; main risks.

## 3. Project & testing overview (§2)

Identity table, scope / out of scope, environment, testing period, testing types,
workflow stage table with status, version, hash (short), approval and currency.

## 4. Coverage (§3)

Coverage table with numerator / denominator per percentage; manual results chart;
per-case matrix (sortable, filterable by status and binding) with the derived-status
rule stated above it.

## 5. Manual results (§4)

Counts and both reconciliation checks; failed and blocked cases with cause, bug and
evidence links; not-executed cases with reasons; main findings.

## 6. Automation results (§5)

Generation table; per-binding latest-run table; automation results chart; run
history table (role, outcome, failure class, healing, evidence) with excluded runs
marked.

## 7. Defects (§6)

Totals, severity chart and table, priority chart and table (separate), defect list,
unconfirmed application failures, unconfirmed exploration potential bugs.

## 8. Automation failure analysis (§7)

Class × binding table, failure-class chart, failures grouped by signature.

## 9. Self-healing (§8)

Counts; attempts table with verification run and result; link to
`../self-healing/healing-log.md`.

## 10. Risks & known issues (§9)

Risks table (source or "analysis-derived"); inconsistencies table; missing /
not-performed stages.

## 11. Release recommendation (§10)

Recommendation, rule applied, release policy used, supporting evidence, blocking
issues, remaining risks, required actions, conditions, change conditions, scope
limitations.

## 12. Evidence & traceability (§11)

Bound sources (path link, version, SHA-256, producing and approval events,
availability, found by); traceability chains; conclusions with sources; withheld
evidence (no links).

## 13. Footer

"No credentials are stored in this report; they are referenced by source name only",
generation time, journal event ID, data-object note.
