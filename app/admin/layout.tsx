import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '../globals.css'
import AdminSidebarWrapper from '../../components/AdminSidebarWrapper'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Doko Pasal Admin',
  description: 'Admin panel for Doko Pasal.',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} min-h-full flex`}>
      <AdminSidebarWrapper />
      <main className="flex-1 ml-60 bg-gray-950 min-h-screen">
        {children}
      </main>
    </div>
  )
}
