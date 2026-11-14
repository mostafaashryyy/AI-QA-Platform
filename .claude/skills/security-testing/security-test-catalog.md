# Security Test Catalog

<!--
REFERENCE for the security-testing skill (PLAN phase). This file is not an artifact.
STATUS: STRUCTURE ONLY. Every category below has its headings in place, but the
content is a placeholder. Until the placeholders are completed and reviewed, the
PLAN phase records every category whose catalog entry is a placeholder as
"not determinable — catalog entry not completed" (SKILL.md, Security Test Design
Rules) and designs no cases from it.

Scope: Web applications and REST APIs only. Mobile applications are out of scope.
Technique levels: L0 passive · L1 non-intrusive active · L2 controlled intrusive
(definitions in SKILL.md, Safety and Authorization Rules). Nothing above L2 exists.
-->

| Field | Value |
|---|---|
| Catalog version | 0.1.0 (structure only) |
| Status | Placeholder content: to be completed and reviewed by a security reviewer |
| Used by | `security-testing` PLAN phase (applicability decisions, case design) |

## How to use this catalog

1. For each category, compare its **Applicability Conditions** with the task's
   approved sources (PRD, ProjectContext, ExplorationReport).
2. Record `applicable`, `not applicable` or `not determinable` with the reason and
   source in `SecurityScope.md`.
3. For applicable categories, derive scenarios and cases from **Test Objectives**
   and **Expected Secure Behavior**, at the **Technique Level** allowed for the
   target in the rules of engagement.
4. Use only the **Safe Observation Methods** and collect the **Required Evidence**.

## Entry structure

Every category uses the same nine fields:

| Field | Content |
|---|---|
| Test Objectives | What the category verifies, stated as controls that should hold |
| Applicability Conditions | Which features, entry points or architecture make the category relevant |
| Security Risks | Risks addressed if the control is missing |
| Expected Secure Behavior | Observable behaviour that shows the control holds |
| Safe Observation Methods | Non-destructive ways to observe that behaviour within L0–L2 |
| Required Evidence | Evidence types needed for a result or a finding |
| Risk Considerations | Points that affect likelihood, impact or safety of testing |
| OWASP References | OWASP Top 10, API Security Top 10, WSTG and ASVS identifiers |
| Technique Level | Highest level normally needed (L0, L1 or L2) |

## Shared reference sets

### Safe input classes (IC-###)

<!-- Placeholder: neutral, descriptive input classes (for example empty value,
value at a length limit) used by test steps instead of stored strings. -->

| ID | Description | Use |
|---|---|---|
| IC-001 | `<to be completed>` | `<to be completed>` |

### Safe test file classes (FC-###)

<!-- Placeholder: harmless synthetic test files used by file-handling checks. -->

| ID | Description | Use |
|---|---|---|
| FC-001 | `<to be completed>` | `<to be completed>` |

## A. Authentication Testing

| Field | Content |
|---|---|
| Test Objectives | `<to be completed>` |
| Applicability Conditions | `<to be completed>` |
| Security Risks | `<to be completed>` |
| Expected Secure Behavior | `<to be completed>` |
| Safe Observation Methods | `<to be completed>` |
| Required Evidence | `<to be completed>` |
| Risk Considerations | `<to be completed>` |
| OWASP References | `<to be completed: Top 10 · API Top 10 · WSTG · ASVS>` |
| Technique Level | `<to be completed: L0 / L1 / L2>` |

## B. Authorization & Access Control

| Field | Content |
|---|---|
| Test Objectives | `<to be completed>` |
| Applicability Conditions | `<to be completed>` |
| Security Risks | `<to be completed>` |
| Expected Secure Behavior | `<to be completed>` |
| Safe Observation Methods | `<to be completed>` |
| Required Evidence | `<to be completed>` |
| Risk Considerations | `<to be completed>` |
| OWASP References | `<to be completed: Top 10 · API Top 10 · WSTG · ASVS>` |
| Technique Level | `<to be completed: L0 / L1 / L2>` |

## C. Session Management

| Field | Content |
|---|---|
| Test Objectives | `<to be completed>` |
| Applicability Conditions | `<to be completed>` |
| Security Risks | `<to be completed>` |
| Expected Secure Behavior | `<to be completed>` |
| Safe Observation Methods | `<to be completed>` |
| Required Evidence | `<to be completed>` |
| Risk Considerations | `<to be completed>` |
| OWASP References | `<to be completed: Top 10 · API Top 10 · WSTG · ASVS>` |
| Technique Level | `<to be completed: L0 / L1 / L2>` |

## D. Input Validation & Injection

| Field | Content |
|---|---|
| Test Objectives | `<to be completed>` |
| Applicability Conditions | `<to be completed>` |
| Security Risks | `<to be completed>` |
| Expected Secure Behavior | `<to be completed>` |
| Safe Observation Methods | `<to be completed>` |
| Required Evidence | `<to be completed>` |
| Risk Considerations | `<to be completed>` |
| OWASP References | `<to be completed: Top 10 · API Top 10 · WSTG · ASVS>` |
| Technique Level | `<to be completed: L0 / L1 / L2>` |

## E. API Security Testing

| Field | Content |
|---|---|
| Test Objectives | `<to be completed>` |
| Applicability Conditions | `<to be completed>` |
| Security Risks | `<to be completed>` |
| Expected Secure Behavior | `<to be completed>` |
| Safe Observation Methods | `<to be completed>` |
| Required Evidence | `<to be completed>` |
| Risk Considerations | `<to be completed>` |
| OWASP References | `<to be completed: Top 10 · API Top 10 · WSTG · ASVS>` |
| Technique Level | `<to be completed: L0 / L1 / L2>` |

## F. Data Protection

| Field | Content |
|---|---|
| Test Objectives | `<to be completed>` |
| Applicability Conditions | `<to be completed>` |
| Security Risks | `<to be completed>` |
| Expected Secure Behavior | `<to be completed>` |
| Safe Observation Methods | `<to be completed>` |
| Required Evidence | `<to be completed>` |
| Risk Considerations | `<to be completed>` |
| OWASP References | `<to be completed: Top 10 · API Top 10 · WSTG · ASVS>` |
| Technique Level | `<to be completed: L0 / L1 / L2>` |

## G. File Upload Security

| Field | Content |
|---|---|
| Test Objectives | `<to be completed>` |
| Applicability Conditions | `<to be completed>` |
| Security Risks | `<to be completed>` |
| Expected Secure Behavior | `<to be completed>` |
| Safe Observation Methods | `<to be completed>` |
| Required Evidence | `<to be completed>` |
| Risk Considerations | `<to be completed>` |
| OWASP References | `<to be completed: Top 10 · API Top 10 · WSTG · ASVS>` |
| Technique Level | `<to be completed: L0 / L1 / L2>` |

## H. Security Configuration

| Field | Content |
|---|---|
| Test Objectives | `<to be completed>` |
| Applicability Conditions | `<to be completed>` |
| Security Risks | `<to be completed>` |
| Expected Secure Behavior | `<to be completed>` |
| Safe Observation Methods | `<to be completed>` |
| Required Evidence | `<to be completed>` |
| Risk Considerations | `<to be completed>` |
| OWASP References | `<to be completed: Top 10 · API Top 10 · WSTG · ASVS>` |
| Technique Level | `<to be completed: L0 / L1 / L2>` |

## Revision History

| Version | Date (UTC) | Change |
|---|---|---|
| 0.1.0 | 2026-11-01 | Structure only: eight category headings and placeholder fields |
