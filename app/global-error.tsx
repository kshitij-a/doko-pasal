'use client'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: '#FAF8F4' }}>
          <div style={{ textAlign: 'center', maxWidth: '24rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⚠️</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1E1A16', marginBottom: '0.5rem' }}>Something went wrong</h1>
            <p style={{ color: '#6B6560', fontSize: '0.875rem', marginBottom: '1.5rem' }}>A critical error occurred. Please refresh the page.</p>
            <button onClick={reset} style={{ background: '#B5293A', color: 'white', padding: '0.75rem 2rem', borderRadius: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
              Refresh Page
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
