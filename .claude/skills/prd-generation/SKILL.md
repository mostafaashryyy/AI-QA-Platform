---
name: prd-generation
description: PRD Generation stage of the AI QA Platform. Converts one task's intake (context/TaskContext.md, supporting documents, user-supplied information, and the project UI/API URLs) into a structured, traceable 20-section PRD at platform/tasks/<task-name>/prd/PRD.md. Documented intent only; it performs no UI or API exploration. Then HARD STOPS until the exact standalone key PRD_APPROVED. Revisions update the same PRD.md with a version bump. Generic for any web, API, mobile or UI+API project. Use when asked to "generate the PRD", "write requirements for <task>", "create a PRD from this user story / URL", or "revise the PRD".
---

# PRD Generation

| Field | Value |
|---|---|
| Skill / version | `prd-generation` `1.0.1` |
| Prompt | `.claude/prompts/prd-generation.md` (not published in this repository) (`prompt_id: prd-generation`, `prompt_version: 1.0.0`). It holds the generation instructions and per-section wording; follow it. |
| Output structure | [`PRD.template.md`](PRD.template.md): section layout, ID formats, citation format and the "not provided" wording |
| Journal | [`journal-event.template.json`](journal-event.template.json) (stage constants), [`journal-event.schema.json`](../../../platform/schemas/journal-event.schema.json) v1.2.0, [`prompt-record.schema.json`](../../../platform/schemas/prompt-record.schema.json), [`workflow-run.schema.json`](../../../platform/schemas/workflow-run.schema.json) |
| Workflow | Stage `prd-generation` (order 1) in [`default-qa-workflow.yaml`](../../../platform/workflows/default-qa-workflow.yaml) |
| Flow | Task creation → **PRD Generation** → `prd/PRD.md` → ⛔ HARD STOP → `PRD_APPROVED` → `project-context` |
| MCP | **None.** Playwright MCP is never used. |

This skill defines *how* the PRD is generated, validated, gated, revised and
journaled. The prompt, template, workflow and schemas above are authoritative
for their own content, and this skill must follow every rule in them even where
this file does not repeat it. Where this file and the journal template disagree
on `next_stage`, this file wins (see [Journal](#7-journal)).

## 1. Purpose and scope

Turn one task's supplied information into a **Product Requirements Document**:
a structured, traceable, testable-where-possible statement of **documented
intent**. Project Context consumes it as its only requirements source.

The PRD is a requirements artifact only. This stage never:

- explores the application: no browser, Playwright MCP, navigation, login,
  clicking, form submission, DOM or network inspection, API endpoint discovery or
  calls, or workflow exploration;
- records selectors, layouts, field behavior, validation or error messages,
  credentials or UI components that no source states;
- invents endpoints, request or response schemas, authentication behavior, status
  codes, business rules, roles, permissions, workflows, database behavior,
  expected results, acceptance criteria, NFR values, constraints or owners;
- produces test cases, test data, exploration findings, bugs, automation,
  execution results or reports;
- creates `ProjectContext.md` or starts Project Context, even after approval;
- creates, renames or copies task folders, creates or edits `TaskContext.md`, or
  creates a `workflow_run_id`;
- overwrites a PRD it did not produce.

## 2. Preconditions, inputs and outputs

Run only when a human asks to generate or revise the PRD of a **named task**. If
no task is named, ask for one. Never guess it. All preconditions are mandatory,
and a missing prerequisite is reported, never created:

| # | Precondition | Failure |
|---|---|---|
| 1 | `platform/tasks/<task-name>/` exists and is not under `platform/templates/` | `PRD-E01` / `PRD-E02` |
| 2 | `context/TaskContext.md` exists (written at task creation, never by this skill) | `PRD-E03` |
| 3 | `journal/workflow-run.json` has a non-null `active_run_id` (owned by orchestration; read only) | `PRD-E04` |
| 4 | At least one requirement input exists: description or user story, acceptance criteria, scope, additional information, a supporting document, information in the request, or a project URL. URL-only input is allowed; the PRD is then mostly `Not provided` plus Open Questions, and says so explicitly. | `PRD-E05` |
| 5 | `prd/PRD.md` is absent, or the journal shows a `prd-generation` `stage_execution` that produced it | `PRD-E09` |

**Inputs** (read completely before writing anything):

- `TaskContext.md` § Identity (Task ID, Name, Type, Project Name), § Project
  Entry Points (UI and API URL) and § Task Intake (description, acceptance
  criteria, scope, out of scope, additional information). Task ID defaults to the
  folder name only if the field is unfilled, and that is recorded as a decision.
- Local supporting documents listed in the intake or the request.
- Information supplied in the conversation. It is recorded verbatim in
  `trigger.user_message`, cited in the PRD as `User message (journal EVT-NNNN)`
  (the ID of the event about to be written), and never written back into
  `TaskContext.md`.
- `workflow_run_id` from `journal/workflow-run.json` → `active_run_id`.
- The prompt.

**Outputs.** Exactly one artifact, `platform/tasks/<task-name>/prd/PRD.md`
(created on the first run, updated in place on revisions), plus appended records
in `journal/execution-log.json` and `journal/prompts.json`. No other file is
created or modified: never `TaskContext.md`, `ProjectContext.md`,
`workflow-run.json` or anything under `platform/templates/`.

## 3. Source-of-truth and URL rules

**Priority**, highest first. A higher level wins, but conflicts and ambiguities
are **never silently resolved**: they become a `GAP-###` citing both sources.

1. Explicit user / task requirements. A reviewer's change request counts here
   and is registered as a new `SRC-###` citing its `revision_request` event.
2. Explicit acceptance criteria
3. Explicit project information
4. Verified source information from a provided URL, within the URL rules below
5. Clearly labeled assumptions, in §17 only. An assumption never becomes an FR,
   BR, AC or NFR.
6. Unknown, recorded as `GAP-###` / `OQ-###`. A missing owner is `not stated`.

**URL rules**, for each provided UI or API entry URL:

1. Record whether it is present and well-formed, and register it as `SRC-###`.
2. Optionally make at most **one** plain, non-browser HTTP GET per URL, e.g.
   `curl -sS -L --max-time 20` through the shell. Record the exact tool and
   command, the HTTP status and the timestamp in the input reference `notes`.
   From the response, use only the resource's self-identification (such as the
   HTML `<title>`), and only to confirm the product or source name.
3. **Forbidden:** Playwright MCP or any browser, following links, a second
   request, authentication, form submission, reading UI elements, fields,
   messages or credentials from the response, and probing API paths.
4. If the URL is inaccessible or no suitable tool exists, record `inaccessible`
   or `not_accessed` with the reason, fabricate nothing, continue if the other
   inputs suffice, and raise a GAP or OQ for what is missing. An inaccessible URL
   is **not a failure**.
5. The PRD records each entry point and marks detailed UI or API behavior as
   **Requires exploration** in §12, §13 and §20.

## 4. PRD content rules

Write all **20 sections**, always present and in this order, following
[`PRD.template.md`](PRD.template.md) and the prompt's PRD Structure for the
per-section rules and the required "not provided" wording:

1 Document Information · 2 Source Information · 3 Problem Statement · 4 Goal ·
5 User Story · 6 Scope · 7 Actors / Roles · 8 Functional Requirements ·
9 Business Rules · 10 Acceptance Criteria · 11 Data Requirements ·
12 UI Requirements · 13 API Requirements · 14 Non-Functional Requirements ·
15 Dependencies · 16 Constraints · 17 Assumptions · 18 Gaps and Open Questions ·
19 Traceability · 20 QA Preparation Notes

Rules that apply across sections:

- **Sources.** Register every source as `SRC-###` in §2 with its access status
  (`read`, `missing`, `accessed`, `inaccessible`, `not_accessed`). Every
  statement cites an `SRC-###`, optionally with a section or short quote.
- **Document Information** holds real values only: PRD ID `PRD-<task-id>`, the
  run ID from the run context, `Created` / `Last updated` from the system clock
  (UTC), and the version per [§6](#6-approval-gate-hard-stop-and-revisions).
- **Atomic items.** Each FR and BR is a single, independently understandable,
  traceable and, where possible, testable statement.
- **Acceptance criteria** are kept verbatim as `AC-###` with their original
  labels, and never created. If none were supplied, write exactly
  `Acceptance criteria were not explicitly provided.`
- **Uncertainty is explicit:** `Unknown`, `Not provided.`, Scope Not Defined,
  §17 assumptions, §18 gaps and open questions. Out of Scope holds explicit
  exclusions only.
- **Traceability (§19)** maps Source → FR → BR → AC. Every FR has a source, and
  "Requirements without a source" must be None. An untraceable statement is
  removed or restated as a GAP or OQ.
- **§20** is preparation for later stages only. Nothing is claimed as observed.
- **IDs** are stable across revisions. A removed item's ID is never reused, and
  the removal is recorded in Revision History. Downstream stages cite items as
  `PRD <ID>`, e.g. `PRD FR-003`.

## 5. Procedure, validation and failure handling

**Initial run (attempt 1):**

1. Resolve the task and check preconditions 1–5.
2. Read `active_run_id`. Never create or alter it.
3. Take the time from the system clock (UTC).
4. Load the prompt, read its `prompt_id` and `prompt_version`, and compute its
   SHA-256 (`PRD-E06`, `PRD-E07`).
5. Read all inputs and hash each file read with SHA-256. A referenced file that
   is missing is recorded as `missing` and raised as a GAP.
6. Apply the URL rules.
7. Generate `prd/PRD.md` per the prompt, with Version `1.0.0` and Status
   `Draft — awaiting PRD_APPROVED`.
8. Run every check below. If a check fails because of the artifact, correct the
   artifact and record the correction in `fixes`. If it fails because of the
   inputs, record a GAP or OQ. Never pass a check by inventing content.
9. Journal: add the prompt record if it is new, then append a `stage_execution`
   event with `status: awaiting_approval` and `revision: null`.
10. Present the path, version, section counts, key gaps and open questions, the
    URL outcome and the exact key `PRD_APPROVED`, then **STOP**.

**Quality checks.** All run before presenting; each real result is recorded in
`validation.checks`.

| Check | Rule |
|---|---|
| PRD-V01 | All inputs were read. Every source is registered as `SRC-###` with an access status. |
| PRD-V02 | All 20 sections are present, in order. Empty sections use their required wording. |
| PRD-V03 | Every FR, BR, AC, DR, UIR, APIR, NFR, DEP and CON cites an `SRC-###`. |
| PRD-V04 | Each FR and BR is a single, independently understandable statement. |
| PRD-V05 | Acceptance criteria are verbatim from a source, or the not-provided statement is present. None are invented. |
| PRD-V06 | Out of Scope holds only explicit exclusions. Undeterminable items are under Scope Not Defined. |
| PRD-V07 | No invented roles, permissions, endpoints, schemas, status codes, messages, selectors, NFR values or owners. |
| PRD-V08 | Every assumption is in §17 with a reason, and none appears as an FR, BR, AC or NFR. |
| PRD-V09 | Source conflicts and ambiguities are recorded as GAP or OQ, not resolved. |
| PRD-V10 | URL handling complied: at most one non-browser request per URL, no MCP, only reachability and self-identification used. |
| PRD-V11 | No exploration findings, test cases, test data, bugs, automation or execution content. §20 is preparation only. |
| PRD-V12 | Traceability is complete, and "Requirements without a source" is None. |
| PRD-V13 | Document Information values are real: run ID from the run context, timestamps from the system clock, version per the revision rules. |
| PRD-V14 | Exactly one artifact exists at `prd/PRD.md`: no copies or variants, and no writes outside the task folder except journal records. |
| PRD-G01 | (gate) The reply is exactly `PRD_APPROVED`, standalone. |

**Failures.** Write **no** artifact and report the error. If the task journal
exists, append a `stage_execution` event with `status: failed`, then STOP.

| Code | Condition |
|---|---|
| PRD-E01 | The task folder does not exist. Never create it. |
| PRD-E02 | The target resolves into `platform/templates/`. |
| PRD-E03 | `TaskContext.md` is missing. Never create it. |
| PRD-E04 | No active workflow run: `workflow-run.json` is missing or `active_run_id` is null. Never create a run ID. The failed event is journaled with `workflow_run_id: null`. |
| PRD-E05 | There is no requirement input at all. |
| PRD-E06 | The prompt file is missing, or its `prompt_id` / `prompt_version` is unreadable. |
| PRD-E07 | `prompts.json` already holds this `prompt_id` + `prompt_version` with a different SHA-256: the prompt changed without a version bump. |
| PRD-E08 | A journal file is missing or not valid JSON. Report it; never recreate or overwrite it silently. If the artifact was already written, state that the run is **not journaled**. |
| PRD-E09 | `prd/PRD.md` exists without a journaled `prd-generation` origin. A human-authored PRD is never overwritten; it may be moved to a supporting document and used as a source. |

## 6. Approval gate, hard stop and revisions

After `PRD.md` is written, initially or on revision, **STOP** and present it for
review. The gate is unconditional: no PRD is "obvious enough" to skip it. Do not
continue to any later stage or produce any of the content excluded in §1.

**Gate replies:**

| Reply | Action |
|---|---|
| Exactly `PRD_APPROVED`: standalone, case-sensitive, surrounding whitespace ignored | Set Status to `Approved`; the version is unchanged. Append an `approval_decision` (`approval_outcome: accepted`, `status: approved`, `next_stage.unlocked: true`) with the **post-update** PRD SHA-256 in `output_artifacts`; Project Context uses it to detect a stale approval. Report that `project-context` is unlocked. **Do not start it.** |
| Anything else: `approved`, `looks good`, `okay`, `continue`, `proceed`, `LGTM`, any text containing the key, the key mixed with other text, silence, or another stage's key | Append an `approval_decision` (`approval_outcome: not_accepted`, `status: approval_not_accepted`) with the verbatim reply. Say it is not the key, restate `PRD_APPROVED`, and remain stopped. If the reply also requests changes, revise. |
| A change request | Revise (below). |
| A question | Answer it without changing anything. The stage remains stopped. |

**Revision (attempt n + 1):**

1. Append a `revision_request` event with the verbatim request.
2. Re-run steps 2–8 on the **same** `prd/PRD.md`. Never create `PRD-v2.md`,
   `PRD-final.md` or any other copy.
3. Bump the minor version (1.0.0 → 1.1.0 → 1.2.0), update `Last updated`, add a
   Revision History row (version, date, reason, changed sections) and reset
   Status to `Draft — awaiting PRD_APPROVED`.
4. Register the change request as a new `SRC-###` if it adds or alters
   requirements.
5. If the prompt version differs from the previous attempt's, add the new prompt
   to `prompts.json` and set `revision.prompt_version_changed: true`.
6. Append a `stage_execution` event whose `revision` records `artifact_path`,
   `version_before`, `version_after`, `reason`, `changed_sections`,
   `revision_request_event_id`, `prompt_version_changed` and
   `previous_prompt_version`.
7. Present the revision and **STOP** again. `PRD_APPROVED` is required again.

Any revision of an approved PRD voids the approval: Status returns to Draft, the
version is bumped, and `PRD_APPROVED` is required again. Project Context refuses
a stale approval (`PC-E09`).

## 7. Journal

Events conform to `journal-event.schema.json` v1.2.0. Take the stage constants
from `journal-event.template.json`, and do not create any other journal format.

| Moment | Event type | Status |
|---|---|---|
| PRD written (each attempt) | `stage_execution` | `awaiting_approval` |
| Stage failed | `stage_execution` | `failed` |
| Change requested | `revision_request` | `revision_requested` |
| Reply is the key / is not the key | `approval_decision` | `approved` / `approval_not_accepted` |

Field rules, in addition to the template:

- **Append-only.** `event_id` / `step_number` is the next sequence in `entries`.
  `attempt` counts this stage's `stage_execution` events within the run.
- `workflow_run_id` is read, never created, and is `null` only on a `PRD-E04`
  failure.
- **Prompt integrity.** `prompt_id` / `prompt_version` reference `prompts.json`.
  On first use of a version in this task, append a record
  (`prompt-record.schema.json`) with the verbatim content, SHA-256, `captured_at`
  and `first_used_by_event_id`. Later events reference it and never duplicate the
  text. `prompt_variables` records `task_name`, `task_path` and
  `workflow_run_id`.
- `trigger.user_message` holds the verbatim request, change request or gate
  reply.
- `input_references` use the template's roles (`task_intake`,
  `supporting_document`, `project_url` with status `accessed` / `inaccessible` /
  `not_accessed` and the tool, command and HTTP status in `notes`, `prompt`,
  `previous_version_of_output` on revisions), plus the change request as
  `user_message` with path `journal:EVT-NNNN`.
- `source_references` maps the `SRC-###` register to paths and URLs.
- `tools_used` lists only tools actually used (file read and write, shell
  hashing, the shell HTTP request if made), each with purpose and targets.
  `mcp_used` is `{ "used": false, "servers": [] }` with `intentionally_not_used`
  naming `playwright`, so the HTML journal shows **MCP: None**. A non-MCP HTTP
  request is recorded in `tools_used`, never hidden.
- `decisions` records judgment calls with rationale (e.g. splitting a compound
  statement, a conflict treated as a GAP, a Task ID default).
- `output_artifacts`: `prd/PRD.md` with operation, `artifact_status`,
  `artifact_version`, SHA-256 and a section-count summary.
- `assumptions` / `gaps` / `open_questions` copy the IDs and summaries of §17
  and §18.
- `revision` is `null` on attempt 1 and the full revision object afterwards.
- `validation.checks`: PRD-V01…V14, or PRD-G01 for gate replies, with real
  results.
- `stop_reason`, `approval_required: true`, `approval_key: "PRD_APPROVED"`, and
  `approval_outcome` (on `approval_decision` only; `null` otherwise).
- `next_stage.stage_id` is `project-context`, and `unlocked` is true only after
  an accepted approval. The template's `"exploration"` value conflicts with the
  workflow, where `PRD_APPROVED` unlocks `project-context`, and must not be
  copied.
- `errors`, `fixes` and `evidence` hold real items only. Evidence is normally
  empty for this stage.
- **Never fabricate** timestamps, hashes, IDs, tool usage or results. If a value
  cannot be obtained, use `null` and explain it in `notes`.
