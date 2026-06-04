'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/products', label: 'Products', icon: '📦' },
  { href: '/admin/orders', label: 'Orders', icon: '🛒' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/coupons', label: 'Coupons', icon: '🏷️' },
  { href: '/admin/reviews', label: 'Reviews', icon: '⭐' },
  { href: '/admin/banners', label: 'Banners', icon: '🖼️' },
  { href: '/admin/messages', label: 'Messages', icon: '💬' },
  { href: '/admin/activity', label: 'Activity Log', icon: '📋' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-gray-950 text-white min-h-screen p-4 flex flex-col fixed left-0 top-0 bottom-0 overflow-y-auto">
      <Link href="/admin" className="text-xl font-extrabold mb-6 px-3 text-red-400">
        🧺 Admin Panel
      </Link>
      <nav className="flex-1 space-y-1">
        {links.map(link => {
          const active = pathname === link.href || (link.href !== '/admin' && pathname?.startsWith(link.href))
          return (
            <Link key={link.href} href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                active ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-gray-800 pt-3 mt-3">
        <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition">
          🏠 View Store
        </Link>
      </div>
    </aside>
  )
}
