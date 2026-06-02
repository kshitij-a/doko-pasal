'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [unread, setUnread] = useState(0)
  const messagesEndRef = useRef<any>(null)
  const fileInputRef = useRef<any>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (!conversationId) return
    // Real-time subscription
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
        if (!open && payload.new.is_admin) {
          setUnread(u => u + 1)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId, open])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (data.user) {
      setUser(data.user)
      await getOrCreateConversation(data.user)
    }
  }

  const getOrCreateConversation = async (user: any) => {
    // Check existing conversation
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existing) {
      setConversationId(existing.id)
      loadMessages(existing.id)
    } else {
      // Create new conversation
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          user_email: user.email,
          last_message: '',
        })
        .select()
        .single()
      if (newConv) {
        setConversationId(newConv.id)
      }
    }
  }

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
  }

  const sendMessage = async (content: string, mediaUrl?: string, mediaType?: string) => {
    if (!user || !conversationId) return
    if (!content.trim() && !mediaUrl) return
    setSending(true)

    const messageId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const msg = {
      id: messageId,
      conversation_id: conversationId,
      sender_id: user.id,
      sender_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      sender_email: user.email,
      content: content.trim(),
      media_url: mediaUrl || null,
      media_type: mediaType || null,
      is_admin: false,
      is_read: false,
    }
    const { data: inserted, error: insertError } = await supabase.from('messages').insert(msg).select().single()
    if (insertError) {
      alert('Failed to send message: ' + insertError.message)
      setSending(false)
      return
    }
    if (inserted) {
      setMessages(prev => prev.some(m => m.id === inserted.id) ? prev : [...prev, inserted])
    }
    await supabase.from('conversations').update({
      last_message: content.trim() || (mediaType === 'image' ? '📷 Photo' : '🎥 Video'),
      last_message_at: new Date().toISOString(),
    }).eq('id', conversationId)

    setInput('')
    setSending(false)
  }

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) {
      alert('Only images and videos are allowed!')
      setUploading(false)
      return
    }
    setUploading(true)
    const fileName = `chat/${conversationId}/${Date.now()}-${file.name.replace(/\s/g, '_')}`
    const { data, error } = await supabase.storage
      .from('chat-media')
      .upload(fileName, file)
    if (error) {
      alert('Upload failed: ' + error.message)
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(fileName)
    await sendMessage('', urlData.publicUrl, isImage ? 'image' : 'video')
    setUploading(false)
  }

  const handleOpen = () => {
    setOpen(true)
    setUnread(0)
    if (conversationId) loadMessages(conversationId)
  }

  if (!user) return (
    <div className="fixed bottom-6 right-6 z-[999]">
      <a href="/auth/login"
        className="flex items-center gap-2 bg-red-700 text-white px-5 py-3 rounded-full shadow-2xl font-bold hover:bg-red-600 transition">
        💬 Chat with us
      </a>
    </div>
  )

  return (
    <div className="fixed bottom-6 right-6 z-[999]">
      {/* CHAT WINDOW */}
      {open && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
          style={{ height: '520px', display: 'flex', flexDirection: 'column' }}>

          {/* HEADER */}
          <div className="bg-gradient-to-r from-red-700 to-red-600 px-4 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">🧺</div>
            <div className="flex-1">
              <p className="font-extrabold text-white text-sm">Doko Pasal Support</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <p className="text-white/70 text-xs">Online — replies quickly</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition">×</button>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">👋</div>
                <p className="font-bold text-gray-700 text-sm">नमस्ते! Welcome to Doko Pasal</p>
                <p className="text-gray-400 text-xs mt-1">Send us a message and we'll reply shortly!</p>
                <p className="text-gray-400 text-xs mt-1">You can send photos and videos too 📸</p>
              </div>
            )}

            {messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-xs ${msg.is_admin ? 'order-2' : ''}`}>
                  {msg.is_admin && (
                    <div className="flex items-center gap-1.5 mb-1 ml-1">
                      <div className="w-5 h-5 bg-red-700 rounded-full flex items-center justify-center text-xs">🧺</div>
                      <span className="text-xs text-gray-500 font-semibold">Doko Pasal</span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    msg.is_admin
                      ? 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'
                      : 'bg-red-700 text-white rounded-tr-sm'
                  }`}>
                    {msg.media_url && msg.media_type === 'image' && (
                      <img src={msg.media_url} alt="Shared image"
                        className="rounded-xl mb-2 max-w-full cursor-pointer hover:opacity-90 transition"
                        onClick={() => window.open(msg.media_url, '_blank')} />
                    )}
                    {msg.media_url && msg.media_type === 'video' && (
                      <video src={msg.media_url} controls className="rounded-xl mb-2 max-w-full" />
                    )}
                    {msg.content && (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                    <p className={`text-xs mt-1 ${msg.is_admin ? 'text-gray-400' : 'text-white/60'}`}>
                      {new Date(msg.created_at).toLocaleTimeString('en-NP', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT */}
          <div className="px-3 py-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-3 py-2 border border-gray-200">
              {/* Media upload */}
              <button onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-gray-400 hover:text-red-600 transition text-xl flex-shrink-0"
                title="Send photo or video">
                {uploading ? '⏳' : '📎'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />

              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
              />

              <button
                onClick={() => sendMessage(input)}
                disabled={sending || (!input.trim())}
                className="w-8 h-8 bg-red-700 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition disabled:opacity-40 flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BUTTON */}
      <button
        onClick={handleOpen}
        className="w-14 h-14 bg-red-700 rounded-full shadow-2xl flex items-center justify-center hover:bg-red-600 active:scale-95 transition relative">
        {open ? (
          <span className="text-white text-2xl font-bold">×</span>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 bg-yellow-400 text-red-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-extrabold">
            {unread}
          </span>
        )}
      </button>
    </div>
  )
}