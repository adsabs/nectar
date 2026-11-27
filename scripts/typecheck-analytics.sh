#!/bin/bash

set -uo pipefail

BASELINE_ERROR_COUNT=116
MIN_PLAUSIBLE_ERROR_COUNT=100

TMP_OUT=$(mktemp)

echo "Running tsc --noEmit..."
npx tsc --noEmit > "$TMP_OUT" 2>&1
TSC_EXIT=$?

ANALYTICS_LINES=$(grep "src/lib/analytics" "$TMP_OUT" || true)
TOTAL_ERRORS=$(grep -c "error TS" "$TMP_OUT" || true)

FAILED=0

if [ "$TSC_EXIT" -ne 0 ] && [ "$TOTAL_ERRORS" -eq 0 ]; then
  echo "FAIL: tsc exited $TSC_EXIT but produced no 'error TS' lines. That means tsc failed to run (missing binary, bad flag, crash) rather than that the project is clean. Captured output:"
  cat "$TMP_OUT"
  FAILED=1
fi

if [ "$TSC_EXIT" -eq 0 ] && [ "$TOTAL_ERRORS" -gt 0 ]; then
  echo "FAIL: tsc exited 0 but its output contains $TOTAL_ERRORS 'error TS' line(s). That combination should not happen; this script's parsing no longer matches tsc's real behavior."
  FAILED=1
fi

if [ "$TOTAL_ERRORS" -lt "$MIN_PLAUSIBLE_ERROR_COUNT" ]; then
  echo "FAIL: tsc reported only $TOTAL_ERRORS error(s), below the $MIN_PLAUSIBLE_ERROR_COUNT floor. There are $BASELINE_ERROR_COUNT known pre-existing errors outside src/lib/analytics, so a count this low is far more likely to mean tsc did not analyse the whole project than that someone fixed that many at once. Confirm tsc ran over the full project; if the errors really were fixed, lower BASELINE_ERROR_COUNT to match."
  FAILED=1
fi

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
