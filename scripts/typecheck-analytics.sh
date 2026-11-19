#!/bin/bash

set -uo pipefail

BASELINE_ERROR_COUNT=116

TMP_OUT=$(mktemp)

echo "Running tsc --noEmit..."
npx tsc --noEmit > "$TMP_OUT" 2>&1

ANALYTICS_LINES=$(grep "src/lib/analytics" "$TMP_OUT" || true)
TOTAL_ERRORS=$(grep -c "error TS" "$TMP_OUT" || true)

FAILED=0

if [ -n "$ANALYTICS_LINES" ]; then
  echo "FAIL: tsc reported errors under src/lib/analytics:"
  echo "$ANALYTICS_LINES"
  FAILED=1
fi

if [ "$TOTAL_ERRORS" -gt "$BASELINE_ERROR_COUNT" ]; then
  echo "FAIL: tsc reported $TOTAL_ERRORS errors total, expected at or below the $BASELINE_ERROR_COUNT pre-existing baseline."
  FAILED=1
fi

rm -f "$TMP_OUT"

if [ "$FAILED" -ne 0 ]; then
  exit 1
fi

echo "OK: 0 analytics errors, $TOTAL_ERRORS total (<= $BASELINE_ERROR_COUNT baseline)."
exit 0
