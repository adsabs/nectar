---
applyTo: "**/*.test.ts,**/*.test.tsx,src/mocks/**/*.ts"
---

# Testing and mocking review instructions

## Test quality expectations
- Tests should assert behavior, not implementation details.
- New logic paths should include at least one success path and one failure/edge path.
- Prefer deterministic tests (no real network/time randomness unless controlled).

## Vitest and Testing Library guidance
- Verify async UI tests wait for user-visible outcomes.
- Ensure queries prefer accessible roles/labels over brittle selectors.
- Flag snapshots that replace meaningful assertions.

## MSW/mocks guidance
- Mocks should reflect realistic API contracts and error payloads.
- When changing endpoint behavior, update handlers and impacted tests together.
- Avoid over-mocking internal modules when an integration-style test is feasible.
