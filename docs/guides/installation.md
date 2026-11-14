# Installation Guide

> © 2026 Mostafa Ashry. All rights reserved. View-only; see [LICENSE](../../LICENSE).
>
> This guide documents how the platform is set up by its owner. The license grants
> no right to install or use the platform.

## 1. Prerequisites

| Requirement | Needed for | Notes |
|---|---|---|
| [Claude Code](https://docs.claude.com/en/docs/claude-code/overview) (CLI, desktop or IDE extension) | All stages | Loads `CLAUDE.md`, `.claude/skills/`, `.claude/settings.json`, `.mcp.json` |
| Node.js + npx | Playwright MCP server; `playwright-ts` binding; QA Final Report renderer; repo checks | The skills do not pin a Node.js version; use a current LTS release |
| A Chromium-family browser available to Playwright MCP | `exploration`, `manual-execution` | Installed by Playwright on first use if missing |
| JDK + Maven | `shaft-java-testng`, `playwright-java-testng` bindings | Java level is decided per task; SHAFT releases may require a newer JDK (see Troubleshooting) |
| Git | Version control | — |

The platform has no package manifest at the repository root and no install step
of its own. Generated automation projects carry their own `package.json` / `pom.xml`.

## 2. Get the repository

```bash
git clone <repository-url> AI-QA-Platform
cd AI-QA-Platform
```

## 3. Playwright MCP server

[`.mcp.json`](../../.mcp.json) starts the server through `cmd /c npx` (Windows):

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

On macOS or Linux, use `npx` directly — see the
[Configuration Guide](configuration.md#1-playwright-mcp-mcpjson).

[`.claude/settings.json`](../../.claude/settings.json) enables this server
(`enabledMcpjsonServers: ["playwright"]`). Start Claude Code in the repository root
and approve the project MCP server when prompted.

## 4. Automation toolchains (only for stages 7–9)

| Binding | First-run setup (from the generated project directory) |
|---|---|
| `playwright-ts` | `npm ci`, then `npx playwright install <browser>` (the browser build must match the pinned Playwright version) |
| `shaft-java-testng` | `mvn test-compile` (downloads dependencies); SHAFT downloads its Allure CLI on the first run |
| `playwright-java-testng` | `mvn test-compile` |

## 5. Verify the setup

1. Open Claude Code in the repository root and confirm the skills are listed
   (`prd-generation`, `project-context`, … `qa-final-report`).
2. Confirm the Playwright MCP tools are available.
3. Run the repository checks:

   ```bash
   node .github/scripts/validate-repo.cjs
   ```

## 6. Create the first task

Follow [Configuration Guide → Task setup](configuration.md#4-task-setup), then ask
Claude Code to run `prd-generation` for that task.
