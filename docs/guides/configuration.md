# Configuration Guide

> © 2026 Mostafa Ashry. All rights reserved. View-only; see [LICENSE](../../LICENSE).

## 1. Playwright MCP (`.mcp.json`)

Committed configuration (Windows):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@playwright/mcp@latest", "--output-dir", ".playwright-mcp"]
    }
  }
}
```

macOS / Linux equivalent:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest", "--output-dir", ".playwright-mcp"]
    }
  }
}
```

- `--output-dir .playwright-mcp` keeps snapshots, screenshots and console logs inside
  the git-ignored [`.playwright-mcp/`](../../.playwright-mcp/README.md) folder.
- `@playwright/mcp@latest` is unpinned. For reproducible runs, pin an exact version
  and record it in the task journal.

## 2. Claude Code settings (`.claude/settings.json`)

```json
{
  "enabledMcpjsonServers": ["playwright"],
  "permissions": {
    "deny": [
      "Edit(platform/templates/**)",
      "Write(platform/templates/**)"
    ]
  }
}
```

- Enables the project's Playwright MCP server.
- Enforces **template immutability** by denying edits to `platform/templates/`.
- Put personal overrides in `.claude/settings.local.json` (git-ignored). Never put
  credentials in either file.

## 3. Environment variables (generated automation)

Generated projects read configuration from the process environment only. See
[`.env.example`](../../.env.example) for the reference list. The file is **not**
loaded automatically.

| Variable | Default | Meaning |
|---|---|---|
| `QA_BASE_URL` | task UI entry point (`{{base_url}}`) | Application base URL |
| `QA_BROWSER` | `chromium` | Playwright bindings: `chromium` \| `firefox` \| `webkit`; SHAFT binding: `chromium`/`chrome` \| `firefox` \| `edge` |
| `QA_HEADLESS` | `true` | Headless browser |
| `QA_TIMEOUT_MS` | per scaffold (`{{default_timeout_ms}}`) | Per-step timeout |
| `QA_ARTIFACTS_DIR` | per scaffold | Evidence root |
| `QA_RUN_ID` | `local-<UTC timestamp>` | Set by `automation-execution` for each run |
| *credential variables* | none | Names chosen per task and recorded in `automation/AutomationGeneration.md`; values never stored |

A missing credential variable raises a configuration error (distinct from an
assertion failure) at run time; listing and compiling work without it.

SHAFT binding only: `shaft.extraArgLine` (empty by default) can pass
`-Duser.home=<path without spaces>` when the user profile path contains a space.

## 4. Task setup

1. Copy the template:

   ```bash
   cp -r platform/templates/task-template platform/tasks/<task-name>
   ```

2. Fill `platform/tasks/<task-name>/context/TaskContext.md`:
   - **Identity:** task ID, name, type, project name, status, dates, owner.
   - **Entry points:** UI URL, API URL, environment (or `not provided`).
   - **Intake:** the user story / requirements **verbatim**. No analysis.
   - Reference credentials by **source name only** (e.g. "test account from the team
     vault"), never by value.

3. Set the run in `journal/workflow-run.json`, for example:

   ```json
   {
     "schema": "platform/schemas/workflow-run.schema.json",
     "owner": "workflow orchestration layer (skills read only)",
     "task_id": "<task-id>",
     "active_run_id": "RUN-001",
     "runs": [
       {
         "workflow_run_id": "RUN-001",
         "workflow_id": "default-qa-workflow",
         "workflow_version": "0.12.0",
         "started_at": "2026-01-01T09:00:00Z",
         "initiated_by": "<operator name>",
         "status": "active",
         "ended_at": null,
         "notes": null
       }
     ]
   }
   ```

   Field rules: [`workflow-run.schema.json`](../../platform/schemas/workflow-run.schema.json)
   (`status` is `active` \| `completed` \| `aborted`; run IDs match `^RUN-[A-Za-z0-9-]+$`).
   With `active_run_id: null`, no stage may execute.

4. Ask Claude Code to run `prd-generation` for `<task-name>`, review the PRD, and reply
   with exactly `PRD_APPROVED` to continue.

## 5. Framework selection for automation

Resolved by `automation-generation` in this order:

1. A framework named by the approved `ProjectContext.md`.
2. Otherwise the platform default from `CLAUDE.md`: SHAFT + Selenium + Java + TestNG.
3. A binding named by ProjectContext/TaskContext or stated by the human (journaled).
4. Several bindings on request — generated as fully independent projects.

## 6. Workflow and registry

- [`default-qa-workflow.yaml`](../../platform/workflows/default-qa-workflow.yaml) —
  stage order, `requires_approval_of`, gate keys, filters, inputs/outputs.
- [`skills.yaml`](../../platform/registry/skills.yaml) — skill status, versions, paths.

Replacing a stage means pointing the workflow stage at another skill that honors the
same inputs and outputs. Record platform-level changes as an ADR.
