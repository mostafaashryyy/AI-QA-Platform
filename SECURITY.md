# Security Policy

## Scope

This repository contains workflow definitions, prompts, skills, schemas, templates
and documentation. It contains no running service, no deployed application and no
credentials. Reports are relevant when they concern:

- a secret, credential, personal datum or private URL accidentally committed;
- a template or scaffold that could cause generated automation to leak secrets
  (for example, writing credentials to logs, traces or reports);
- a prompt or skill rule that could lead an AI agent to act outside its authorized
  scope (for example, testing an unapproved target).

## Reporting a concern

Please **do not open a public issue**. Instead:

1. Use GitHub's **private vulnerability reporting** ("Report a vulnerability" on the
   repository's *Security* tab), if it is enabled; or
2. contact the repository owner through the contact details on their GitHub profile.

Include the file path, a description of the concern and, if applicable, the commit.
Do not include any real secret in the report itself; describe its location instead.

## Handling

The owner aims to acknowledge reports and to remove any exposed secret from the
repository history. Any credential found in the repository must be treated as
compromised and rotated at its source, regardless of history rewriting.

## Platform security principles

The platform's own rules for secrets, redaction, and authorized security testing are
described in [docs/security-and-privacy.md](docs/security-and-privacy.md).
