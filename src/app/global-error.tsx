'use client';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Renders only when RootLayout itself has thrown, so it must not depend on
// Providers, the store, Chakra, or anything else that could throw again.
export default function GlobalError(props: GlobalErrorProps) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: '#000',
          background: '#fff',
        }}
      >
        <h1 style={{ fontSize: '20px', fontWeight: 500 }}>Application error: a client-side exception has occurred</h1>
        <button
          onClick={props.reset}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
