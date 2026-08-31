---
name: nx-resource
description: Scaffold a full resource stack (api, api-e2e, models, sdk, ui, ui-e2e) using the local Nx generator. USE WHEN users ask to create a new resource with frontend, backend, models, and sdk. Trigger words - scaffold resource, create resource, new resource, api ui models sdk, bootstrap resource. ALWAYS prefer this skill over manual copy or directory cloning when the requested shape matches the workspace resource pattern.
---

<!-- GitHub Copilot generated content - start -->
# Nx Resource Generator

Use the local generator `@org/nx-resource:resource` to create a deterministic resource workspace under `packages/resources/<resource-name>`.
The generator uses embedded canonical templates from `packages/nx-resource/templates/knowledge-graph` by default, so it works in raw repos without a pre-existing `packages/resources/knowledge-graph` template.

## Key Principles

1. Always run with `--no-interactive`.
2. Always run `--dry-run` first to validate file placement.
3. Use one workspace scope for all generated packages (default `@org`).
4. Prefer this skill over hand-copying any existing resource template.
5. Validate generated projects with Nx build and test targets.

## Command

```bash
npm exec nx -- generate @org/nx-resource:resource <resource-name> --no-interactive
```

Add a feature to an existing API project:

```bash
npm exec nx -- generate @org/nx-resource:api-feature <api-project> <feature-name> --no-interactive
```

Defaults:

- `featureName=ping`
- `scope=@org`
- `directory=packages/resources`
- `templateRoot=packages/nx-resource/templates/knowledge-graph` (implicit default)
- `apiPort=3000`
- `uiPort=4200`

## Common Usage

Create a resource with defaults:

```bash
npm exec nx -- generate @org/nx-resource:resource audit-events --no-interactive
```

Create a resource with custom scope and feature:

```bash
npm exec nx -- generate @org/nx-resource:resource compliance-hub --scope=@platform --featureName=status --no-interactive
```

Create a resource with non-default ports:

```bash
npm exec nx -- generate @org/nx-resource:resource inventory --apiPort=3100 --uiPort=4300 --no-interactive
```

## Dry-Run First

```bash
npm exec nx -- generate @org/nx-resource:resource <resource-name> --dry-run --no-interactive
npm exec nx -- generate @org/nx-resource:api-feature <api-project> <feature-name> --dry-run --no-interactive
```

Optional advanced override:

```bash
npm exec nx -- generate @org/nx-resource:resource <resource-name> --templateRoot=packages/resources/knowledge-graph --no-interactive
```

Review that the generator creates these projects:

- `<resource>-api`
- `<resource>-api-e2e`
- `<resource>-models`
- `<resource>-sdk`
- `<resource>-ui`
- `<resource>-ui-e2e`

## Validation

Run a targeted validation set after generation:

```bash
npm exec nx -- run-many -t build -p <resource>-models <resource>-sdk <resource>-api <resource>-ui
npm exec nx -- run-many -t test -p <resource>-models <resource>-sdk <resource>-api <resource>-ui
npm exec nx -- run <resource>-api-e2e:e2e
npm exec nx -- run <resource>-ui-e2e:e2e
```

Optional visibility checks:

```bash
npm exec nx -- show projects
npm exec nx -- show project <resource>-api --json
```

## Anti-Patterns

- Do not clone a canonical template directory manually for new resources.
- Do not manually edit root workspaces for each new resource.
- Do not mix package scopes inside one generated resource unless explicitly requested.
<!-- GitHub Copilot generated content - end -->
