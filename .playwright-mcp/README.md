# `.playwright-mcp/`

Runtime output folder of the Playwright MCP server, configured in
[`../.mcp.json`](../.mcp.json) with `--output-dir .playwright-mcp`.

During `exploration` and `manual-execution`, the MCP server writes page snapshots
(`page-*.yml`), screenshots (`*.png`) and console logs (`console-*.log`) here.
These files can contain application content, so **everything in this folder except
this README and `.gitkeep` is git-ignored**.

Evidence that a stage relies on is copied into the task's own `evidence/` folder
and referenced from the task journal. This folder is a scratch area only.
