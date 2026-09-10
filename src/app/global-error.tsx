'use client';

// App Router convention: error.tsx doesn't catch errors thrown by the root
// layout itself (it's rendered *by* that layout, so it goes down with it) --
// only global-error.tsx does, and it has to render its own <html>/<body>
// since the real root layout is what crashed. Kept intentionally minimal:
// no Tailwind/theme dependency, nothing that could itself fail if whatever
// broke the root layout was something foundational.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          padding: '1rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Something went wrong
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem', maxWidth: 380 }}>
          Hostiggo hit an unexpected error loading this page.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            background: '#0B2C4D',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
