<!-- GitHub Copilot generated content - start -->
# Express App Feature Organization

## Goal

Keep each API feature easy to navigate by separating route handling, business logic, and data access while sharing infrastructure from one place.

## Recommended layout

```text
src/
  app.ts
  main.ts
  features/
    repository.ts
    ping/
      controller.ts
      service.ts
      test.spec.ts
  shared/
    <shared-resource>.ts
```

SDK layout for feature modules:

```text
src/
  features/
    ping/
      index.ts
      models.ts
      test.ts
```

## Layer responsibilities

- `features/<feature>/controller.ts`
  - Define Express router paths for one feature.
  - Translate HTTP request and response details.
  - Delegate business behavior to service classes or functions.
  - Avoid direct data access in controllers.

- `features/<feature>/service.ts`
  - Implement feature business rules and orchestration.
  - Validate or transform data for the feature.
  - Call repository functions for persistence or runtime reads.
  - Return stable DTOs for controllers to serialize.

- `features/repository.ts`
  - Provide feature data-access functions for this repository convention.
  - Keep external calls and storage reads in one place.
  - Return simple data records consumed by services.

- `features/<feature>/test.spec.ts`
  - Unit test feature service logic.
  - Unit test controller handler behavior using mocked service or mocked response objects.
  - Keep test setup local to the feature.

- `shared/`
  - Store shared resources such as database clients, runtime providers, logger factories, and config helpers.
  - Keep this folder dependency-light and reusable across features.

## Request flow

1. Request enters `controller.ts`.
2. Controller calls `service.ts`.
3. Service calls `features/repository.ts` (and shared resources as needed).
4. Service returns DTO.
5. Controller sends HTTP response.

## Shared request and response contracts

Use a dedicated models workspace package for API contracts so schema, runtime validation, and TypeScript inference stay aligned.

Contract placement:

- Define request and response schemas in `<resource>-models/src/lib/*.ts` with Zod.
- Export schema values and inferred types from `<resource>-models/src/index.ts`.

Controller usage:

- Parse request inputs with shared schemas before service invocation.
- Validate path params, query, and body as separate nested fields for clarity.

Service usage:

- Build response payloads as plain objects.
- Parse response payloads with shared response schemas before returning.

SDK usage:

- Parse API payloads with the same shared response schemas.
- Re-export request and response TypeScript types through `features/<feature>/models.ts`.
- Prefer `export type { ... } from '@<scope>/<resource>-models'` in SDK models files.
- Do not re-export Zod schemas from SDK models files unless SDK consumers require runtime schema parsing.

Dependency wiring:

- Add `zod` only to the models package unless another package defines its own schemas.
- Add the models workspace package as a dependency of both API and SDK using workspace install commands.
- Avoid duplicated DTO type aliases in API and SDK once shared contracts exist.

Testing guidance:

- Unit-test service outputs against known-valid and known-invalid schema inputs.
- Unit-test controller handlers to verify request parsing and response serialization behavior.
- Unit-test SDK parsing helpers for both success and failure paths.

## Naming and export conventions

- Use `create<Feature>Controller()` to return a Router.
- Use `<Feature>Service` class or `create<Feature>Service()` factory.
- Keep repository interface names explicit, for example `PingRepository`.
- Export only feature entrypoints from each file to minimize coupling.

## New feature checklist

1. Create `features/<feature>/controller.ts`.
2. Create `features/<feature>/service.ts`.
3. Extend `features/repository.ts` for required data functions.
4. Create `features/<feature>/test.spec.ts`.
5. Add request and response Zod contracts to the shared models package and export them.
6. Add models package dependency to API and SDK workspaces.
7. Wire controller into `app.ts` with `app.use('/<feature>', create<Feature>Controller())`.
8. Run API unit tests, SDK tests, and e2e tests through Nx.

SDK checklist for the same feature:

1. Create `src/features/<feature>/index.ts` for SDK calls.
2. Create `src/features/<feature>/models.ts` for type-only contract exports.
3. Create `src/features/<feature>/test.ts` for SDK unit tests.
4. Export SDK feature entrypoints and models from `src/index.ts`.

## Scaling note

If `features/repository.ts` grows too large, split to `features/<feature>/repository.ts` and keep a small shared index for common interfaces.
<!-- GitHub Copilot generated content - end -->
