# Skills Reference

> © 2026 Mostafa Ashry. All rights reserved. View-only; see [LICENSE](../../LICENSE).

Skills live in [`.claude/skills/<skill>/`](../../.claude/skills/). Each folder holds a
`SKILL.md` (front matter `name` + `description`, which Claude Code uses to select the
skill, followed by the full stage specification), output templates, and a
`journal-event.template.json` with the stage's constant journal fields.

Catalog and status: [`platform/registry/skills.yaml`](../../platform/registry/skills.yaml).

> Each skill names a versioned prompt in `.claude/prompts/`. The prompt files are **not
> published in this repository** (see [Prompts Reference](prompts.md)), so the skills
> are documented here but cannot run as specified from this repository alone.

## Summary

| Skill | Version | Status | Gate key | Playwright MCP | Error codes |
|---|---|---|---|---|---|
| [`prd-generation`](../../.claude/skills/prd-generation/SKILL.md) | 1.0.1 | Implemented | `PRD_APPROVED` | Forbidden | `PRD-E##` |
| [`project-context`](../../.claude/skills/project-context/SKILL.md) | 1.1.1 | Implemented | `PROJECT_CONTEXT_APPROVED` | Forbidden | `PC-E##` |
| [`exploration`](../../.claude/skills/exploration/SKILL.md) | 1.0.0 | Implemented | `EXPLORATION_APPROVED` | Required | `EX-E##` |
| [`test-design`](../../.claude/skills/test-design/SKILL.md) | 1.0.1 | Implemented | `TEST_DESIGN_APPROVED` | Forbidden | `TD-E##` |
| [`test-review`](../../.claude/skills/test-review/SKILL.md) | 1.0.0 | Implemented, mandatory | `TEST_REVIEW_APPROVED` | Forbidden | `TR-E##` |
| [`manual-execution`](../../.claude/skills/manual-execution/SKILL.md) | 1.1.0 | Implemented | `MANUAL_EXECUTION_APPROVED` | Required | `ME-E##` |
| [`automation-generation`](../../.claude/skills/automation-generation/SKILL.md) | 1.1.0 | Implemented | — | Optional, read-only | `AG-E##` |
| [`automation-execution`](../../.claude/skills/automation-execution/SKILL.md) | 1.0.0 | Implemented | — | Not used | `AE-E##` |
| [`self-healing`](../../.claude/skills/self-healing/SKILL.md) | 1.0.0 | Implemented | — | Optional, read-only | `SH-E##` |
| [`qa-final-report`](../../.claude/skills/qa-final-report/SKILL.md) | 1.0.0 | Implemented | `QA_FINAL_REPORT_APPROVED` | Forbidden | `QFR-E##` |
| [`security-testing`](../../.claude/skills/security-testing/SKILL.md) | 1.0.0 | **Partial, not integrated** | `SECURITY_PLAN_APPROVED`, `SECURITY_TESTING_APPROVED` | EXECUTE phase only (pending) | `ST-E##` |
| `reporting` | — | **Planned** | — | — | — |

## Common structure of a `SKILL.md`

Most skills follow the same sections: Stage Identity · Purpose · Separation of
concerns · Trigger Conditions · Prerequisites (each with an error code) · Inputs ·
Outputs · Responsibilities / Non-Responsibilities · stage-specific rules · Validation
Rules (self-checks) · Failure Conditions · Revision Behavior · Hard-Stop / Approval
Gate · Journal Integration.

## Per-skill details

### `prd-generation`
- **Purpose:** turn one task's intake into a structured, traceable 20-section PRD.
- **Files:** `SKILL.md`, `PRD.template.md`, `journal-event.template.json`.
- **Inputs:** `context/TaskContext.md`, `journal/workflow-run.json`, supporting documents, URLs.
- **Output:** `prd/PRD.md`. Documentation only; no UI/API exploration.

### `project-context`
- **Purpose:** QA analysis of the approved PRD.
- **Files:** `SKILL.md`, `ProjectContext.template.md`, `journal-event.template.json`.
- **Output:** `context/ProjectContext.md` (scope, roles, rules, behaviors, dependencies,
  assumptions, risks, gaps, open questions, traceability).

### `exploration`
- **Purpose:** compare documented expectations with observed behavior in the live app.
- **Files:** `SKILL.md`, `ExplorationReport.template.md`, `journal-event.template.json`.
- **Output:** `exploration/ExplorationReport.md`, `exploration/evidence/`.
- **Classifications:** MATCH, FINDING, GAP, QUESTION, POTENTIAL BUG.

### `test-design`
- **Purpose:** design traceable, executable cases with systematic techniques.
- **Files:** `SKILL.md`, `TestCases.template.md`, `journal-event.template.json`.
- **Output:** `test-design/TestCases.md` with `Valid in Scope` / `Needs Automation` flags.
- **Coverage types:** Positive, Negative, Boundary, Validation, Business Rule,
  Dependency, Error Handling, Exploratory, End-to-End.

### `test-review`
- **Purpose:** mandatory review of the exact approved `TestCases.md` version.
- **Files:** `SKILL.md`, `TestReview.template.md`, `journal-event.template.json`.
- **Output:** `test-review/TestReview.md` bound by SHA-256.
- **Finding categories:** missing_coverage, duplicate, unclear_step,
  invalid_expected_result, missing_precondition, unsupported_assumption,
  traceability_error, flag_inconsistency.

### `manual-execution`
- **Purpose:** execute approved, in-scope cases exactly as written.
- **Files:** `SKILL.md`, `ExecutionReport.template.md`, `BugReports.template.md`,
  `journal-event.template.json`.
- **Output:** `execution/ExecutionReport.md`, `execution/evidence/`, conditional
  `bugs/BugReports.md`.

### `automation-generation`
- **Purpose:** generate maintainable UI automation for `Needs Automation = TRUE` cases.
- **Unresolved dependency:** requires `test-design/TestCases.csv` for a flag cross-check
  (prerequisite 9, `AG-E10`). **No existing skill generates this file**; it must
  currently be supplied manually. See
  [Limitations G-1](../limitations-and-roadmap.md#3-known-gaps-and-inconsistencies).
- **Files:** `SKILL.md`, `AutomationGeneration.template.md`,
  `journal-event.template.json`, and three scaffolds:

  | Binding | Scaffold | Stack |
  |---|---|---|
  | `shaft-java-testng` (default) | [`scaffold/shaft-java-testng/`](../../.claude/skills/automation-generation/scaffold/shaft-java-testng/) | SHAFT Engine on Selenium WebDriver, Java, TestNG, Maven |
  | `playwright-ts` | [`scaffold/playwright-ts/`](../../.claude/skills/automation-generation/scaffold/playwright-ts/) | Playwright Test, TypeScript, npm |
  | `playwright-java-testng` | [`scaffold/playwright-java-testng/`](../../.claude/skills/automation-generation/scaffold/playwright-java-testng/) | Playwright for Java, TestNG, Maven |

  Scaffold files use `{{placeholder}}` tokens (e.g. `{{base_url}}`,
  `{{username_env_var}}`, `{{playwright_version}}`) that the skill resolves per task.
  Library versions are verified from the package registry and pinned at generation time.
- **Warning codes:** `AG-W01`–`AG-W04`.

### `automation-execution`
- **Purpose:** run each binding independently and capture results and evidence.
- **Files:** `SKILL.md`, `automation-report.structure.md`, `journal-event.template.json`.
- **Metrics schema:** [`execution-metrics.schema.json`](../../platform/schemas/execution-metrics.schema.json).

### `self-healing`
- **Purpose:** controlled repair of automation failures that are not application defects.
- **Files:** `SKILL.md`, `healing-log.template.md`, `journal-event.template.json`.
- **Classifications:** environment, configuration, framework_defect, test_data,
  test_script, application. `assertion_changed` is always `false`.

### `qa-final-report`
- **Purpose:** read-only consolidation into one evidence-based report and recommendation.
- **Files:** `SKILL.md`, `QA-Final-Report.template.md`,
  `qa-final-report-html.structure.md`, `journal-event.template.json`, and a
  [renderer](../../.claude/skills/qa-final-report/renderer/README.md).
- **Renderer:** Node.js, no dependencies, no network:
  `node .claude/skills/qa-final-report/renderer/build-report.cjs <task-name> [--out <file>]`.
  It produces a **draft preview** (default `reports/qa-final-report-preview/index.html`
  inside the task), labeled *not journaled · not approved*, and refuses to write the
  official report files. Section tooltips are in Arabic (`tooltips-ar.cjs`).

### `security-testing` (partial)
- **Purpose:** risk-based security testing of Web apps and REST APIs (mobile out of scope).
- **Present:** `SKILL.md`, `SecurityScope.template.md`, `security-test-catalog.md`
  (categories A–H, applicability conditions, OWASP references, technique levels).
- **Missing:** `.claude/prompts/security-testing.md`, `SecurityRiskAssessment.template.md`,
  `SecurityTestScenarios.template.md`, `SecurityTestCases.template.csv`,
  `SecurityExecutionReport.template.md`, `SecurityFindings.template.md`,
  `security-testing-report-html.structure.md`, `journal-event.template.json`.
- **Integration pending** (items I-1 to I-7 in the skill): workflow stage, registry
  entry, `CLAUDE.md` gates and tooling rule, journal block, task-template folders, and
  downstream consumption by `qa-final-report` / `automation-generation`.
