import type { Metadata } from 'next'
import '../globals.css'
import AdminSidebarWrapper from '../../components/AdminSidebarWrapper'

export const metadata: Metadata = {
  title: 'Doko Pasal Admin',
  description: 'Admin panel for Doko Pasal.',
}

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
