# Prompts Reference

> © 2026 Mostafa Ashry. All rights reserved. View-only; see [LICENSE](../../LICENSE).

> **The prompt files are not published in this repository.** In a full installation
> they live in `.claude/prompts/`, one file per stage. This page describes their
> format, versioning rules and catalog only.

A skill defines *how* a stage works; its prompt is the versioned instruction the
stage runs with. Each skill loads its prompt, hashes it and records it in the task
journal, so the stages cannot run as specified from this repository alone.

## Front matter

Every prompt starts with YAML front matter:

```yaml
---
prompt_id: <stage id>
prompt_version: <semver>
skill: <skill id>
stage_id: <workflow stage id>
approval_key: <KEY or null>
variables: [<runtime variables substituted per run>]
changelog:
  - "<version>: <change>"
---
```

## Versioning and recording rules

- **Any change to a prompt's text requires a `prompt_version` bump** and a changelog line.
- On first use in a task, the prompt is stored **verbatim** in `journal/prompts.json`
  with its SHA-256, one record per `(prompt_id, prompt_version)`
  ([`prompt-record.schema.json`](../../platform/schemas/prompt-record.schema.json)).
- Re-using the same id and version with a different hash is an error.
- Each journal event cites the `prompt_id` and `prompt_version` it ran with.

## Catalog (not published)

| Prompt (`.claude/prompts/`) | Version | Approval key | Variables |
|---|---|---|---|
| `prd-generation.md` | 1.0.0 | `PRD_APPROVED` | `task_name`, `task_path`, `workflow_run_id` |
| `project-context.md` | 1.1.0 | `PROJECT_CONTEXT_APPROVED` | `task_name`, `task_path`, `prd_path` |
| `exploration.md` | 1.0.0 | `EXPLORATION_APPROVED` | `task_name`, `task_path`, `workflow_run_id`, `ui_url`, `api_url` |
| `test-design.md` | 1.0.0 | `TEST_DESIGN_APPROVED` | `task_name`, `task_path`, `workflow_run_id` |
| `test-review.md` | 1.0.0 | `TEST_REVIEW_APPROVED` | `task_name`, `task_path`, `workflow_run_id` |
| `manual-execution.md` | 1.1.0 | `MANUAL_EXECUTION_APPROVED` | `task_name`, `task_path`, `workflow_run_id`, `ui_url`, `api_url` |
| `automation-generation.md` | 1.1.0 | — | `task_name`, `task_path`, `workflow_run_id`, `ui_url`, `binding_ids`, `credential_env_vars`, `ide` |
| `automation-execution.md` | 1.0.0 | — | `task_name`, `task_path`, `workflow_run_id`, `binding_ids`, `test_case_ids`, `run_ids`, `credential_env_vars` |
| `self-healing.md` | 1.0.0 | — | `task_name`, `task_path`, `workflow_run_id`, `failed_run_ids`, `binding_id` |
| `qa-final-report.md` | 1.0.0 | `QA_FINAL_REPORT_APPROVED` | `task_name`, `task_path`, `workflow_run_id` |
| `security-testing.md` | — | — | **Not created** (referenced by the partial `security-testing` skill) |

Notable changelog entries:

- `project-context` 1.1.0 — requires an approved PRD; qualifies PRD IDs as `PRD <ID>`;
  reads only the identity section of `TaskContext.md`.
- `manual-execution` 1.1.0 — requires a current `TEST_REVIEW_APPROVED` bound to the
  current `TestCases.md` hash (ADR-001).
- `automation-generation` 1.1.0 — several independent bindings per task, per-binding
  project directories, evidence folders and journal events.

## Relationship to the registry

[`platform/registry/skills.yaml`](../../platform/registry/skills.yaml) records each
skill's `prompt_path`, `prompt_id` and `prompt_version`. The paths give the location
in a full installation; the files themselves are not published here.
