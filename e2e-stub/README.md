# E2E Stub Server

Lightweight Express server that simulates the backend API for end-to-end testing. Used by the `ui-integration-testing-nectar-auth` Playwright test suite.

## Purpose

Provides scenario-based API responses for testing middleware authentication and session management flows without requiring the actual backend API.

## Usage

### Standalone

```bash
node e2e-stub/server.js
```

Server starts on `http://127.0.0.1:18080`

### Docker Compose (Recommended)

The stub is included in the E2E test environment via Docker Compose:

```bash
cd ../ui-integration-testing-nectar-auth
docker-compose up
```

This automatically starts both the stub server and nectar dev server with proper networking.

## Endpoints

### `/accounts/bootstrap`
Session initialization endpoint. Returns user data and sets session cookie.

**Scenarios** (via `x-test-scenario` header):
- `bootstrap-authenticated` - Returns authenticated user session
- `bootstrap-anonymous` - Returns anonymous user session
- `bootstrap-rotated-cookie` - Rotates session cookie value
- `bootstrap-unchanged-cookie` - Returns same cookie value
- `bootstrap-failure` - Returns 500 error
- `bootstrap-network-error` - Destroys socket

### `/accounts/verify/:token`
Email verification endpoint. Validates verification tokens.

**Scenarios** (via `x-test-scenario` header):
- `verify-success` - Returns successful verification
- `verify-unknown-token` - Returns unknown token error
- `verify-already-validated` - Returns already validated error
- `verify-failure` - Returns 500 error
- `verify-network-error` - Destroys socket

### `/link_gateway/*`
Analytics endpoint for tracking abstract page views.

### Test Instrumentation

#### `GET /__test__/calls`
Returns history of all API calls made to the stub server.

**Response:**
```json
{
  "calls": [
    {
      "endpoint": "/accounts/bootstrap",
      "scenario": "bootstrap-authenticated",
      "headers": { ... },
      "timestamp": 1234567890
    }
  ],
  "count": 1
}
```

#### `POST /__test__/reset`
Clears call history. Should be called in test `beforeEach` hooks.

## Scenario Usage

E2E tests set the `x-test-scenario` header to control stub behavior:

```typescript
await page.setExtraHTTPHeaders({
  'x-test-scenario': 'bootstrap-authenticated',
});

await page.goto('http://127.0.0.1:8000/search');
// Nectar dev server calls stub with scenario header
```

## Relationship to MSW

The stub server provides the same scenario-based responses as MSW handlers in `src/mocks/handlers/accounts.ts`, ensuring consistent behavior between unit/integration tests and E2E tests.
