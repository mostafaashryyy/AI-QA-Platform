# Limitations & Roadmap

> © 2026 Mostafa Ashry. All rights reserved. View-only; see [LICENSE](../LICENSE).

This page lists what is **not** complete, based on the repository contents.

## 0. Not published

The versioned stage prompts (`.claude/prompts/`, ten files) are **withheld from this
public repository**. Every skill loads, hashes and records its prompt before running,
so the workflow stages cannot run as specified from this repository alone. Format,
versions and variables are described in the [Prompts Reference](reference/prompts.md).

## 1. Partially implemented

### Security Testing (`security-testing` 1.0.0)

| Present | Missing |
|---|---|
| `SKILL.md` (full two-phase specification) | `.claude/prompts/security-testing.md` |
| `SecurityScope.template.md` | `SecurityRiskAssessment.template.md` |
| `security-test-catalog.md` | `SecurityTestScenarios.template.md` |
| | `SecurityTestCases.template.csv` |
| | `SecurityExecutionReport.template.md` |
| | `SecurityFindings.template.md` |
| | `security-testing-report-html.structure.md` |
| | `journal-event.template.json` |

Integration items still open (from the skill's Integration Status): I-1 workflow
stage · I-2 registry entry · I-3 `CLAUDE.md` gates and ownership · I-4 Tooling Rule
extension for Playwright MCP · I-5 optional journal block · I-6 `security/` folders in
the task template · I-7 consumption by `qa-final-report` and `automation-generation`.

Until these exist, Security Testing is **not** a stage of any workflow run. Its
intended position (after Automation Execution and before the QA Final Report) is not
yet defined in the workflow file.

### QA Final Report renderer

The Node.js renderer builds a **draft preview** only. Journaling, the Markdown
companion and the approval request remain the responsibility of the
`qa-final-report` stage execution. Its section tooltips exist in Arabic only.

## 2. Planned

| Item | State |
|---|---|
| `reporting` skill (milestone summary, workflow diagram, HTML journal) | Registry entry only; no skill or prompt files |
| HTML rendering of the per-task execution journal | Described in [ai-qa-execution-journal.md](architecture/ai-qa-execution-journal.md); not implemented |
| `platform/knowledge-base/` | Folder reserved; empty |

## 3. Known gaps and inconsistencies

| # | Gap | Impact |
|---|---|---|
| G-1 | **Unresolved dependency:** `automation-generation` requires `test-design/TestCases.csv` (listed as an input in the workflow, the registry and the skill; prerequisite 9 checks that `Needs Automation` agrees between `TestCases.md` and the CSV, error `AG-E10`). **No existing skill generates this file** — `test-design` produces only `TestCases.md`. `qa-final-report` also reads the CSV when present. | Until a producer is defined, a CSV must be supplied manually with the same flags as `TestCases.md`, or Automation Generation stops at its prerequisite check |
| G-2 | `CLAUDE.md` Tooling Rule names only `exploration` and `manual-execution` as Playwright MCP users; the registry also allows optional read-only use by `automation-generation` and `self-healing` | Documentation inconsistency |
| G-3 | No workflow runner: task creation, run IDs and stage hand-offs are performed by a human operator | Manual orchestration effort |
| G-4 | `.mcp.json` uses `cmd /c` (Windows) and an unpinned `@playwright/mcp@latest` | Needs adjustment on macOS/Linux; MCP version can drift |
| G-5 | API automation: automation scaffolds target UI tests only | API checks are covered by exploration/manual execution only |
| G-6 | Mobile applications are out of scope for security testing | — |

## 4. Not verified in this repository

This repository ships no task instances or results. No claims are made here about
test outcomes, pass rates, or performance on any application.

## 5. Possible future improvements

- Complete and integrate `security-testing` (all items above).
- Define `TestCases.csv` generation in `test-design`, or drop the requirement.
- Implement the `reporting` skill and the HTML journal viewer.
- A lightweight orchestration script for task creation and run management.
- Cross-platform `.mcp.json` and pinned MCP server version.
- Populate `platform/knowledge-base/` with reusable, project-agnostic heuristics.
- Schema validation of journal files in the repository checks.
