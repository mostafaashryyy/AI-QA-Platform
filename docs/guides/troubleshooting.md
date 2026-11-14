# Troubleshooting

> © 2026 Mostafa Ashry. All rights reserved. View-only; see [LICENSE](../../LICENSE).

## 1. How failures surface

When a prerequisite or rule fails, a stage records a journal event with
`status: blocked` (or failed), reports the exact error code, and stops. It never
works around the problem. Look up the code in that skill's **Prerequisites** or
**Failure Conditions** table.

| Prefix | Skill |
|---|---|
| `PRD-E##` | `prd-generation` |
| `PC-E##` | `project-context` |
| `EX-E##` | `exploration` |
| `TD-E##` | `test-design` |
| `TR-E##` | `test-review` |
| `ME-E##` | `manual-execution` |
| `AG-E##`, `AG-W##` | `automation-generation` (errors, warnings) |
| `AE-E##` | `automation-execution` |
| `SH-E##` | `self-healing` |
| `QFR-E##`, `QFR-V##` | `qa-final-report` (errors, validation checks) |
| `ST-E##` | `security-testing` (not integrated) |

## 2. Workflow and gate issues

| Symptom | Likely cause | Resolution |
|---|---|---|
| Stage refuses to start: "approval missing" | The upstream key was never sent, or was sent mixed with other text | Reply with the exact key alone, e.g. `TEST_DESIGN_APPROVED` |
| "Approval is stale" | The approved artifact changed after approval (hash mismatch), or the upstream stage ran again | Re-review the current artifact and approve it again |
| `TEST_REVIEW_APPROVED` refused | A `Change Required` finding is still open | Revise test cases through `test-design`, approve, and run a new review |
| Manual execution or automation refuses although `TestCases.md` is approved | No current `TEST_REVIEW_APPROVED` bound to that exact hash (ADR-001) | Run `test-review` on the current version |
| Stage blocked: no active run | `journal/workflow-run.json` has `active_run_id: null` | Orchestration sets the run (skills never create it) |
| Stage refuses to write into `platform/templates/` | Template immutability (also enforced by `.claude/settings.json`) | Copy the template into `platform/tasks/<task-name>/` first |
| Prompt record error | Same `prompt_id` + `prompt_version` with a different hash | Bump `prompt_version` whenever prompt text changes |
| Automation generation selects no cases | No Active case with `Needs Automation = TRUE` that also meets the other filters | Check flags in `TestCases.md` and the latest approved manual results |
| Automation generation reports a missing `TestCases.csv` | The CSV is read for a flag cross-check but no skill defines producing it | Provide it with the same flags as `TestCases.md` (see Limitations) |

## 3. Playwright MCP

| Symptom | Resolution |
|---|---|
| MCP tools not available | Confirm `.mcp.json` exists, `enabledMcpjsonServers` contains `playwright`, and the server was approved in Claude Code |
| `cmd` not found (macOS/Linux) | Use the `npx`-based configuration in the [Configuration Guide](configuration.md#1-playwright-mcp-mcpjson) |
| Browser missing | Let Playwright install it, or install it with `npx playwright install` |
| `.playwright-mcp/` filling up | It is a scratch folder and git-ignored; clear it between sessions |

## 4. Automation toolchains

These notes come from the `automation-generation` and `automation-execution` skills.

| Binding | Issue | Resolution |
|---|---|---|
| `playwright-ts` | Browser build does not match the pinned Playwright version | `npx playwright install <browser>` from the project directory |
| `playwright-ts` | Discovery run writes reports | Use `npx playwright test --list --reporter=list` |
| `playwright-ts` | Text assertion fails on surrounding whitespace | Match `^\s*…\s*$` or compare trimmed values (approved value unchanged) |
| `playwright-ts` | Secrets visible in traces | Start tracing only after steps that type secrets (fixture-managed tracing) |
| `shaft-java-testng` | Newest SHAFT release needs a newer JDK than the task's Java level | Pin the newest release whose compiler target supports that level |
| `shaft-java-testng` | Allure CLI fails when the user-profile path contains a space | `mvn test -Dshaft.extraArgLine=-Duser.home=<path without spaces>` |
| `shaft-java-testng` | Run writes property/report files into the project | Keep them git-ignored (the scaffold `.gitignore` does this) |
| `shaft-java-testng` | ReportPortal errors | Set `rp.enable=false` as a Surefire system property unless ReportPortal is used |
| `playwright-java-testng` | Build fails on a JRE | Use a JDK; TestNG 7.12 requires Java 11+ |
| any | Tests pass but the build fails | Recorded as `harness_failed`, not `passed`; investigate the harness |

## 5. Self-healing

| Symptom | Meaning |
|---|---|
| `escalated` | Three attempts did not fix the failure; a human must decide |
| `SH-E04` | The only fix would change an assertion or step — this requires a Test Design revision, not healing |
| Failure classified `application` | Not healed; it is reported as a defect |

## 6. QA Final Report renderer

| Symptom | Resolution |
|---|---|
| Renderer refuses to write `reports/QA-Final-Report.*` | By design: only a journaled `qa-final-report` stage execution owns those files; the renderer writes a draft preview |
| No report is produced | A prerequisite failed (task folder, active run, journal, TestCases, current design/review approvals) |
| Report flagged for secrets | The renderer scans its output for credential values and e-mail addresses; remove them from the source artifacts |
