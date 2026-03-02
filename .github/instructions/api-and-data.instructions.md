---
applyTo: "src/api/**/*.ts,src/pages/api/**/*.ts,src/lib/**/*.ts,src/store/**/*.ts,src/middleware/**/*.ts,src/middlewares/**/*.ts"
---

# API, data, and server-side review instructions

## Contract and schema integrity
- Detect response/request shape changes and verify all callers are updated.
- Prefer explicit typing for external data boundaries; flag `any` at API edges.
- Ensure query parameter parsing and defaults are deterministic.

## Error handling and observability
- Ensure failures return actionable status codes/messages without leaking internals.
- Verify retries/timeouts/caching behavior do not cause stale or duplicated data.
- Confirm logging captures useful diagnostics while avoiding sensitive payloads.

## State and cache correctness
- Check for race conditions in async flows and stale closure issues.
- Validate cache invalidation and key stability for React Query/store selectors.
- Flag mutation flows that do not reconcile local state with server truth.

## Security checks
- Validate auth/authorization assumptions on route handlers and middleware.
- Flag open redirect, injection, and unsafe header/cookie usage patterns.
