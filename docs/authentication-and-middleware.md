# Middleware and Session Management Architecture

## 1. System Architecture and Data Flow

This document details the middleware, authentication, verification, and session management workflows for the Next.js application. The architecture is designed to securely manage user sessions by synchronizing with a remote, authoritative authentication system.

The core of the architecture is a "Sidecar Session" pattern. This pattern uses Next.js middleware to intercept incoming requests and maintain a local, encrypted session cache (`scix_session`) that is kept in sync with an opaque, master session token (`session` cookie) issued by a separate backend service.

The general data flow is as follows:

1.  **Request Interception:** All relevant incoming requests are first processed by the main Next.js middleware (`src/middleware.ts`).
2.  **Session Validation:** The `initSession` middleware function is called. It compares a fingerprint of the master `session` cookie against a fingerprint stored in the local `scix_session` cookie.
3.  **Fast Path (Cache Hit):** If the fingerprints match, the local session is considered valid. The request is passed to the application without any external calls. This is the default, high-performance path.
4.  **Slow Path (Cache Miss):** If the fingerprints do not match (or if the local session is missing), the middleware initiates a synchronization process.
5.  **Session Synchronization:** The middleware makes a server-to-server API call to the `/v1/user/bootstrap` endpoint, forwarding the master `session` cookie for validation.
6.  **Update Local Session:** The `bootstrap` endpoint returns the authoritative user data. The middleware updates the local `scix_session` cookie with this new data and a new fingerprint of the master `session` cookie.
7.  **Application Logic:** The request, now guaranteed to have a valid session, is passed to the Next.js application (pages, API routes, etc.).

This architecture provides a balance of performance (by caching session data locally) and security (by relying on a single, authoritative source of truth for authentication).

## 2. Core Technologies

-   **Next.js Middleware:** The entry point for all session management logic, defined in `src/middleware.ts`.
-   **iron-session:** A library for creating stateless, encrypted session data stored in a cookie. It powers the local `scix_session`.
-   **Web Crypto API (`SubtleCrypto`):** Used to generate SHA-1 hashes (fingerprints) of the master session cookie for fast, reliable comparisons.

## 3. Detailed Authentication Workflow

The primary logic is contained within the `initSession` middleware (`src/middlewares/initSession.ts`).

1.  **Cookie Inspection:** The middleware checks for the presence of the `session` cookie on the incoming request. If absent, the user is unauthenticated, and the workflow terminates.
2.  **Fingerprint Generation:** A SHA-1 hash of the `session` cookie's value is computed.
3.  **Local Session Verification (Fast Path):**
    -   The encrypted `scix_session` data is loaded.
    -   The newly computed fingerprint is compared to the fingerprint stored within `scix_session`.
    -   If the fingerprints match and the session's internal access token is not expired, the session is valid. The request proceeds to the application.
4.  **Remote Session Synchronization (Slow Path):**
    -   Triggered if fingerprints mismatch, the `scix_session` is absent, or the token is expired.
    -   A `fetch` call is made to the `/v1/user/bootstrap` API endpoint. The `session` cookie is passed in the `Cookie` header of this request.
5.  **Payload and Header Processing:**
    -   The `bootstrap` API validates the `session` cookie and responds with:
        -   A JSON payload (`IBootstrapPayload`) containing the authoritative user data (`IUserData`).
        -   A `Set-Cookie` header for a renewed `session` cookie.
    -   The middleware intercepts this API response.
6.  **Local Session Update:** The `IUserData` and the new `session` fingerprint are saved into the encrypted `scix_session`.
7.  **Cookie Header Manipulation:** The `Set-Cookie` header from the API response is modified before being sent to the browser:
    -   The `Domain` attribute is stripped to make it a host-only cookie.
    -   The `SameSite` attribute is explicitly set to `Lax`.
8.  **Completion:** The request proceeds with a fully validated and hydrated session.

## 4. Middleware Chain Breakdown

The main middleware file (`src/middleware.ts`) orchestrates several smaller, single-purpose middleware functions.

### `initSession` (`src/middlewares/initSession.ts`)

The core of the authentication system. It ensures every request has a valid, synchronized user session by implementing the detailed workflow described above.

### Legacy App Detection (`src/utils/legacyAppDetection.ts`)

A UX enhancement utility that inspects the `Referer` header during Server-Side Rendering.
-   **Function:** The `isFromLegacyApp()` utility checks if a user is navigating from the legacy ADS application domain.
-   **Purpose:** Used in SSR (`src/ssr-utils.ts`) to detect legacy app referrers and adjust the application's default mode to ASTROPHYSICS for a seamless user experience.
-   **Implementation:** Detection happens directly in SSR by checking `ctx.req.headers.referer`, avoiding the need for middleware session flags.

## 5. Cookie Strategy

Two primary cookies are used to manage authentication.

| Cookie Name       | Stored Data                                  | Issuer          | `SameSite` Policy     | Purpose                                            |
| ----------------- | -------------------------------------------- | --------------- | --------------------- | -------------------------------------------------- |
| `session`         | Opaque, master authentication token          | Backend API     | `Lax` (set by middleware) | The authoritative source of truth for authentication. |
| `scix_session`    | Encrypted `IUserData` and `session` fingerprint | Next.js Middleware | `Strict` (by config)      | A performant, local cache of the user session.     |

The `SameSite` policies are intentionally different:
-   `scix_session` is `Strict` for maximum security against CSRF attacks, as it only needs to be present for requests originating from the application itself.
-   `session` is set to `Lax` to ensure it is sent during top-level navigation from the legacy domain to the new application, which is a primary user journey.

## 6. Session Data Structure (`IUserData`)

The `scix_session` cookie contains an `iron-session` encrypted JSON object based on the `IUserData` interface (`src/api/user/types.ts`). This structure includes:

-   User ID
-   Email
-   Access and Refresh Tokens
-   Roles and Permissions
-   Other non-sensitive user profile information

## 7. Server-Side Rendering (SSR) Integration

Session data is integrated into the Next.js SSR process to ensure pages are rendered with correct user information server-side, preventing client-side content flashing.

**File:** `src/ssr-utils.ts`

The `updateUserStateSSR` helper function is used within `getServerSideProps`. It reads the user data from the `req.session` object (populated by the middleware) and injects it as props into the page component, making the user state available before the page is sent to the client.

## 8. Design Rationale and Context

The "Sidecar Session" pattern was chosen to solve a specific technical challenge: enabling a gradual "Strangler Fig" migration from a legacy application on one top-level domain (`.harvard.edu`) to a new Next.js application on another (`.org`).

Standard browser security measures prevent cookies from being shared across different top-level domains. This means the new application cannot directly read or validate the session cookie set by the legacy system.

This architecture bridges that gap by:
1.  Treating the legacy `session` cookie as an opaque token.
2.  Using a backend API (`/bootstrap`) as a trusted "verifier" that can validate the legacy cookie.
3.  Maintaining a local session cache (`scix_session`) in the Next.js application to avoid calling the verifier on every single request, thereby ensuring high performance.
4.  Carefully manipulating the legacy cookie's `Domain` and `SameSite` attributes in the middleware to make cross-domain navigation seamless for the end-user.
