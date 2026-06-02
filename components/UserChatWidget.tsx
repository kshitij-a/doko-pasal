'use client'

import { usePathname } from 'next/navigation'
import ChatWidget from './ChatWidget'

export default function UserChatWidget() {
  const pathname = usePathname()

  if (!pathname || pathname.startsWith('/admin')) {
    return null
  }

  return <ChatWidget />
}
