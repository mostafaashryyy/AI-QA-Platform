---
name: security-testing
description: Security Testing stage of the AI QA Platform, for Web applications and REST APIs only (mobile applications are out of scope). Two gated phases. PLAN - from the task's approved PRD, ProjectContext and (when available) ExplorationReport, identifies assets, entry points, roles and trust boundaries, assesses threats and risks, maps them to OWASP guidance with justified applicability, and designs reviewed security test scenarios and test cases plus the rules of engagement (authorized targets, environment, technique levels); writes SecurityScope.md, SecurityRiskAssessment.md, SecurityTestScenarios.md and SecurityTestCases.csv under platform/tasks/<task-name>/security/, then HARD STOPS until SECURITY_PLAN_APPROVED. EXECUTE - runs only the approved, authorized, non-destructive checks against the approved target, collects evidence, classifies findings (Confirmed Vulnerability, Potential Vulnerability, Security Misconfiguration, Security Observation, False Positive, Not Reproducible) with a likelihood x impact severity, and writes SecurityExecutionReport.md, SecurityFindings.md and SecurityTestingReport.html, then HARD STOPS until SECURITY_TESTING_APPROVED. Never tests unapproved, production or third-party targets, never runs destructive, denial-of-service, malware or uncontrolled brute-force activity, never touches real user data, and never claims a vulnerability without evidence. Use when asked to "plan security testing", "assess security risks", "design security test cases", "run the approved security checks", "report security findings", or "revise the security report".
---

# Security Testing

## Stage Identity

| Field | Value |
|---|---|
| Skill | `security-testing` |
| Skill version | `1.0.0` |
| stage_id | `security-testing` (ordering is owned by the workflow, not this skill; **not yet added to any workflow**, see [Integration Status](#integration-status)) |
| Stage name | Security Testing |
| Prompt | `.claude/prompts/security-testing.md` (not published in this repository). `prompt_id: security-testing`, `prompt_version: 1.0.0` |
| Output structures | [`SecurityScope.template.md`](SecurityScope.template.md), [`SecurityRiskAssessment.template.md`](SecurityRiskAssessment.template.md), [`SecurityTestScenarios.template.md`](SecurityTestScenarios.template.md), [`SecurityTestCases.template.csv`](SecurityTestCases.template.csv), [`SecurityExecutionReport.template.md`](SecurityExecutionReport.template.md), [`SecurityFindings.template.md`](SecurityFindings.template.md), [`security-testing-report-html.structure.md`](security-testing-report-html.structure.md) |
| Test catalog | [`security-test-catalog.md`](security-test-catalog.md) (categories A–H, applicability conditions, OWASP references, technique levels) |
| Journal event template | [`journal-event.template.json`](journal-event.template.json) |
| Journal schemas | [`journal-event.schema.json`](../../../platform/schemas/journal-event.schema.json) (v1.8.0, generic fields only), [`prompt-record.schema.json`](../../../platform/schemas/prompt-record.schema.json), [`workflow-run.schema.json`](../../../platform/schemas/workflow-run.schema.json) |
| Upstream | Required: `prd-generation` (`PRD_APPROVED`), `project-context` (`PROJECT_CONTEXT_APPROVED`). Used when approved and current: `exploration` (`EXPLORATION_APPROVED`). Context only: `test-design`, `test-review`, `manual-execution` artifacts |
| Downstream | `automation-generation` (approved security cases flagged for automation), `automation-execution`, `qa-final-report` (security results as an input), after integration |
| Approval keys | `SECURITY_PLAN_APPROVED` (unlocks execution; also confirms the rules of engagement), `SECURITY_TESTING_APPROVED` (closes the stage) |
| MCP | `playwright` for browser-based checks in the EXECUTE phase only, browser access only (requires the Tooling Rule extension listed in [Integration Status](#integration-status)). Never in the PLAN phase. |
| Scope | Web applications and REST APIs. **Mobile applications and mobile security testing are out of scope.** |

```
APPROVED PRD + APPROVED ProjectContext (+ APPROVED ExplorationReport when available)
        ↓  PLAN: assets · entry points · roles · trust boundaries → threats → risk → OWASP mapping
        ↓        → scenarios → test cases → self-review → rules of engagement (authorization)
SecurityScope.md · SecurityRiskAssessment.md · SecurityTestScenarios.md · SecurityTestCases.csv
        ↓
⛔ HARD STOP → HUMAN REVIEW → SECURITY_PLAN_APPROVED (authorized targets, environment, technique levels)
        ↓  EXECUTE: preflight → approved cases only → evidence → finding classification → severity
SecurityExecutionReport.md · SecurityFindings.md · SecurityTestingReport.html · security/evidence/
        ↓
⛔ HARD STOP → HUMAN REVIEW → SECURITY_TESTING_APPROVED
```

## Purpose

Answer, from evidence only: which security risks matter for this application;
which security behaviours were checked, how, and with what result; which
weaknesses were **confirmed**, which are only **suspected**, and which are
configuration issues or observations; how severe each one is and why; and which
areas were **not** tested and why.

A security test result is a statement about the tested environment at the tested
time, within the authorized technique levels. It is never a guarantee that the
application is secure.

## Separation of concerns

| Concept | For this stage |
|---|---|
| **Skill** (this file) | *How* security scope, risk, scenarios, cases, authorization, safe execution, classification, severity, reporting, gates and journaling work. |
| **Catalog** ([`security-test-catalog.md`](security-test-catalog.md)) | *What* may be tested per category, when it applies, its OWASP references and its technique level. |
| **Prompt** | The versioned instruction, recorded by id and version with its text in `prompts.json`. |
| **Workflow** | *When* the stage runs. Not wired yet (see [Integration Status](#integration-status)). |
| **Journal** | *What happened*: sources, decisions, authorization, actions, evidence, results, validation, gate replies. |
| **Artifacts** | The seven outputs under `security/` plus `security/evidence/`. |
| `test-design` / `test-review` | Own the functional test cases and their review. This skill reuses their conventions for its own security cases; it never edits `TestCases.md` or `TestReview.md`. |
| `manual-execution` | Owns functional execution and `BugReports.md`. This skill never writes bug reports; it writes security findings. |
| `automation-generation` / `automation-execution` | Own automation code and runs. This skill only flags approved security cases as automation candidates. |
| `qa-final-report` | Owns the overall QA report. This skill provides its approved security results as an input. |

## Trigger Conditions

Run when a human, or the orchestration layer, asks for security testing of a
**named task**, or for a revision of a security artifact. If no task is named,
ask. Never guess a task. Phase:

- **PLAN** when no approved plan exists, or a plan revision is requested.
- **EXECUTE** only when the human asks to execute **and** a current
  `SECURITY_PLAN_APPROVED` exists.

The skill never starts itself, another stage, or the next phase.

## Prerequisites

### PLAN phase

| # | Prerequisite | Failure |
|---|---|---|
| 1 | `platform/tasks/<task-name>/` exists and is not under `platform/templates/` | `ST-E01` |
| 2 | `journal/workflow-run.json` → `active_run_id` is non-null (read only) | `ST-E02` |
| 3 | `journal/execution-log.json` is valid JSON with an `entries` array | `ST-E03` |
| 4 | `PRD_APPROVED` and `PROJECT_CONTEXT_APPROVED` exist and are current (post-approval hash equals the current file after LF normalization; no later execution of that stage) | `ST-E04` |
| 5 | The task's scope includes a Web application or REST API (ProjectContext / PRD). A mobile-only scope stops here | `ST-E05` |
| 6 | The prompt file declares `prompt_id` / `prompt_version`, not recorded with a different SHA-256 | `ST-E06` |

### EXECUTE phase (in addition)

| # | Prerequisite | Failure |
|---|---|---|
| 7 | `SECURITY_PLAN_APPROVED` exists and is current: the four plan artifacts are unchanged since the approval, and no later PLAN execution exists | `ST-E07` |
| 8 | `SecurityScope.md` §Rules of Engagement is complete: named authorizer, authorization reference, target list (URLs / base paths), environment type, time window, permitted technique levels, test accounts by source name, contacts and stop conditions | `ST-E08` |
| 9 | Every target is listed in §Rules of Engagement **and** is not a production system, unless production is explicitly authorized there (then only level `L0`) | `ST-E09` |
| 10 | No target is a third-party system the authorizer does not control (a publicly reachable demo instance operated by someone else is such a system: it is excluded unless its operator's published terms explicitly permit security testing and the authorization cites them) | `ST-E10` |
| 11 | The safety controls in §Rules of Engagement are confirmed: stop conditions, request-rate ceiling, synthetic test accounts and data only, no real user data in scope, an emergency contact, and how to restore the test accounts | `ST-E11` |

A failing prerequisite stops the phase before any tool touches the target: journal
a `stage_execution` with `status: blocked`, report the exact failure and the
artifacts or cases it affects, and STOP. Nothing is executed "partially" to work
around a missing authorization.

## Inputs

All paths are relative to `platform/tasks/<task-name>/`.

| Input | Path | Phase | Use |
|---|---|---|---|
| Task identity | `context/TaskContext.md` | both | Project, UI URL, API URL, environment as supplied |
| PRD (required) | `prd/PRD.md` | PLAN | Security-relevant requirements and business rules (`PRD FR-###`, NFRs, constraints) |
| ProjectContext (required) | `context/ProjectContext.md` | PLAN | Scope, roles, business rules, dependencies, risks (`PC BR/EB/RK/DEP-###`) |
| ExplorationReport (optional) | `exploration/ExplorationReport.md`, `exploration/evidence/` | PLAN | Observed pages, endpoints, roles, controls (`OBS-###`, `PB-###`); used only when approved and current |
| Functional test artifacts (context) | `test-design/TestCases.md`, `test-review/TestReview.md`, `execution/ExecutionReport.md`, `bugs/BugReports.md` | PLAN | Avoid duplicating functional coverage; reuse existing IDs in traceability |
| Plan artifacts | `security/SecurityScope.md`, `security/SecurityRiskAssessment.md`, `security/SecurityTestScenarios.md`, `security/SecurityTestCases.csv` | EXECUTE | The approved plan: the only cases that may be executed, and the rules of engagement |
| Journal | `journal/execution-log.json`, `journal/prompts.json`, `journal/workflow-run.json` | both | Approvals, hashes, run ID, prompt records |
| Prompt | `.claude/prompts/security-testing.md` | both | Loaded, hashed and recorded |
| Catalog | `.claude/skills/security-testing/security-test-catalog.md` | PLAN | Candidate checks per category with applicability conditions and technique levels |

A missing optional input is never a reason to invent its content: it is listed in
`SecurityScope.md` as a limitation (for example "no ExplorationReport: entry
points taken from documentation only, unverified").

## Outputs

| Phase | Artifact | Path | Notes |
|---|---|---|---|
| PLAN | Scope and rules of engagement | `security/SecurityScope.md` | Structure: [`SecurityScope.template.md`](SecurityScope.template.md) |
| PLAN | Risk assessment | `security/SecurityRiskAssessment.md` | Structure: [`SecurityRiskAssessment.template.md`](SecurityRiskAssessment.template.md) |
| PLAN | Scenarios and plan self-review | `security/SecurityTestScenarios.md` | Structure: [`SecurityTestScenarios.template.md`](SecurityTestScenarios.template.md) |
| PLAN | Test cases (structured) | `security/SecurityTestCases.csv` | Columns: [`SecurityTestCases.template.csv`](SecurityTestCases.template.csv). CSV is the structured format the workflow already uses (`TestCases.csv`). |
| EXECUTE | Execution report | `security/SecurityExecutionReport.md` | Structure: [`SecurityExecutionReport.template.md`](SecurityExecutionReport.template.md) |
| EXECUTE | Findings | `security/SecurityFindings.md` | Structure: [`SecurityFindings.template.md`](SecurityFindings.template.md). Written even when there are no findings (it then says so). |
| EXECUTE | HTML report | `security/SecurityTestingReport.html` | Structure: [`security-testing-report-html.structure.md`](security-testing-report-html.structure.md). One self-contained file. |
| EXECUTE | Evidence | `security/evidence/` | `EVD-###` continues the task-wide sequence |
| both | Journal | `journal/execution-log.json`, `journal/prompts.json` | Appended only |

The skill creates `security/` and `security/evidence/` inside the task folder
when they do not exist. It never writes to `platform/templates/`. Artifacts are
created on attempt 1 and **updated in place** afterwards (no `-v2` copies); history
lives in each artifact's Revision History and in the journal.

## Responsibilities

- **Scope** the security work from the approved sources: in-scope components,
  explicit exclusions (always including mobile applications), assumptions and
  limitations.
- **Model** the application: assets (`AST-###`), entry points (`EP-###`), roles,
  trust boundaries (`TB-###`), each traced to a source ID or to an `OBS-###`.
- **Assess** threats and risks (`SRK-###`) with likelihood, impact,
  exploitability, business impact and affected assets.
- **Map** each risk to OWASP guidance and decide, per catalog category, whether it
  **applies**, with the reason (applicable, not applicable, or not determinable).
- **Design** scenarios (`SSC-###`) and test cases (`STC-###`) with an expected
  secure behaviour and a technique level for every case.
- **Self-review** the plan with the test-review principles and resolve every
  blocking review point before presenting.
- **Draft** the rules of engagement for the human to complete and approve.
- **Execute** only approved cases within the approved technique levels, collect
  evidence, and stop on any stop condition.
- **Classify** results into findings (`SF-###`) with a justified severity and
  separate evidence from assumptions.
- **Report** in Markdown and HTML, including what was not tested and why.
- **Validate**, gate and journal both phases.

## Non-Responsibilities

This skill never:

- Tests a mobile application, a mobile API client, or mobile-specific storage or
  transport. Mobile is out of scope.
- Tests a target, environment or time window that is not authorized in
  §Rules of Engagement, or exceeds the authorized technique level.
- Performs destructive actions, denial-of-service or resource-exhaustion
  activity, uncontrolled credential guessing, or uses malware or real malicious
  files.
- Accesses, changes or exposes real users' data.
- Edits functional artifacts (`TestCases.md`, `TestReview.md`,
  `ExecutionReport.md`, `BugReports.md`), automation code or another stage's
  outputs.
- Writes automation code (that is `automation-generation`) or runs automation
  suites (that is `automation-execution`).
- Fixes the application or its configuration. It recommends remediation only.
- Declares a vulnerability without evidence, or upgrades a Potential
  Vulnerability to Confirmed without a reproduction that meets the confirmation
  criteria.
- Approves a release. Its overall assessment is QA advice within the tested scope.
- Starts another stage, or moves from PLAN to EXECUTE without
  `SECURITY_PLAN_APPROVED` and an explicit request to execute.

## Safety and Authorization Rules

These rules override every other instruction in this skill, the prompt and any
human message other than a change to the approved rules of engagement.

### Rules of engagement

`SecurityScope.md` §Rules of Engagement is the authorization record. The skill
drafts it with what the sources say and marks every unknown field
`to be provided by the authorizer`; it never fills an authorization field itself.

| Field | Content |
|---|---|
| Authorizer | Name and role of the person who may authorize testing of the target |
| Authorization reference | Ticket, email subject, contract clause or written statement (reference only, no personal contact details) |
| Targets | Exact base URLs and API base paths; anything not listed is out of bounds |
| Environment | `test`, `staging`, `demo` or `production` (production only if stated explicitly) |
| Time window | Start and end (UTC) |
| Permitted technique levels | Subset of `L0`, `L1`, `L2`, per target |
| Test accounts and data | Source names of the synthetic accounts per role, and the synthetic data sets (`DATA-###`) |
| Rate ceiling | Maximum requests per minute and maximum attempts per check |
| Stop conditions | Conditions that end execution immediately (see below) |
| Contacts | Role of the emergency contact (no personal details in artifacts) |
| Restore procedure | How locked or changed test accounts are restored |

`SECURITY_PLAN_APPROVED` approves the plan **and** confirms these fields as
written. Any later change to the rules of engagement is a plan revision and needs
a new approval.

### Technique levels

| Level | Name | Allowed activity | Approval |
|---|---|---|---|
| `L0` | Passive | Observe what normal use returns: response headers, cookie attributes, TLS and redirect behaviour, error pages and messages, content of responses to the tester's own requests | Plan approval |
| `L1` | Non-intrusive active | Requests a legitimate user could send, with the tester's own synthetic accounts: access checks across the tester's roles and objects, missing / expired / altered tokens, boundary and malformed values from the catalog's safe input classes, a small bounded number of repetitions below the rate ceiling | Plan approval, level listed for the target |
| `L2` | Controlled intrusive | Checks with a controlled side effect on test assets only, for example triggering a lockout on a dedicated test account, or uploading a harmless test file of a disallowed type | Plan approval **and** the case ID listed individually in §Rules of Engagement |

There is no higher level. Activities outside `L0`–`L2` are prohibited, whatever
the request.

### Prohibited at all times

- Testing production without explicit authorization, or above `L0` in production.
- Destructive actions: deleting, corrupting or mass-changing data, changing
  configuration, persistent changes outside the tester's own test assets.
- Denial-of-service, load or resource-exhaustion activity; exceeding the rate
  ceiling.
- Uncontrolled credential guessing; lockout and rate-limit checks use a
  dedicated test account and the minimum number of attempts that shows the
  control.
- Malware, ransomware, real malicious files or working exploit chains. File
  checks use harmless synthetic files.
- Accessing, keeping or showing real users' data. If real personal data appears,
  stop that check, do not store it, and record only that it occurred.
- Pivoting to, or testing, third-party systems (identity providers, CDNs,
  payment providers, analytics, other tenants) unless listed as targets.
- Social engineering, physical testing, or testing people.

### Stop conditions

Stop all execution at once, record the time and the last action, and report to the
human when any of these occurs:

- The target becomes slow, unstable or returns repeated server errors after a check.
- Real user data, another tenant's data, or a secret of a real system is exposed.
- A check has an effect beyond the tester's own test assets.
- A target redirects to, or depends on, a system that is not authorized.
- The time window ends, or the authorizer withdraws authorization.

A check that cannot be executed within these rules is recorded as
**NOT EXECUTED** with the reason; it is never run in a reduced or altered form
without a plan revision.

## Security Test Design Rules

Test design reuses the conventions of `test-design` (one expected result per
case, traceability, no invented behaviour) for security cases. It never edits
the functional `TestCases.md`.

**Applicability first.** For every catalog category A–H the plan records
`applicable`, `not applicable` or `not determinable`, with the reason and the
source (for example "no file upload entry point in ProjectContext or exploration
→ category G not applicable"). Only applicable categories produce cases. A
`not determinable` category is a limitation, not a case.

**Scenarios** (`SSC-###`) describe one threat against one asset through one entry
point: actor, precondition, intended misuse, the control that should prevent it,
related risks (`SRK-###`) and OWASP references.

**Test cases** (`STC-###`) contain exactly these fields (also the CSV columns):

| Field | Rule |
|---|---|
| Test Case ID | `STC-###`, never reused |
| Test Case Title | What is verified, stated as the expected control |
| Security Category | One of A–H (catalog) |
| Related Requirement | `PRD FR-###`, `PC BR/EB/RK-###`, `OBS-###`, or the named standard control (e.g. an ASVS requirement) when the sources are silent |
| Risk Description | The risk (`SRK-###`) this case addresses, in one sentence |
| Case Type | `Positive` (the control allows legitimate use), `Negative` (invalid input or state is rejected) or `Abuse` (misuse by an authenticated or unauthenticated actor is prevented) |
| Technique Level | `L0`, `L1` or `L2` |
| Preconditions | Account role, state and data, by source name |
| Test Data | `DATA-###` synthetic data references; never real data or secret values |
| Test Steps | Numbered, executable by another tester without further explanation, within the technique level |
| Expected Result | The secure behaviour, observable and single (for example "the API returns 403 and no object data") |
| Actual Result | Empty in PLAN; observed behaviour in EXECUTE |
| Execution Status | `NOT RUN` in PLAN; `PASS`, `FAIL`, `BLOCKED` or `NOT EXECUTED` in EXECUTE |
| Severity | Planned risk severity in PLAN; finding severity in EXECUTE (or `—` when PASS) |
| Evidence | `EVD-###` IDs in EXECUTE |
| OWASP Reference | Top 10 / API Top 10 category and WSTG or ASVS ID from the catalog |
| Automation Candidate | `TRUE` only if the check is deterministic, `L0`/`L1`, and repeatable without side effects |

**Expected result basis.** The expected secure behaviour comes from a requirement,
a business rule, an observed baseline, or a named security standard. When none
applies the case is marked `Exploratory` and its expected result
`Not established`, exactly as in `test-design`.

**Test data.** Synthetic only: test accounts per role supplied by the authorizer,
harmless placeholder values and test files from the catalog's safe classes.
Payload strings are not stored in the plan; steps name the input class (for
example "a value from safe input class IC-03") defined in the catalog.

## Risk Assessment Rules

Each risk `SRK-###` records: threat, affected assets (`AST-###`), entry points
(`EP-###`), trust boundary crossed, **likelihood**, **impact**,
**exploitability**, **business impact**, existing controls known from the
sources, and the source or the label **analysis-derived**.

| Factor | Low | Medium | High |
|---|---|---|---|
| Likelihood | Requires rare conditions or insider access | Plausible for an authenticated user | Reachable by anonymous users through a public entry point |
| Impact | Minor information or no data exposure | Exposure or change of one user's data, or partial loss of a function | Exposure or change of many users' data, privilege gain, or loss of a critical function |
| Exploitability | Needs specialist knowledge and chained conditions | Needs moderate skill or a valid account | Needs only a browser or a standard HTTP client |

**Severity matrix** (likelihood × impact). Exploitability and business impact
may move the result one step up or down; the move and its reason are written next
to the severity.

| Likelihood \ Impact | Low | Medium | High |
|---|---|---|---|
| **High** | Medium | High | Critical |
| **Medium** | Low | Medium | High |
| **Low** | Low | Low | Medium |

`Informational` is used for observations without a demonstrated security impact.
A risk is a planning statement: it never becomes a finding without an executed
check and evidence.

## Plan Self-Review

Before the PLAN phase stops, the skill reviews its own plan with the
`test-review` principles and records the result in
`SecurityTestScenarios.md` §Plan Review. Each review point is **Change Required**
(fixed before presenting) or **Advisory** (listed for the human).

| Check | Rule |
|---|---|
| SR-01 | Every applicable category has at least one case; every `not applicable` has a reason and source |
| SR-02 | Every case traces to a risk and to a requirement, observation or named standard |
| SR-03 | Every expected result is single, observable and states the secure behaviour |
| SR-04 | Every step is executable by another tester and stays within the case's technique level |
| SR-05 | No step requires a prohibited activity; every `L2` case is marked for individual authorization |
| SR-06 | Test data is synthetic and referenced by `DATA-###`; no secret or real value appears |
| SR-07 | No duplicate of an approved functional test case; overlaps are referenced, not repeated |
| SR-08 | Mobile targets, clients and storage appear only under exclusions |
| SR-09 | Every target in the cases is listed in the draft rules of engagement |
| SR-10 | Automation Candidate is `TRUE` only for deterministic `L0`/`L1` cases |

The self-review does not replace human review: the plan still stops for
`SECURITY_PLAN_APPROVED`.

## Tooling

| Tool | Phase | Use |
|---|---|---|
| Local file tools (read, hash, write) | both | Read sources, write artifacts, hash, redact evidence, append to the journal |
| Playwright MCP (`playwright`) | EXECUTE | Browser access to the authorized Web targets for browser-observable checks (headers, cookies, redirects, role-based UI access, session behaviour). Browser access only, never automation |
| HTTP client (e.g. `curl`) | EXECUTE | Single, explicit requests to authorized API base paths for API checks, within the rate ceiling |
| Other security tools | EXECUTE | Only when named in §Rules of Engagement, at the passive or non-intrusive profile matching the case level; tool name, version and profile are journaled |

No tool is used in the PLAN phase against any target. Commands and journal
entries name credentials by source only.

## Execution Rules

1. **Preflight** (no security check yet): prerequisites 1–11; every target
   matches §Rules of Engagement; the current time is inside the window; each
   test account can sign in through normal use; the environment matches the
   authorized type. A mismatch is `ST-E08`–`ST-E11`: stop.
2. **Select** only cases of the approved `SecurityTestCases.csv` whose technique
   level is permitted for their target; `L2` cases only when individually listed.
3. **Execute** the steps exactly as written, one case at a time, within the rate
   ceiling. Record the actual result immediately.
4. **Watch** for stop conditions after every check. On any of them, stop all
   execution, record it, and go straight to reporting.
5. **Restore** test accounts changed by an `L2` case with the approved procedure,
   and record that it was done.

| Status | When |
|---|---|
| `PASS` | The expected secure behaviour was observed |
| `FAIL` | The expected secure behaviour was not observed, with steps performed as written; analysed in [Finding Classification](#finding-classification) |
| `BLOCKED` | The case could not be completed because of the environment, data, account or tool, not the control under test |
| `NOT EXECUTED` | Not run: level not authorized, unsafe under the [Safety and Authorization Rules](#safety-and-authorization-rules), stopped by a stop condition, or Exploratory without an established expected result. The reason is always stated |

A deviation from the written steps is recorded with its reason. A substantive
deviation means the case is `NOT EXECUTED` and the plan needs revision.

## Evidence Rules

Evidence follows the `manual-execution` conventions, stored under
`security/evidence/`:

- **Mandatory** for every `FAIL`, every finding and every `BLOCKED` case;
  recommended for key `PASS` observations.
- **Types:** `screenshot`, `network` (request and response), `api_response`,
  `browser_state` (cookies, storage keys), `console`, `ui_text`, `url`,
  `application_output`, `other`.
- **Every item** records: `EVD-###` (task-wide sequence), type, capture status,
  related case(s) and finding(s), source action, path, SHA-256, capture time, and
  redactions.
- **Minimal:** capture only what proves the observation (relevant headers, status
  code, the field that should not be there), not whole data sets.
- **Never** capture real user data, other tenants' data or a working secret; if it
  appears, record `not_captured` with the reason.
- **Never fabricate** or alter evidence beyond marked redaction.

Every finding separates **Evidence** (what was observed, with `EVD-###`) from
**Assumptions** (what is inferred but not observed). An assumption never raises
a classification or a severity on its own.

## Finding Classification

Every non-`PASS` result that indicates a security weakness, and every relevant
`L0` observation, becomes one finding `SF-###` with exactly one class:

| Class | Criteria |
|---|---|
| **Confirmed Vulnerability** | The expected secure behaviour failed, reproduced at least twice with the written steps, with evidence showing the security impact (for example data of another account returned) |
| **Potential Vulnerability** | Indicators of a weakness, but impact not demonstrated, reproduction incomplete, or confirmation would need a technique level that is not authorized |
| **Security Misconfiguration** | A configuration deviates from the expected secure setting (headers, cookie attributes, TLS, CORS, verbose errors, debug exposure, default settings), evidenced from responses |
| **Security Observation** | Relevant information without a demonstrated weakness (for example version disclosure, a control that works but could be stronger) |
| **False Positive** | An indicator that analysis or re-check showed is not a weakness; kept for traceability with the reason |
| **Not Reproducible** | Seen once, not reproduced in at least two further attempts within the rate ceiling; kept with the original evidence |

Each finding records: Finding ID, Title, Description, Affected Component,
Reproduction Steps (safe, level-bounded), Expected Behaviour, Actual Behaviour,
Evidence, Assumptions, Severity, Likelihood, Impact, Severity Rationale, OWASP
Mapping, Related Cases and Risks, Recommended Remediation, and Retest Status
(`Not retested`, `Retest passed`, `Retest failed`, `Not applicable`).

## Severity Rules (findings)

- Severity uses the matrix in [Risk Assessment Rules](#risk-assessment-rules)
  with the **observed** likelihood and impact, not the planned ones.
- Every severity has a written rationale naming the evidence and any one-step
  adjustment for exploitability or business impact.
- A **Potential Vulnerability** carries a provisional severity labelled
  `provisional`, based only on what was observed.
- **Security Observation** and **False Positive** are `Informational`;
  **Not Reproducible** keeps the severity the single observation would have had,
  labelled `unconfirmed`.
- Priority is not assigned here; it belongs to the people who plan remediation.

## Secrets and Sensitive Data

The platform Secrets Rule applies in full. In addition:

- Test-account credentials, tokens and session identifiers are referenced by
  source name only and redacted in evidence as `[REDACTED: <kind>]`, with each
  redaction recorded.
- A token or identifier needed to describe a finding is shortened to a
  non-usable form (for example its type and length) in reports.
- No real personal data is copied into any artifact; synthetic data values may be
  named by `DATA-###`.
- Before presenting, both phases scan their outputs for credential values present
  in the session environment (raw and base64) and for e-mail addresses.

## Reporting Rules

- `SecurityExecutionReport.md`: environment, rules of engagement in force,
  per-case results, deviations, stop events, and coverage per category.
- `SecurityFindings.md`: every finding with all classification fields, grouped by
  class and ordered by severity; it states "No findings" when there are none.
- `SecurityTestingReport.html`: one self-contained page rendered from the same data
  as the Markdown, with Executive Summary, Application and Environment, Scope,
  Methodology, OWASP Coverage, Execution Statistics, Findings by Severity,
  Detailed Findings, Evidence, Recommendations and Overall Security Assessment.
- **Tested versus not tested** is always shown: categories not applicable, not
  determinable, not authorized, `NOT EXECUTED` and `BLOCKED` cases are listed
  with reasons.
- The **overall security assessment** is a QA statement about the tested scope
  at the tested time (no guarantee of security, not a release approval).

## Traceability

IDs are never reused or replaced. Chains shown in the reports:

- Requirement / observation → risk `SRK-###` → scenario `SSC-###` → case `STC-###`
- Case → status → evidence `EVD-###` → finding `SF-###`
- Finding → OWASP mapping → remediation → retest status
- Category A–H → applicability decision → source

Existing IDs (`PRD FR-###`, `PC BR/EB/RK/DEP-###`, `OBS-###`, `PB-###`,
`TC-###`, `BUG-###`, `DATA-###`) are cited as they are, never renumbered.

## Validation Rules (self-checks before presenting)

| Check | Phase | Rule |
|---|---|---|
| ST-V01 | both | All prerequisites of the phase were verified before any other action |
| ST-V02 | PLAN | Every catalog category A–H has an applicability decision with reason and source |
| ST-V03 | PLAN | Every asset, entry point, role and trust boundary traces to a source or `OBS-###` |
| ST-V04 | PLAN | Every risk has likelihood, impact, exploitability, business impact, affected assets and a severity from the matrix |
| ST-V05 | PLAN | Every case has all required fields; IDs are unique; the CSV and `SecurityTestScenarios.md` list the same cases |
| ST-V06 | PLAN | Plan self-review SR-01–SR-10 done; no Change Required point open |
| ST-V07 | PLAN | §Rules of Engagement lists every target used by a case; unknown authorization fields are marked for the authorizer, never filled by the skill |
| ST-V08 | EXECUTE | Only approved cases at permitted levels were executed; every other case is `NOT EXECUTED` with a reason |
| ST-V09 | EXECUTE | No prohibited activity occurred; request counts stayed under the rate ceiling; stop conditions were checked after every case |
| ST-V10 | EXECUTE | Every `FAIL` and finding has evidence; every finding has exactly one class and all required fields |
| ST-V11 | EXECUTE | Every severity follows the matrix and has a rationale; evidence and assumptions are separated |
| ST-V12 | EXECUTE | Statistics in all three reports agree with the per-case results (executed = PASS + FAIL + BLOCKED; planned = executed + NOT EXECUTED) |
| ST-V13 | EXECUTE | The HTML report parses, is self-contained, and its relative links resolve |
| ST-V14 | both | No credential value, token or e-mail address in any output (raw and base64) |
| ST-V15 | both | No upstream artifact was modified (SHA-256 before = after) |
| ST-V16 | both | Mobile appears only as an exclusion |

A failing check caused by the skill's own output is corrected and recorded in
`fixes`. A check that still fails is reported plainly; approval is never
requested as if the phase were validated.

## Failure Conditions

| Code | Condition | Event status |
|---|---|---|
| ST-E01 – ST-E06 | PLAN prerequisites (task, run, journal, approvals, Web/API scope, prompt) | `blocked` |
| ST-E07 – ST-E11 | EXECUTE prerequisites (plan approval, rules of engagement, production, third party, safety controls) | `blocked` |
| ST-E12 | A required tool is unavailable, or the target is unreachable at preflight | `failed` |
| ST-E13 | A stop condition occurred during execution | `failed` (reports still written, marked **Incomplete — stopped**, remaining cases `NOT EXECUTED`) |
| ST-E14 | A secret or real personal data in an output cannot be removed | `failed`; the affected output is withheld |
| ST-E15 | An upstream or plan artifact changed during the run | `failed` |
| ST-E16 | A `security/` artifact exists without a journaled `security-testing` origin (never overwritten) | `blocked` |
| ST-E17 | The journal cannot be appended (outputs, if written, are declared **not journaled**) | `failed` |

Non-`PASS` test results are **results**, not stage failures.

## Revision Behavior

1. A change request is journaled as a `revision_request` with the verbatim message
   (secrets redacted).
2. Re-check the prerequisites of the affected phase.
3. **PLAN revision:** update the four plan artifacts in place, bump their minor
   version, add Revision History rows, re-run the self-review and ST-V01–V07.
   Any plan revision voids an earlier `SECURITY_PLAN_APPROVED` and, if execution
   already happened, marks its results as based on a superseded plan.
4. **EXECUTE revision** (for example a retest of a fixed finding): re-run only the
   requested approved cases, add the new results as a new attempt, update Retest
   Status, and keep earlier results in the Revision History. Earlier evidence is
   never deleted.
5. Re-validate, journal a new `stage_execution` with the `revision` object,
   present, and STOP.

## Hard-Stop Behavior

- **After PLAN:** present the four plan artifacts, the applicability decisions,
  the top risks, the self-review result, and the list of rules-of-engagement fields
  the authorizer must complete. STOP until `SECURITY_PLAN_APPROVED`.
- **After EXECUTE:** present the three reports, statistics, findings by class and
  severity, stop events, not-tested areas and the validation result. STOP until
  `SECURITY_TESTING_APPROVED`.
- Stop **before** any execution when authorization is incomplete or unclear, a
  target is not listed, or the environment differs from the authorized one. Never
  bypass a stop to finish testing.

## Approval Gates

| Key | Gate | When accepted |
|---|---|---|
| `SECURITY_PLAN_APPROVED` | After PLAN | Status `Approved` in the four plan artifacts; `approval_decision` with their post-update SHA-256; EXECUTE becomes allowed **on an explicit request to execute** |
| `SECURITY_TESTING_APPROVED` | After EXECUTE | Status `Approved` in the three reports; `approval_decision` with their post-update SHA-256; security results become available to downstream stages |

- Only the **exact, case-sensitive, standalone** key is valid. `approved`,
  `looks good`, `go ahead`, the key with other text, the other gate's key, or
  silence are journaled as `approval_decision` with `not_accepted`, and the phase
  stays stopped. A message that also requests changes proceeds to revision.
- **Stale** (the key is not accepted): an artifact under review changed after it
  was presented, a later execution of the same phase exists, or an upstream
  approval used by the phase is no longer current.
- `SECURITY_TESTING_APPROVED` approves the report, not the application's security
  and not a release.

## Journal Integration

Use the existing journal only (`journal/execution-log.json`, schema v1.8.0;
`journal/prompts.json`). Entries are appended, never modified. The stage's
constant values are in [`journal-event.template.json`](journal-event.template.json).

| Moment | Event type | Status |
|---|---|---|
| Prerequisite not met | `stage_execution` | `blocked` |
| PLAN artifacts written (each attempt) | `stage_execution` | `awaiting_approval` (`approval_key: SECURITY_PLAN_APPROVED`) |
| EXECUTE reports written (each attempt) | `stage_execution` | `awaiting_approval` (`approval_key: SECURITY_TESTING_APPROVED`) |
| Tool unavailable, stop condition, unremovable secret, changed source, journal failure | `stage_execution` | `failed` |
| Change requested | `revision_request` | `revision_requested` |
| Reply is the current gate's key and the artifacts are current | `approval_decision` | `approved` |
| Any other reply | `approval_decision` | `approval_not_accepted` |

**Field use with schema 1.8.0** (no schema change; generic fields only):

- Identity, prompt, `trigger`, `input_references`, `tools_used`, `actions`,
  `decisions`, `output_artifacts`, `validation`, gate fields: as in the other
  skills. `prompt_variables`: `task_name`, `task_path`, `workflow_run_id`,
  `phase` (`plan` or `execute`), `ui_url`, `api_url`.
- `mcp_used` / `mcp_actions`: Playwright MCP calls in EXECUTE (none in PLAN).
- `environment`: the authorized environment and target as verified at preflight.
- `statuses`: case counts `PASS`, `FAIL`, `BLOCKED`, `NOT_EXECUTED`.
- `evidence`: the security evidence items.
- `gaps`: categories not applicable / not determinable / not authorized.
- Security case IDs (`STC-###`) and findings (`SF-###`) are recorded in the
  artifacts and summarized in `output_artifacts[].summary` and `decisions`,
  because the schema's `test_results`, `test_case_ids` and `bugs` fields accept
  only `TC-###` / `BUG-###`. A dedicated `security_testing` block is a pending
  integration item.

## HTML Journal Observability

From the journal plus the artifacts, the planned HTML journal can show for each
phase: why it ran; the prompt version; the workflow run; the status; the
artifacts with links and hashes; the applicability decisions; the authorized
targets, environment and technique levels; case statistics; findings by class and
severity; stop events; validation results; the approval requirement and result;
and revisions. Navigation: Finding → case → evidence; Risk → scenario → case;
Gate → approved artifact hashes.

## Integration Status

The skill is complete as a stand-alone definition but is **not integrated** into
the platform yet. Until the human approves integration, it is not part of any
workflow run. Pending items:

| # | Item | Where |
|---|---|---|
| I-1 | Add the `security-testing` stage (order, dependencies, outputs, both gates) | `platform/workflows/default-qa-workflow.yaml` |
| I-2 | Add the skill entry (status, version, upstream / downstream) | `platform/registry/skills.yaml` |
| I-3 | Add both gate rows and the ownership bullet for `security/` | `CLAUDE.md` |
| I-4 | Extend the Tooling Rule so Playwright MCP may be used by `security-testing` EXECUTE for browser access | `CLAUDE.md` |
| I-5 | Optional `security_testing` journal block (cases, findings, authorization summary) as a minor schema version | `platform/schemas/journal-event.schema.json`, `docs/architecture/ai-qa-execution-journal.md` |
| I-6 | Add `security/` and `security/evidence/` to new tasks | `platform/templates/task-template/` (between tasks, not during one) |
| I-7 | Let `qa-final-report` read approved security results, and `automation-generation` accept `STC-###` automation candidates | those skills, by their own revision |

Supporting files referenced in [Stage Identity](#stage-identity) are created in
the next implementation steps.
