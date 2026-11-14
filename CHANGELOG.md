# Changelog

All notable changes to the public repository are recorded here. Component versions
(skills, prompts, workflow, registry, schemas) are tracked inside their own files;
this log records repository releases.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] — 2026-11-14

First public, view-only release.

### Included

- Workflow definition `default-qa-workflow` v0.12.0 and skill registry v0.12.0.
- Skills: `prd-generation` 1.0.1, `project-context` 1.1.1, `exploration` 1.0.0,
  `test-design` 1.0.1, `test-review` 1.0.0, `manual-execution` 1.1.0,
  `automation-generation` 1.1.0, `automation-execution` 1.0.0, `self-healing` 1.0.0,
  `qa-final-report` 1.0.0.
- `security-testing` 1.0.0 as a **partial, non-integrated** skill definition.
- Stage prompts (`.claude/prompts/`) are **not published**; their format, versions and
  variables are described in `docs/reference/prompts.md`.
- JSON Schemas: journal event, prompt record, workflow run, execution metrics.
- Immutable task template and three automation scaffolds (SHAFT Java/TestNG,
  Playwright TypeScript, Playwright Java/TestNG).
- ADR-001 (mandatory Test Review) and the execution-journal architecture note.
- New documentation set under `docs/`, `LICENSE` (All Rights Reserved),
  `SECURITY.md`, `CONTRIBUTING.md`, `.env.example`, `.github/` checks.

### Notes

- The "Current Status" section of `CLAUDE.md` reflects the registry.
- `.gitignore` prevents task instances, run outputs, MCP output, office documents
  and local settings from being committed.
- The repository contains framework files only: no task instances, generated
  artifacts, evidence, run logs, journals or MCP output.
