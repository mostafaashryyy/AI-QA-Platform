# Security & Privacy

> © 2026 Mostafa Ashry. All rights reserved. View-only; see [LICENSE](../LICENSE).

## 1. Secrets rule (platform-wide)

From [`CLAUDE.md`](../CLAUDE.md):

- Passwords, tokens, API keys, session cookies and personal credentials are **never
  stored** in journals, reports, evidence, HTML or bug reports.
- Sensitive text is redacted as `[REDACTED: <kind>]`, and each redaction is recorded.
- Credentials are referenced **by source name only** (for example, "QA vault entry"),
  never by value.

## 2. How each layer enforces it

| Layer | Control |
|---|---|
| Task intake | `TaskContext.md` references credential sources, not values |
| Exploration / manual execution | Credentials supplied by the human at run time are used in the browser but never recorded; evidence is checked before it is saved |
| Generated automation | Credentials are read only from environment variables with no defaults; only variable **names** are logged; tracing starts after secret-typing steps (Playwright TS); SHAFT types secrets with `typeSecure` |
| Static validation | `automation-generation` runs forbidden-pattern and secret scans before handing off |
| Self-healing | Storing credentials or session state anywhere is forbidden |
| QA Final Report | The renderer scans its output for credential values and e-mail addresses before writing |
| Repository | `.gitignore` excludes `.env*` (except `.env.example`), task folders, run outputs, MCP output and office documents; [`validate-repo.cjs`](../.github/scripts/validate-repo.cjs) scans for secret patterns, local paths and e-mail addresses |

## 3. Evidence hygiene

- Evidence lives inside the task folder (`exploration/evidence/`, `execution/evidence/`,
  `automation-execution/results/`) and is referenced from the journal.
- Playwright MCP writes raw snapshots and logs to `.playwright-mcp/`, which is a
  git-ignored scratch area.
- Screenshots and traces can contain personal or customer data. Task folders are
  therefore never published from this repository.

## 4. Security-testing safeguards (defined, not yet integrated)

The [`security-testing`](../.claude/skills/security-testing/SKILL.md) skill defines:

- **Authorization first:** execution requires `SECURITY_PLAN_APPROVED`, which also
  confirms the rules of engagement — named authorizer, authorization reference,
  target list, environment type, time window, permitted technique levels, test
  accounts by source name, contacts and stop conditions.
- **Never:** unapproved, production or third-party targets; destructive,
  denial-of-service, malware or uncontrolled brute-force activity; real user data.
- **Evidence-based findings:** no vulnerability is claimed without evidence; findings
  are classified (Confirmed, Potential, Misconfiguration, Observation, False Positive,
  Not Reproducible) with a likelihood × impact severity.
- A result describes the tested environment at the tested time; it is never a
  guarantee of security.

This skill is not wired into the workflow yet; see
[Limitations & Roadmap](limitations-and-roadmap.md).

## 5. AI-specific safeguards

- **No fabrication:** pages, fields, endpoints, messages, credentials and results are
  never invented; unknowns become assumptions or open questions.
- **Exact approval keys** prevent an agent from treating a casual reply as consent.
- **Hash-bound approvals** prevent an approved artifact from being silently edited.
- **Honest self-healing** forbids changing assertions to make a test pass.
- **Prompt provenance:** every prompt used is stored verbatim with its SHA-256.

## 6. What this public repository contains

Only the reusable framework: skills, prompts, workflow, registry, schemas, templates,
scaffolds and documentation. It contains no task instances, test results, evidence,
journals, credentials, private URLs or customer material.

## 7. Reporting

See [SECURITY.md](../SECURITY.md).
