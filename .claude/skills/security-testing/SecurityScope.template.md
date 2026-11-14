# Security Scope

<!--
OUTPUT STRUCTURE for the security-testing skill (PLAN phase). This file is a
structure reference, not an artifact. The skill writes the filled version to
platform/tasks/<task-name>/security/SecurityScope.md. Every section is always
present; an empty section says "None." Never copy placeholder rows as content.

The skill fills what the approved sources state. Every Rules of Engagement field
the sources do not state is written "to be provided by the authorizer"; the skill
never fills an authorization field itself (SKILL.md, Safety and Authorization Rules).

ID conventions: AST asset · EP entry point · TB trust boundary · DATA synthetic
data (reused from test-design where present). Upstream IDs reused exactly:
PRD FR-### · PC BR/EB/RK/DEP-### · OBS-### · PB-###.
No secrets: credentials are referenced by source name only.
Mobile applications are always listed under Exclusions.
-->

## 1. Document Information

| Field | Value |
|---|---|
| Task ID | `<task-id>` |
| Project Name | `<project>` |
| Workflow Run ID | `<RUN-###>` |
| Phase | PLAN |
| Document version | `<1.0.0>` |
| Status | Draft |
| Skill / prompt version | security-testing `<x.y.z>` / `<x.y.z>` |
| Sources | PRD `<version, SHA-256, approval event>` · ProjectContext `<…>` · ExplorationReport `<… or not available>` |

### Revision History

| Version | Date (UTC) | Reason | Changed sections |
|---|---|---|---|
| `<1.0.0>` | `<yyyy-mm-dd>` | Initial plan | All |

## 2. Application Overview

| Field | Value | Source |
|---|---|---|
| Application type | `<Web application / REST API / both>` |