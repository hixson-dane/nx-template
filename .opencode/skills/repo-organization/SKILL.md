---
name: repo-organization
description: Defines folder and file organization for Express API features with controller/service/repository separation and shared infrastructure placement. Includes wiring guidance for shared Zod request and response models across the API and SDK. Use when creating or refactoring Express endpoints, especially when the user asks for feature-first layout, reusable contracts, and consistent test placement.
---

<!-- GitHub Copilot generated content - start -->
# Repo Organization

Standardize Express app structure with feature directories, clear layer ownership, and predictable test location.

## Quick start

Use this layout when adding a feature:

- `features/<feature>/controller.ts`
- `features/<feature>/service.ts`
- `features/repository.ts`
- `features/<feature>/test.spec.ts`
- `shared/` for cross-feature resources

For SDK features, use:

- `src/features/<feature>/index.ts` for SDK functions and endpoint calls.
- `src/features/<feature>/models.ts` for TypeScript request/response type re-exports.
- `src/features/<feature>/test.ts` for SDK unit tests.

## Shared contract wiring

- Keep request and response contracts in `<resource>-models` using Zod schemas.
- Export both schema values and inferred TypeScript types from the models package.
- Import contract schemas in API controllers and services to validate request and response payloads.
- Import the same response schemas in SDK helpers to validate inbound API payloads.
- Re-export only TypeScript types from SDK `features/<feature>/models.ts` using `export type { ... } from '@<scope>/<resource>-models'`.
- Do not re-export Zod schemas from the SDK public API unless SDK consumers explicitly need runtime validation.
- Add workspace dependencies so API and SDK both consume the models package rather than duplicating DTOs.

See [repo-organization.md](repo-organization.md) for the full guidance.
<!-- GitHub Copilot generated content - end -->
