'use client'
import dynamic from 'next/dynamic'

const AdminSidebar = dynamic(() => import('./AdminSidebar'), { ssr: false })

export default function AdminSidebarWrapper() {
  return <AdminSidebar />
}
