# Global Error Handler

This document describes the global error handling system in Nectar, which provides unified error formatting, logging, and reporting across the application.

## Overview

The global error handler provides a centralized way to handle errors throughout the application, ensuring:
- **Consistent error formatting** across all error sources
- **Comprehensive logging** using Pino logger
- **Sentry integration** for error tracking and monitoring
- **Context enrichment** with relevant metadata
- **Specialized handlers** for different error sources

## Architecture

### Core Components

1. **Error Handler Module** (`src/lib/errorHandler.ts`)
   - Main error handling logic
   - Error normalization and standardization
   - Integration with Pino and Sentry

2. **Automatic Integration Points**
   - Window-level error handlers (uncaught errors and promise rejections)
   - React Query error handlers (queries and mutations)
   - Error Boundaries
   - API response interceptor

## Standard Error Format

All errors are normalized to a `StandardError` format:

```typescript
interface StandardError {
  message: string;           // User-friendly error message
  name: string;              // Error type/name
  stack?: string;            // Stack trace
  originalError: unknown;    // Original error object
  source: ErrorSource;       // Where the error originated
  severity: ErrorSeverity;   // Error severity level
  context?: Record<string, unknown>;  // Additional context
  timestamp: number;         // When error was captured
  statusCode?: number;       // HTTP status (if applicable)
  url?: string;              // Endpoint/URL (if applicable)
}
```

### Error Sources

```typescript
enum ErrorSource {
  WINDOW = 'window',                    // Uncaught window errors
  PROMISE = 'unhandled-promise',        // Unhandled promise rejections
  REACT_QUERY = 'react-query',          // React Query errors
  ERROR_BOUNDARY = 'error-boundary',    // React Error Boundary errors
  API = 'api',                          // API/network errors
  MANUAL = 'manual',                    // Manually handled errors
  MIDDLEWARE = 'middleware',            // Middleware errors
  SERVER = 'server',                    // Server-side errors
}
```

### Error Severity Levels

```typescript
enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}
```

## Usage

### Automatic Error Handling

The following errors are handled automatically:

#### 1. Window-Level Errors

Uncaught errors and unhandled promise rejections are automatically captured:

```typescript
// Automatically initialized in src/providers.tsx
useGlobalErrorHandler();
```

#### 2. React Query Errors

All query and mutation errors are automatically logged and reported:

```typescript
// Configured in src/lib/useCreateQueryClient.ts
const { data } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  // Errors are automatically handled
});

// To skip global error handling for specific queries:
const { data } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  meta: {
    skipGlobalErrorHandler: true,
  },
});
```

#### 3. Error Boundaries

Errors caught by React Error Boundaries are automatically handled:

```typescript
// Configured in src/hocs/withErrorBoundary.tsx
const MyComponent = withErrorBoundary(
  {
    onErrorRender: () => <ErrorFallback />,
    onLoadingRender: () => <Loading />,
  },
  MyComponentImpl
);
```

#### 4. API Errors

All API errors are automatically logged via the response interceptor:

```typescript
// Configured in src/api/api.ts
// All axios errors are automatically logged
// Sentry reporting is skipped to avoid duplicates with React Query
```

### Manual Error Handling

For errors you need to handle manually:

#### Basic Usage

```typescript
import { handleError, ErrorSource } from '@/lib/errorHandler';

try {
  await someOperation();
} catch (error) {
  handleError(error, {
    source: ErrorSource.MANUAL,
    context: { operation: 'someOperation' },
  });
}
```

#### Specialized Handlers

Use specialized handlers for specific contexts:

```typescript
import {
  handleAPIError,
  handleQueryError,
  handleBoundaryError,
  handleWindowError,
  handlePromiseRejection,
} from '@/lib/errorHandler';

// API errors
try {
  const response = await fetch('/api/data');
} catch (error) {
  handleAPIError(error, '/api/data', {
    userId: currentUser.id,
  });
}

// Custom query errors (if not using React Query)
handleQueryError(error, {
  queryKey: ['custom-query'],
});
```

#### Advanced Options

```typescript
handleError(error, {
  source: ErrorSource.MANUAL,
  severity: ErrorSeverity.WARNING,
  context: {
    userId: '123',
    action: 'submit-form',
  },
  tags: {
    feature: 'user-profile',
    component: 'ProfileForm',
  },
  fingerprint: ['custom', 'grouping', 'key'],
  user: {
    id: '123',
    email: 'user@example.com',
  },
  skipLogging: false,  // Skip Pino logging
  skipSentry: false,   // Skip Sentry reporting
});
```

### Creating Custom Error Handlers

Create context-specific error handlers with pre-configured options:

```typescript
import { createErrorHandler, ErrorSource } from '@/lib/errorHandler';

// Create a handler for authentication errors
const handleAuthError = createErrorHandler({
  source: ErrorSource.API,
  tags: { module: 'auth' },
  severity: ErrorSeverity.WARNING,
});

// Use it
try {
  await login(credentials);
} catch (error) {
  handleAuthError(error, {
    context: { username: credentials.username },
  });
}
```

## Best Practices

### 1. Choose the Right Severity

- **DEBUG**: Diagnostic information
- **INFO**: Informational messages about expected errors
- **WARNING**: Recoverable errors that may need attention
- **ERROR**: Errors that affect functionality (default)
- **FATAL**: Critical errors that may crash the application

### 2. Provide Context

Always include relevant context to help debug issues:

```typescript
handleError(error, {
  context: {
    userId: user.id,
    action: 'submit-form',
    formData: sanitizedFormData, // Be careful with sensitive data
  },
});
```

### 3. Use Appropriate Tags

Tags help organize errors in Sentry:

```typescript
handleError(error, {
  tags: {
    feature: 'search',
    component: 'SearchResults',
    userType: user.isAdmin ? 'admin' : 'user',
  },
});
```

### 4. Skip Duplicate Reporting

Avoid duplicate Sentry reports when errors are handled at multiple levels:

```typescript
// In low-level API code
handleAPIError(error, endpoint, {
  skipSentry: true, // Will be reported by React Query
});
```

### 5. Custom Fingerprints

Use custom fingerprints to control error grouping in Sentry:

```typescript
handleError(error, {
  fingerprint: [
    'database-connection-error',
    process.env.DATABASE_HOST,
  ],
});
```

## Integration with Existing Systems

### Pino Logger

All errors are logged using the existing Pino logger with structured data:

```typescript
// Error logs include:
{
  errorName: 'APIError',
  errorMessage: 'Failed to fetch data',
  source: 'api',
  severity: 'error',
  context: { ... },
  statusCode: 500,
  url: '/api/data',
  timestamp: 1234567890,
  stack: '...'
}
```

### Sentry

Errors are reported to Sentry with:
- **Level**: Mapped from ErrorSeverity
- **Tags**: Source, error name, custom tags
- **Context**: Additional metadata in extra data
- **Fingerprint**: Custom grouping (optional)
- **User**: User context (optional)

### React Query

React Query errors are automatically handled with context:
- Query key
- Query hash
- Query state
- Mutation ID and variables (for mutations)

## Error Flow Diagram

```
Error Occurs
    ↓
┌──────────────────────────────────────┐
│  Error Source                        │
├──────────────────────────────────────┤
│  • Window (uncaught)                 │
│  • Promise (unhandled rejection)     │
│  • React Query (query/mutation)      │
│  • Error Boundary (component error)  │
│  • API (network error)               │
│  • Manual (try/catch)                │
└──────────────┬───────────────────────┘
               ↓
    ┌──────────────────┐
    │  Global Error    │
    │     Handler      │
    └────────┬─────────┘
             ↓
    ┌────────────────┐
    │   Normalize    │
    │     Error      │
    └────┬───────────┘
         ↓
    ┌────────────────┐
    │  Log to Pino   │
    └────┬───────────┘
         ↓
    ┌────────────────┐
    │ Report to      │
    │    Sentry      │
    └────────────────┘
```

## Troubleshooting

### Errors Not Being Logged

1. Check if logging is skipped: `skipLogging: true`
2. Verify Pino logger is initialized
3. Check log level configuration: `NEXT_PUBLIC_LOG_LEVEL`

### Errors Not in Sentry

1. Check if Sentry is skipped: `skipSentry: true`
2. Verify Sentry DSN is configured: `NEXT_PUBLIC_SENTRY_DSN`
3. Ensure error occurs in browser (not during SSR with undefined window)
4. Check Sentry sample rates in config

### Duplicate Sentry Reports

1. Use `skipSentry: true` in lower-level handlers (e.g., API interceptor)
2. Ensure errors aren't handled at multiple levels
3. Use `meta.skipGlobalErrorHandler` for specific React Query errors

## Migration Guide

### From Direct Logger Calls

**Before:**
```typescript
logger.error('Error occurred', { error });
```

**After:**
```typescript
handleError(error, {
  context: { /* additional context */ },
});
```

### From Direct Sentry Calls

**Before:**
```typescript
Sentry.captureException(error, {
  tags: { component: 'MyComponent' },
});
```

**After:**
```typescript
handleError(error, {
  tags: { component: 'MyComponent' },
});
```

## Future Enhancements

Potential improvements for the global error handler:

1. **Error Recovery Strategies**: Automatic retry logic for certain error types
2. **Error Metrics**: Track error rates and patterns
3. **User Notifications**: Optional user-facing error messages
4. **Error Boundaries**: Automatic error boundary generation
5. **Performance Monitoring**: Integration with Sentry performance monitoring
6. **Error Analytics**: Dashboard for error trends and patterns

## Related Files

- `src/lib/errorHandler.ts` - Main error handler implementation
- `src/lib/useGlobalErrorHandler.ts` - Hook for initializing global handlers
- `src/lib/useCreateQueryClient.ts` - React Query integration
- `src/hocs/withErrorBoundary.tsx` - Error Boundary integration
- `src/api/api.ts` - API error handling
- `src/providers.tsx` - Global error handler initialization

## Support

For questions or issues with the global error handler:
1. Check this documentation
2. Review the implementation in `src/lib/errorHandler.ts`
3. Check Sentry for error reports and patterns
4. Review Pino logs for detailed error information
