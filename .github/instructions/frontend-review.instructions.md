---
applyTo: "src/components/**/*.ts,src/components/**/*.tsx,src/pages/**/*.ts,src/pages/**/*.tsx,src/styles/**/*.css"
---

# Frontend review instructions (React/Next.js)

## Focus areas
- Verify SSR/CSR behavior is intentional (no browser-only APIs during SSR without guards).
- Confirm route-level pages maintain expected metadata, loading, and error behavior.
- Check Chakra UI usage for accessibility regressions: semantic controls, labels, keyboard navigation, focus visibility.
- Validate conditional rendering to avoid layout flicker and hydration mismatches.

## Performance checks
- Flag unnecessary rerenders from unstable props/callbacks in hot paths.
- Watch for expensive client-side transforms that should be memoized or moved server-side.
- Ensure large dependencies are not added to shared/page-critical bundles without justification.

## UX regression checklist
- Empty, loading, and error states are explicit and user-friendly.
- Interactive controls have disabled and busy states when async operations run.
- New text is concise and consistent with existing naming/terminology.
