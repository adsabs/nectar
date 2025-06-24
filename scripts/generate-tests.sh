#!/bin/bash

# Show usage help
show_usage() {
  echo "Usage: ./generate-tests.sh [-d source_dir] [files...] [--dry-run]"
  echo
  echo "Generates .test.ts/.test.js files in a __tests__ directory placed next to each source file."
  echo
  echo "Options:"
  echo "  -d, --directory  Specify a directory to scan for all supported files"
  echo "  --dry-run        Show what would be created without writing files"
  echo "  -h, --help       Show this help message"
  echo
  echo "Examples:"
  echo "  ./generate-tests.sh -d src/components"
  echo "  ./generate-tests.sh src/utils/foo.ts src/bar.js --dry-run"
  echo
  exit 0
}

DRY_RUN=false
SRC_DIR=""
FILES=()

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_usage
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    -d|--directory)
      SRC_DIR="$2"
      shift 2
      ;;
    *)
      FILES+=("$1")
      shift
      ;;
  esac
done

# Build file list from directory if given
if [[ -n "$SRC_DIR" ]]; then
  while IFS= read -r f; do
    FILES+=("$f")
  done < <(find "$SRC_DIR" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \))
fi

# Exit early if nothing to do
if [[ "${#FILES[@]}" -eq 0 ]]; then
  echo "❌ No input files found. Use -d <dir> or provide individual files."
  exit 1
fi

# Process each file
for file in "${FILES[@]}"; do
  filename=$(basename "$file")

  # Skip test files
  if [[ "$filename" == *.test.* ]]; then
    continue
  fi

  ext="${filename##*.}"
  name="${filename%.*}"
  dir=$(dirname "$file")
  testdir="$dir/__tests__"
  testfile="$testdir/${name}.test.${ext}"
  importPath="../${name}"

  if [[ -f "$testfile" ]]; then
    echo "⚠️  Skipped $testfile (already exists)"
    continue
  fi

  if [[ "$DRY_RUN" == true ]]; then
    echo "🔎 Would create $testfile"
  else
    mkdir -p "$testdir"
    {
      echo "import { test } from 'vitest';"
      echo "// import {} from '${importPath}';"
      echo "// Test for $filename"
      echo
      echo "test('should work', () => {"
      echo "  // TODO: use Module.${name} or destructure"
      echo "});"
    } > "$testfile"
    echo "✅ Created $testfile"
  fi
done
