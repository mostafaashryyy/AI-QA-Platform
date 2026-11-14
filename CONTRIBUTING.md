# Contributing

Thank you for your interest in the AI QA Platform.

This repository is **proprietary and All Rights Reserved** (see [LICENSE](LICENSE)).
It is published for viewing and portfolio presentation only.

## What is welcome

- **Feedback and questions** through GitHub Issues, using the *Feedback* template.
- **Security concerns** through the private channel described in
  [SECURITY.md](SECURITY.md). Do not open a public issue for them.

## What is not accepted

- **Pull requests.** External code, documentation, skill or prompt changes are not
  accepted and may be closed without review.
- **Forks for reuse.** Forking or copying the repository to use, modify or
  redistribute its content is not permitted by the license.

Submitting feedback does not grant you any right in the repository content, and it
does not oblige the owner to act on it.

## For the owner: internal change rules

Changes made by the owner follow the platform rules in [CLAUDE.md](CLAUDE.md):

1. Keep skills, prompts, workflow and templates **application-agnostic**.
2. Any change to a prompt's text requires a `prompt_version` bump and a changelog
   line in its front matter.
3. Any change to a skill's behavior bumps its version in `SKILL.md` and in
   `platform/registry/skills.yaml`.
4. Never modify `platform/templates/` during task execution.
5. Record platform-level decisions as ADRs in `docs/architecture/decisions/`.
6. Never commit task instances, evidence, credentials or customer material; run
   `node .github/scripts/validate-repo.cjs` before pushing.
7. Add an entry to [CHANGELOG.md](CHANGELOG.md) for every public release.
