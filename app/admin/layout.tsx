import type { Metadata } from 'next'
import '../globals.css'
import AdminSidebarWrapper from '../../components/AdminSidebarWrapper'

export const metadata: Metadata = {
  title: 'Doko Pasal Admin',
  description: 'Admin panel for Doko Pasal.',
}

// NOTE: this server layout stays minimal on purpose. Each admin page must
// still server-check admin access, and middleware.ts redirects /admin/*
// without a Supabase session cookie to /auth/login (first-line defense only,
// real authorization happens in the admin APIs via verifyAdminAccess).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--admin-bg)', minHeight: '100vh' }}>
      <AdminSidebarWrapper />
      <main className="admin-page">
        {children}
      </main>
    </div>
  )
}
