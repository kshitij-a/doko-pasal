import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#FAF8F4] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-7xl mb-6">🧺</div>
        <h1 className="text-4xl font-bold text-[#1E1A16] mb-3" style={{ fontFamily: 'var(--font-display)' }}>404</h1>
        <p className="text-[#6B6560] text-lg mb-2">Page not found</p>
        <p className="text-[#9E9994] text-sm mb-8">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/" className="inline-block bg-[#B5293A] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#9A2231] transition">
          Back to Home
        </Link>
      </div>
    </main>
  )
}
