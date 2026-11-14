# QA Final Report

<!--
OUTPUT STRUCTURE for the qa-final-report skill (Markdown). This file is a structure
reference, not an artifact. The skill writes the filled version to
platform/tasks/<task-name>/reports/QA-Final-Report.md and an equivalent HTML file
(qa-final-report-html.structure.md) from ONE report data object.

Rules:
- Sections 1–11 always present, in this order, with these headings. Empty → "None."
  Unavailable data → "Evidence Not Available — <why>". Stage not run → "Not performed".
- Every figure comes from the report data object; never typed by hand.
- Every percentage: "n / d (x.x %)" with numerator and denominator named;
  "N/A — no denominator" when d = 0 or data is incomplete.
- Manual and automation figures are never added together.
- Severity and priority are separate tables.
- Existing IDs only (TC, BUG, EVD, run IDs, H-###, EVT-####, PC/PRD IDs).
  New IDs only for the report's own risks (QRSK-###) and inconsistencies (QINC-###).
- Links are relative to reports/. Evidence is linked, never embedded.
  Withheld evidence (contains a secret) is listed without a link.
- No secrets, no e-mail addresses. Credentials by environment variable / source name only.
-->

| Field | Value |
|---|---|
| Task ID | |
| Project / application | <from TaskContext § Identity> |
| Workflow Run ID | <journal/workflow-run.json → active_run_id> |
| Report version | 1.0.0 |
| Status | Draft — awaiting `QA_FINAL_REPORT_APPROVED` \| Approved |
| Generated (UTC) | <system clock> |
| Skill / prompt | qa-final-report v1.0.0 / qa-final-report v1.0.0 |
| Journal event | EVT-NNNN |
| Companion file | [QA-Final-Report.html](QA-Final-Report.html) (same data) |

### Revision History

| Version | Date (UTC) | Reason | Changed sources | Changed figures | Recommendation (before → after) |
|---|---|---|---|---|---|
| 1.0.0 | | Initial | — | — | — → <value> |

---

## 1. Executive Summary

> **QA Release Recommendation: <GO | CONDITIONAL GO | NO-GO | INSUFFICIENT EVIDENCE>**
> <one or two sentences: the deciding reason, in plain language>
>
> This is a QA recommendation within the tested scope, not a business or production release approval.

| Item | Value | Source |
|---|---|---|
| Overall QA status | <e.g. "Executed with open defects"> | |
| Testing scope | <one line; details in §2> | ProjectContext § |
| Approved test cases (active) | | TestCases.md vX.Y.Z |
| Manual execution progress | Executed n / d (x.x %) | ExecutionReport.md §3 |
| Manual results | PASS n · FAIL n · BLOCKED n · NOT EXECUTED n | ExecutionReport.md §4 |
| Automation (latest run per binding) | <binding>: passed n · failed n · not run n | §5 |
| Confirmed application defects (open) | n (Critical n · High n · Medium n · Low n) | BugReports.md |
| Critical unresolved issues | <list or "None"> | |
| Main risks | QRSK-###, QRSK-### | §9 |

## 2. Project & Testing Overview

| Field | Value | Source |
|---|---|---|
| Project name | | TaskContext.md |
| Application / module under test | | |
| Environment(s) | <URL, build/version, browser per stage> | ExecutionReport §1, run metadata |
| Testing period | <first execution → last execution, UTC> \| Evidence Not Available | journal |
| In scope | | ProjectContext § |
| Out of scope | | ProjectContext § |
| Testing types performed | <exploration, manual functional, UI automation (bindings) …> | |

### Workflow stages

| Stage | Status | Artifact (version) | SHA-256 (first 12) | Approval | Current? |
|---|---|---|---|---|---|
| prd-generation | Approved \| Draft \| Not performed | prd/PRD.md (x.y.z) | | EVT-NNNN | Yes \| No (reason) |
| project-context | | | | | |
| exploration | | | | | |
| test-design | | | | | |
| test-review | | | | | |
| manual-execution | | | | | |
| automation-generation | Completed \| Not performed | | | — (ungated) | — |
| automation-execution | Completed \| Not performed | execution-metrics.json | | — (ungated) | — |
| self-healing | Completed \| Not needed \| Not performed | | | — (ungated) | — |

## 3. Test Coverage Summary

| Metric | Count | % (numerator / denominator) | Source |
|---|---|---|---|
| Approved test cases (active) | | — | TestCases.md |
| In execution scope (Valid in Scope = TRUE, expected result established) | | n / approved | |
| Out of execution scope | | n / approved | |
| Manually executed | | n / approved · n / in scope | |
| PASS | | n / executed | |
| FAIL | | n / executed | |
| BLOCKED | | n / executed | |
| NOT EXECUTED | | n / approved | |
| Automation candidates (Needs Automation = TRUE) | | n / approved | |
| Automated with a latest valid run (per binding) | | n / candidates | |
| Requirements covered | n \| Evidence Not Available — no approved requirement-to-test mapping | n / requirements | TestCases.md traceability matrix |

### Per-case matrix (derived QA case status)

Derived-status rule (stated verbatim from the skill): <rule table or reference>.

| Case | Title | In scope | Manual (latest) | <binding A> (latest run) | <binding B> (latest run) | Bugs | Healing | Derived status |
|---|---|---|---|---|---|---|---|---|
| TC-### | | Yes \| No (CG-###) | PASS \| FAIL \| BLOCKED \| NOT EXECUTED | passed (run-…) \| Not generated | | BUG-### | H-### | |

## 4. Manual Testing Results

<"Not performed" when no ExecutionReport exists.>

| Metric | Count | Source |
|---|---|---|
| Total manual test cases (approved) | | |
| Executed | | |
| PASS / FAIL / BLOCKED | | |
| NOT EXECUTED | | |
| Manual execution coverage | n / d (x.x %) | |
| Check `Executed = PASS + FAIL + BLOCKED` | holds \| QINC-### | |
| Check `Approved = Executed + NOT_EXECUTED` | holds \| QINC-### | |

### Failed and blocked cases

| Case | Status | Cause (ExecutionReport §5 / §6) | Bug | Evidence |
|---|---|---|---|---|
| TC-### | FAIL \| BLOCKED | APPLICATION_DEFECT \| … | BUG-### \| none | EVD-### |

### Not executed

| Case | Reason (as recorded) |
|---|---|

### Main findings

- <finding> — source: <section / ID>

## 5. Automation Testing Results

<"Not performed" when no automation-generation stage_execution exists.
Generated is not executed: never count a generated test as passed.>

### Generation

| Item | Value | Source |
|---|---|---|
| Automation candidates | | TestCases.md |
| Bindings | <binding id: framework + language + runner> | AutomationGeneration.md §3 |
| Generated tests (per binding) | | AutomationGeneration.md §2/§4 |
| Not generated (with reason / warning code) | | |
| Static validation | passed \| failed (checks) | AutomationGeneration.md §9 |

### Execution per binding (latest valid run per case)

| Binding | Cases with a latest valid run | passed | failed | not_run | harness_failed | Coverage (n / candidates) | Latest run(s) |
|---|---|---|---|---|---|---|---|

### Run history (not added to case counts)

| Binding | Valid runs | passed | failed | not_run | harness_failed | Excluded runs (warm-up / demo / diagnostic) |
|---|---|---|---|---|---|---|

| Run ID | Binding | Role | Started (UTC) | Outcome | Failure class | Healing | Evidence |
|---|---|---|---|---|---|---|---|

## 6. Defect Summary

<Source: bugs/BugReports.md vX.Y.Z. "No defects recorded" only when the approved,
current ExecutionReport records Bugs raised = 0; otherwise "Evidence Not Available".>

| Total distinct defects (non-withdrawn) | Open | Suspected | Fixed / Closed | Withdrawn (listed, not counted) |
|---|---|---|---|---|

### By severity

| Critical | High | Medium | Low | Not set |
|---|---|---|---|---|

### By priority

| High | Medium | Low | Not established |
|---|---|---|---|

### Defect list

| Bug ID | Title | Severity | Priority | Status | Affected module | Test cases | Detected by | Evidence |
|---|---|---|---|---|---|---|---|---|
| BUG-### | | | | | | TC-### | manual \| automation (run-…) \| both | EVD-### |

### Unconfirmed application failures (automation, no bug report)

| Run ID | Binding | Case | Error (first line) | Evidence | Action |
|---|---|---|---|---|---|

### Potential bugs from exploration (not confirmed)

| ID | Summary | Source |
|---|---|---|

## 7. Automation Failure Analysis

<Valid non-passing runs per binding; classes copied from the source.
Percentages only when the binding has ≥ 1 classified non-passing run.>

| Class | <binding A> | <binding B> | Application defect? |
|---|---|---|---|
| application | n (n / d %) | | Yes, if a BUG-### exists; otherwise unconfirmed |
| test_script | | | No |
| framework_defect | | | No |
| configuration | | | No |
| environment | | | No |
| test_data | | | No |
| unknown | | | Not established |
| harness_failed (outcome) | | | No |
| not_run (outcome) | | | No |

### Failures by signature

| Signature (first error line) | Runs | Class | Healing | Status |
|---|---|---|---|---|

## 8. Self-Healing Summary

<"Not performed" / "Not needed" when applicable. A fix is "fixed" only with a
passing verification run.>

| Metric | Count | Source |
|---|---|---|
| Investigated failures (distinct failed runs) | | healing_attempts |
| Attempts | | |
| Fixed (verified by a passing run) | | |
| Not fixed | | |
| Escalated | | |
| Not healed — application defect | | |
| Remaining unresolved failures | | |

| ID | Binding | Failed run(s) | Classification | Change (files) | Verification run | Result | Log |
|---|---|---|---|---|---|---|---|
| H-### | | | | | run-… (passed) \| none | fixed \| not_fixed \| escalated | [healing-log.md](../self-healing/healing-log.md) |

## 9. Risks & Known Issues

| ID | Risk | Category | Impact | Source |
|---|---|---|---|---|
| QRSK-### | | open defect \| blocked \| not executed \| environment \| test data \| automation \| coverage \| unverified requirement \| inconsistency | | BUG-### \| PC RK-### \| QINC-### \| analysis-derived: <reasoning> |

### Inconsistencies between sources

| ID | Sources | Values found | Value shown in this report and why | Affected sections | Impact on recommendation |
|---|---|---|---|---|---|
| QINC-### | | | | | |

### Missing or not-performed stages and artifacts

| Stage / artifact | Availability | Effect |
|---|---|---|

## 10. Release Recommendation

> **<GO | CONDITIONAL GO | NO-GO | INSUFFICIENT EVIDENCE>** — rule <n> of the skill's ordered rules
> <project release policy applied: cite, or "No project release policy found">

| Item | Content |
|---|---|
| Supporting evidence | <bullets with sources> |
| Blocking issues | <BUG / QINC / case IDs, or "None"> |
| Remaining risks | <QRSK IDs> |
| Required actions | <owner-neutral, checkable actions> |
| Conditions (CONDITIONAL GO) | <explicit, checkable conditions> |
| What would change this recommendation | |
| Scope limitations | <out-of-scope, blocked, not executed, environment limits> |

This is a QA recommendation within the tested scope. It is not a business or
production release approval.

## 11. Evidence & Traceability

### Bound sources

| Artifact | Path | Version | SHA-256 | Producing event | Approval event | Availability | Found by |
|---|---|---|---|---|---|---|---|

### Traceability chains

| Requirement | Test case | Manual result (EXEC / EVD) | Automation (binding · run · outcome) | Bug | Healing |
|---|---|---|---|---|---|
| PRD FR-### / PC BR-### \| Evidence Not Available | TC-### | PASS · EVD-### | playwright-ts · run-… · passed | BUG-### | H-### → run-… |

### Conclusions and their sources

| Conclusion (§) | Sources |
|---|---|

### Withheld evidence (not linked)

| Path | Reason | Recorded in |
|---|---|---|

---

No credentials are stored in this report; they are referenced by source name only.

<!-- qa-final-report-data
{ …the report data object, identical to the HTML's #qa-final-report-data… }
-->
