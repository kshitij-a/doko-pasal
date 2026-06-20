'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">⚠️</div>
        <h1 className="text-2xl font-bold text-[#1E1A16] mb-3">Something went wrong</h1>
        <p className="text-[#6B6560] text-sm mb-6">An unexpected error occurred. Please try again.</p>
        <button onClick={reset} className="bg-[#B5293A] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#9A2231] transition">
          Try Again
        </button>
      </div>
    </main>
  )
}
