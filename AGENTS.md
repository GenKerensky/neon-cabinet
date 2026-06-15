# Neon-Cabinet Rules

Neon cabinet is a web arcade of html games inspired by classic coin-op machines, but with modern features and style.

## Art Assets

- For creating, editing, rendering, critiquing, or integrating game art assets, always invoke the `vector-sprite-pipeline` skill first. It is the definitive workflow for SVG sprites, Vector Studio previews, renderer handoffs, Art Critic approval, and user approval before moving to the next sprite.

## Debugging

### Chrome Dev Tools

- Always try Chrome Dev Tools before Playwright
- Always check for a running Chrome instance in dev mode by trying to connect to the browser at 127.0.0.1:9222
- If you find a browser instance, check the open tabs to see if the app in question is already running

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
