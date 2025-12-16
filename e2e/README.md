# E2E Tests

End-to-end tests for Nectar using Playwright.

## Prerequisites

**For Docker (recommended):**
- Docker and Docker Compose installed

**For local testing:**
- Node.js 18+
- pnpm installed
- Playwright browsers: `pnpm exec playwright install chromium`

## Running Tests

### 🐳 Docker (Recommended)

Run everything in Docker - most reliable, matches CI exactly:

```bash
pnpm test:e2e:docker
```

This will:
- Build stub backend + Nectar + test containers
- Start services with proper healthchecks
- Run all E2E tests
- Clean up automatically

**Other Docker commands:**

```bash
# Rebuild images
pnpm test:e2e:docker:build

# Clean up containers and volumes
pnpm test:e2e:docker:down

# View live logs (run in separate terminal)
pnpm test:e2e:docker:logs
```

### 💻 Local (For fast iteration)

Run services manually in separate terminals:

```bash
# Terminal 1 - Start stub backend
pnpm stub

# Terminal 2 - Start Nectar dev server
pnpm dev:e2e

# Terminal 3 - Run tests
pnpm test:e2e
```

**Interactive modes (requires services running):**

```bash
pnpm test:e2e:ui       # Playwright UI mode
pnpm test:e2e:headed   # See browser while testing
```

## When to use what?

- **Docker**: CI/CD, verifying fixes, final validation before PR, first-time setup
- **Manual local**: Writing new tests, quick iterations, debugging specific tests
- **UI mode**: Understanding test failures, building new tests interactively

## Continuous Integration

E2E tests run automatically on every PR via GitHub Actions (`.github/workflows/e2e-tests.yml`):

- **Triggers**: PRs, workflow_dispatch
- **Path filters**: Only runs when relevant files change (src/, middleware.ts, e2e/, etc.)
- **Docker-based**: Uses the same Docker setup as `pnpm test:e2e:docker`
- **Required check**: PRs must pass E2E tests to merge
- **Artifacts**: Test results uploaded on failure (screenshots, videos, traces)
- **PR comments**: Automatic status updates with links to artifacts

The CI environment matches the Docker setup exactly, so `pnpm test:e2e:docker` is the best local validation.

## Test Structure

```
e2e/
├── tests/              # Test files
│   └── middleware/     # Middleware integration tests
├── fixtures/           # Test helpers and utilities
├── docker-compose.yml  # Docker orchestration
├── playwright.config.ts
└── tsconfig.json       # Isolated TypeScript config
```

## Writing Tests

Tests are standard Playwright tests. Example:

```typescript
import { test, expect } from '@playwright/test';

test('example test', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/SciX/);
});
```

See existing tests in `e2e/tests/` for patterns.

## Environment Variables

- `BASE_URL`: Base URL for Nectar
  - Docker: `http://nectar:8000` (automatic)
  - Local: `http://127.0.0.1:8000` (default)
- `STUB_URL`: Base URL for stub API
  - Docker: `http://stub:18080` (automatic)
  - Local: `http://127.0.0.1:18080` (default)
- `CI`: Set to `true` in Docker/CI environments

## Troubleshooting

**Docker tests failing:**
```bash
# View logs
pnpm test:e2e:docker:logs

# Clean slate
pnpm test:e2e:docker:down
pnpm test:e2e:docker
```

**Local tests timing out:**
- Ensure stub is running: `curl http://127.0.0.1:18080/__test__/calls`
- Ensure Nectar is running: `curl http://127.0.0.1:8000/api/health`

**Port already in use:**
```bash
# Find and kill process on port 8000 or 18080
lsof -ti:8000 | xargs kill -9
lsof -ti:18080 | xargs kill -9
```
