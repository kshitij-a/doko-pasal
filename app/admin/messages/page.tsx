'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminMessages() {
  const router = useRouter()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConv, setSelectedConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<any>(null)
  const fileInputRef = useRef<any>(null)

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (!selectedConv) return
    const channel = supabase
      .channel(`admin-messages:${selectedConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConv.id}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedConv])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
    fetchConversations()
  }

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false })
    if (data) setConversations(data)
    setLoading(false)
  }

  const selectConversation = async (conv: any) => {
    setSelectedConv(conv)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    // Mark as read
    await supabase.from('conversations').update({ unread_count: 0 }).eq('id', conv.id)
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c))
  }

  const sendReply = async (content: string, mediaUrl?: string, mediaType?: string) => {
    if (!selectedConv) return
    if (!content.trim() && !mediaUrl) return
    setSending(true)

    const { data: userData } = await supabase.auth.getUser()
    await supabase.from('messages').insert({
      conversation_id: selectedConv.id,
      sender_id: userData.user?.id,
      sender_name: 'Doko Pasal',
      sender_email: 'admin',
      content: content.trim(),
      media_url: mediaUrl || null,
      media_type: mediaType || null,
      is_admin: true,
      is_read: false,
    })
    await supabase.from('conversations').update({
      last_message: content.trim() || (mediaType === 'image' ? '📷 Photo' : '🎥 Video'),
      last_message_at: new Date().toISOString(),
    }).eq('id', selectedConv.id)

    setInput('')
    setSending(false)
    fetchConversations()
  }

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) { alert('Only images and videos!'); return }
    setUploading(true)
    const fileName = `chat/${selectedConv.id}/${Date.now()}-${file.name.replace(/\s/g, '_')}`
    const { data, error } = await supabase.storage.from('chat-media').upload(fileName, file)
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(fileName)
    await sendReply('', urlData.publicUrl, isImage ? 'image' : 'video')
    setUploading(false)
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="flex">
        {/* SIDEBAR */}
        <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 fixed left-0 top-0 flex flex-col z-50">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-xl">🧺</div>
              <div>
                <p className="font-bold text-white">Doko Pasal</p>
                <p className="text-xs text-red-400 font-semibold tracking-widest">ADMIN</p>
              </div>
            </div>
          </div>
          <nav className="p-4 flex-1 space-y-1">
            {[
              { href: '/admin', label: 'Dashboard', icon: '📊' },
              { href: '/admin/products', label: 'Products', icon: '👔' },
              { href: '/admin/orders', label: 'All Orders', icon: '📦' },
              { href: '/admin/messages', label: 'Messages', icon: '💬' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
                  item.href === '/admin/messages'
                    ? 'bg-red-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}>
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-800">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 text-sm transition">
              🏪 View Store
            </Link>
          </div>
        </aside>

        {/* MAIN CHAT AREA */}
        <div className="ml-64 flex-1 flex" style={{ height: '100vh' }}>

          {/* CONVERSATIONS LIST */}
          <div className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="px-4 py-4 border-b border-gray-800">
              <h1 className="text-xl font-extrabold text-white">Messages</h1>
              <p className="text-gray-400 text-sm mt-0.5">{conversations.length} conversations</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-center py-10 text-gray-500">⏳ Loading...</div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="text-5xl mb-3">💬</div>
                  <p className="text-gray-400 text-sm">No messages yet</p>
                  <p className="text-gray-500 text-xs mt-1">When customers message you, they'll appear here</p>
                </div>
              ) : (
                conversations.map(conv => (
                  <button key={conv.id} onClick={() => selectConversation(conv)}
                    className={`w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-800 transition text-left border-b border-gray-800/50 ${
                      selectedConv?.id === conv.id ? 'bg-gray-800 border-l-2 border-l-red-500' : ''
                    }`}>
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0">
                      {conv.user_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <p className="font-bold text-white text-sm truncate">{conv.user_name}</p>
                        <p className="text-gray-500 text-xs flex-shrink-0 ml-2">{timeAgo(conv.last_message_at)}</p>
                      </div>
                      <p className="text-gray-400 text-xs truncate">{conv.last_message || 'No messages yet'}</p>
                      <p className="text-gray-600 text-xs truncate">{conv.user_email}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold flex-shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* CHAT VIEW */}
          <div className="flex-1 flex flex-col bg-gray-950">
            {!selectedConv ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-7xl mb-4">💬</div>
                  <p className="text-gray-400 text-xl font-semibold">Select a conversation</p>
                  <p className="text-gray-600 text-sm mt-2">Choose a customer from the left to start chatting</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-800 bg-gray-900 flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-lg font-extrabold text-white">
                    {selectedConv.user_name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-extrabold text-white">{selectedConv.user_name}</p>
                    <p className="text-gray-400 text-xs">{selectedConv.user_email}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-10">
                      <p className="text-gray-500">No messages yet. Reply to start the conversation!</p>
                    </div>
                  )}
                  {messages.map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}>
                      {!msg.is_admin && (
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-sm font-bold text-white mr-2 flex-shrink-0 mt-1">
                          {selectedConv.user_name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className={`max-w-sm ${msg.is_admin ? 'items-end' : 'items-start'} flex flex-col`}>
                        <div className={`rounded-2xl px-4 py-3 ${
                          msg.is_admin
                            ? 'bg-red-700 text-white rounded-tr-sm'
                            : 'bg-gray-800 text-gray-100 rounded-tl-sm'
                        }`}>
                          {msg.media_url && msg.media_type === 'image' && (
                            <img src={msg.media_url} alt="Shared"
                              className="rounded-xl mb-2 max-w-full cursor-pointer hover:opacity-90 transition"
                              style={{ maxHeight: '200px', objectFit: 'cover' }}
                              onClick={() => window.open(msg.media_url, '_blank')} />
                          )}
                          {msg.media_url && msg.media_type === 'video' && (
                            <video src={msg.media_url} controls className="rounded-xl mb-2 max-w-full" style={{ maxHeight: '200px' }} />
                          )}
                          {msg.content && <p className="text-sm leading-relaxed">{msg.content}</p>}
                        </div>
                        <p className="text-gray-600 text-xs mt-1 px-1">
                          {new Date(msg.created_at).toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' })}
                          {msg.is_admin && ' · You'}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input */}
                <div className="px-4 py-4 border-t border-gray-800 bg-gray-900">
                  <div className="flex items-center gap-3 bg-gray-800 rounded-2xl px-4 py-3 border border-gray-700">
                    <button onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      title="Send photo or video"
                      className="text-gray-400 hover:text-red-400 transition text-xl flex-shrink-0">
                      {uploading ? '⏳' : '📎'}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />

                    <input
                      type="text"
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(input) } }}
                      placeholder={`Reply to ${selectedConv.user_name}...`}
                      className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
                    />

                    <button onClick={() => sendReply(input)}
                      disabled={sending || !input.trim()}
                      className="w-9 h-9 bg-red-700 rounded-full flex items-center justify-center hover:bg-red-600 transition disabled:opacity-40 flex-shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-600 text-xs text-center mt-2">Press Enter to send • 📎 to attach photo/video</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}