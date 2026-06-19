'use client'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { npTime, npShortDate } from '../../../lib/timezone'

const QUICK_REPLIES = [
  { label: 'Thank you!', text: 'Thank you for reaching out! How can we help you?' },
  { label: 'Order status', text: 'Let me check your order status. Could you share your order ID?' },
  { label: 'Will do', text: 'Got it! We\'ll take care of this right away.' },
  { label: 'Sorry', text: 'We\'re sorry for the inconvenience. Let us make this right.' },
  { label: 'On the way', text: 'Your order is on the way! You\'ll receive it soon.' },
  { label: 'Call us', text: 'Please call us at 01-5XXXXXX for immediate assistance.' },
]

export default function AdminMessages() {
  const router = useRouter()
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConv, setSelectedConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newMsgToast, setNewMsgToast] = useState('')
  const [showQuickReplies, setShowQuickReplies] = useState(false)
  const [showContext, setShowContext] = useState(false)
  const [customerOrders, setCustomerOrders] = useState<any[]>([])
  const messagesEndRef = useRef<any>(null)
  const fileInputRef = useRef<any>(null)
  const conversationsRef = useRef<any[]>([])

  useEffect(() => { checkAdmin() }, [])

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedConv) return
    const channel = supabase
      .channel(`admin-messages:${selectedConv.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selectedConv.id}` }, (payload) => {
        setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedConv])

  useEffect(() => { conversationsRef.current = conversations }, [conversations])

  useEffect(() => {
    const channel = supabase
      .channel('admin-all-conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setConversations(prev => prev.map(c => c.id === payload.new.id ? { ...c, ...payload.new } : c).sort((a: any, b: any) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()))
        } else if (payload.eventType === 'INSERT') {
          setConversations(prev => [payload.new, ...prev])
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as any
        if (selectedConv?.id === newMsg.conversation_id) return
        setConversations(prev => prev.map(c => c.id === newMsg.conversation_id ? { ...c, unread_count: (c.unread_count || 0) + 1, last_message: newMsg.content || '📎 Attachment', last_message_at: new Date().toISOString() } : c))
        const senderName = conversationsRef.current.find((c: any) => c.id === newMsg.conversation_id)?.user_name || 'Customer'
        setNewMsgToast(`💬 New message from ${senderName}`)
        setTimeout(() => setNewMsgToast(''), 5000)
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
    const { data } = await supabase.from('conversations').select('*').order('last_message_at', { ascending: false })
    if (data) setConversations(data)
    setLoading(false)
  }

  const selectConversation = async (conv: any) => {
    setSelectedConvId(conv.id)
    setSelectedConv(conv)
    setShowContext(false)
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: true })
    if (data) setMessages(data)
    await supabase.from('conversations').update({ unread_count: 0 }).eq('id', conv.id)
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c))
    // Fetch customer orders for context panel
    if (conv.user_email) {
      const { data: userData } = await supabase.auth.admin.listUsers()
      const user = userData?.users?.find((u: any) => u.email === conv.user_email)
      if (user) {
        const { data: orders } = await supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5)
        setCustomerOrders(orders || [])
      }
    }
  }

  const deleteConversation = async () => {
    if (!selectedConv || !confirm('Delete this conversation?')) return
    await supabase.from('messages').delete().eq('conversation_id', selectedConv.id)
    await supabase.from('conversations').delete().eq('id', selectedConv.id)
    setConversations(prev => prev.filter(c => c.id !== selectedConv.id))
    setSelectedConv(null)
    setMessages([])
  }

  const parseTimestamp = (v: string | null | undefined) => {
    if (!v) return null
    const hasTZ = /[Zz]|[+-]\d{2}(:\d{2})?$/.test(v.trim())
    const d = new Date(hasTZ ? v : v + 'Z')
    return isNaN(d.getTime()) ? null : d
  }

  const timeAgo = (date: string | null | undefined) => {
    const dt = parseTimestamp(date)
    if (!dt) return ''
    const diff = Date.now() - dt.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return dt.toLocaleDateString('en-US', { timeZone: 'Asia/Kathmandu', month: 'short', day: 'numeric' })
  }

  const sendReply = async (content: string, mediaUrl?: string, mediaType?: string) => {
    if (!selectedConv || (!content.trim() && !mediaUrl)) return
    setSending(true)
    const { data: userData } = await supabase.auth.getUser()
    await supabase.from('messages').insert({
      conversation_id: selectedConv.id, sender_id: userData.user?.id, sender_name: 'Doko Pasal',
      sender_email: 'admin', content: content.trim(), media_url: mediaUrl || null,
      media_type: mediaType || null, is_admin: true, is_read: false,
    })
    await supabase.from('conversations').update({ last_message: content.trim() || '📎 Attachment', last_message_at: new Date().toISOString() }).eq('id', selectedConv.id)
    setInput('')
    setShowQuickReplies(false)
    setSending(false)
    fetchConversations()
  }

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) { alert('Only images and videos'); return }
    setUploading(true)
    const fileName = `chat/${selectedConv.id}/${Date.now()}-${file.name.replace(/\s/g, '_')}`
    const { data, error } = await supabase.storage.from('chat-media').upload(fileName, file)
    if (error) { alert('Upload failed: ' + error.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(fileName)
    await sendReply('', urlData.publicUrl, isImage ? 'image' : 'video')
    setUploading(false)
  }

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)

  return (
    <div style={{ height: 'calc(100vh - 80px)', display: 'flex', overflow: 'hidden', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
      {/* Toast */}
      {newMsgToast && (
        <div className="admin-toast" style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: 'rgba(59,130,246,0.15)', color: 'var(--admin-blue)', border: '1px solid rgba(59,130,246,0.3)' }}>
          {newMsgToast}
        </div>
      )}

      {/* Conversations List */}
      <div style={{ width: 320, borderRight: '1px solid var(--admin-border)', background: 'var(--admin-surface)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--admin-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ font: '600 18px var(--admin-font-ui)', color: 'var(--admin-text)', margin: 0 }}>Messages</h2>
            {totalUnread > 0 && (
              <span style={{ padding: '2px 8px', borderRadius: 10, background: 'var(--admin-accent)', color: 'white', font: '600 11px var(--admin-font-mono)' }}>{totalUnread}</span>
            )}
          </div>
          <p style={{ font: '400 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)', margin: '4px 0 0' }}>{conversations.length} conversations</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>Loading...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No messages yet</div>
          ) : (
            conversations.map(conv => (
              <button key={conv.id} onClick={() => selectConversation(conv)} style={{
                width: '100%', padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center',
                background: selectedConv?.id === conv.id ? 'var(--admin-surface-2)' : conv.unread_count > 0 ? 'var(--admin-surface-2)' : 'transparent',
                border: 'none', borderLeft: selectedConv?.id === conv.id ? '3px solid var(--admin-accent)' : conv.unread_count > 0 ? '3px solid var(--admin-accent)' : '3px solid transparent',
                borderRight: 'none', borderTop: 'none', borderBottom: '1px solid var(--admin-border)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 20, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--admin-accent), rgba(232,69,96,0.6))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  font: '700 16px var(--admin-font-ui)', color: 'white',
                }}>{conv.user_name?.charAt(0)?.toUpperCase() || '?'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ font: `${conv.unread_count > 0 ? '700' : '500'} 13px var(--admin-font-ui)`, color: conv.unread_count > 0 ? 'var(--admin-text)' : 'var(--admin-text-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.user_name}</span>
                    <span style={{ font: '400 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)', flexShrink: 0, marginLeft: 8 }}>{timeAgo(conv.last_message_at)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ font: `${conv.unread_count > 0 ? '600' : '400'} 12px var(--admin-font-ui)`, color: conv.unread_count > 0 ? 'var(--admin-text-soft)' : 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.last_message || 'No messages yet'}</span>
                    {conv.unread_count > 0 && (
                      <span style={{ width: 18, height: 18, borderRadius: 9, background: 'var(--admin-accent)', color: 'white', font: '600 10px var(--admin-font-mono)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 6 }}>{conv.unread_count}</span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--admin-bg)' }}>
        {!selectedConv ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <p style={{ font: '500 16px var(--admin-font-ui)', color: 'var(--admin-text)' }}>Select a conversation</p>
              <p style={{ font: '400 13px var(--admin-font-ui)', color: 'var(--admin-text-muted)', marginTop: 4 }}>Choose a customer to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--admin-surface)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: 'linear-gradient(135deg, var(--admin-accent), rgba(232,69,96,0.6))', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 14px var(--admin-font-ui)', color: 'white', flexShrink: 0 }}>
                {selectedConv.user_name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ font: '600 14px var(--admin-font-ui)', color: 'var(--admin-text)' }}>{selectedConv.user_name}</div>
                <div style={{ font: '400 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>{selectedConv.user_email}</div>
              </div>
              <button className="btn-admin-ghost" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => setShowContext(!showContext)}>
                {showContext ? 'Hide' : 'Customer Info'}
              </button>
              <button className="btn-admin-ghost" style={{ fontSize: 12, padding: '5px 10px', color: 'var(--admin-red)' }} onClick={deleteConversation}>Delete</button>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {messages.length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No messages yet. Send a reply!</div>
                )}
                {messages.map((msg: any) => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: msg.is_admin ? 'flex-end' : 'flex-start', gap: 8 }}>
                    {!msg.is_admin && (
                      <div style={{ width: 28, height: 28, borderRadius: 14, background: 'linear-gradient(135deg, var(--admin-accent), rgba(232,69,96,0.6))', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 11px var(--admin-font-ui)', color: 'white', flexShrink: 0, marginTop: 4 }}>
                        {selectedConv.user_name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div style={{ maxWidth: 380 }}>
                      <div style={{
                        padding: '10px 14px', borderRadius: 12,
                        borderTopLeftRadius: msg.is_admin ? 12 : 4,
                        borderTopRightRadius: msg.is_admin ? 4 : 12,
                        background: msg.is_admin ? 'var(--admin-accent)' : 'var(--admin-surface-2)',
                        color: msg.is_admin ? 'white' : 'var(--admin-text)',
                        font: '400 13px var(--admin-font-ui)', lineHeight: 1.5,
                      }}>
                        {msg.media_url && msg.media_type === 'image' && (
                          <img src={msg.media_url} alt="" style={{ borderRadius: 8, maxWidth: '100%', maxHeight: 180, objectFit: 'cover', marginBottom: msg.content ? 8 : 0, cursor: 'pointer' }} onClick={() => window.open(msg.media_url, '_blank')} />
                        )}
                        {msg.media_url && msg.media_type === 'video' && (
                          <video src={msg.media_url} controls style={{ borderRadius: 8, maxWidth: '100%', maxHeight: 180, marginBottom: msg.content ? 8 : 0 }} />
                        )}
                        {msg.content}
                      </div>
                      <p style={{ font: '400 10px var(--admin-font-ui)', color: 'var(--admin-text-muted)', marginTop: 4, paddingLeft: msg.is_admin ? 0 : 4, paddingRight: msg.is_admin ? 4 : 0, textAlign: msg.is_admin ? 'right' : 'left' }}>
                        {npTime(msg.created_at)}
                        {msg.is_admin && ' · You'}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Customer Context Panel */}
              {showContext && (
                <div style={{ width: 260, borderLeft: '1px solid var(--admin-border)', background: 'var(--admin-surface)', padding: 16, overflowY: 'auto', flexShrink: 0 }}>
                  <h4 style={{ font: '600 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Customer Info</h4>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ font: '500 13px var(--admin-font-ui)', color: 'var(--admin-text)' }}>{selectedConv.user_name}</div>
                    <div style={{ font: '400 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>{selectedConv.user_email}</div>
                  </div>
                  <h4 style={{ font: '600 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Recent Orders</h4>
                  {customerOrders.length === 0 ? (
                    <p style={{ font: '400 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>No orders found</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {customerOrders.map(order => (
                        <div key={order.id} style={{ padding: '8px 10px', borderRadius: 8, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ font: '500 11px var(--admin-font-mono)', color: 'var(--admin-text)' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                            <span style={{ font: '500 11px var(--admin-font-mono)', color: 'var(--admin-accent)' }}>Rs. {order.total_amount?.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                            <span style={{ font: '400 10px var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>{npShortDate(order.created_at)}</span>
                            <span style={{ font: '500 10px var(--admin-font-ui)', color: order.order_status === 'delivered' ? 'var(--admin-green)' : order.order_status === 'cancelled' ? 'var(--admin-red)' : 'var(--admin-yellow)', textTransform: 'capitalize' }}>{order.order_status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reply Area */}
            <div style={{ padding: 12, borderTop: '1px solid var(--admin-border)', background: 'var(--admin-surface)' }}>
              {/* Quick Replies */}
              {showQuickReplies && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {QUICK_REPLIES.map(qr => (
                    <button key={qr.label} className="btn-admin-ghost" style={{ fontSize: 11, padding: '4px 10px', borderRadius: 16 }} onClick={() => { setInput(qr.text); setShowQuickReplies(false) }}>
                      {qr.label}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn-admin-ghost" style={{ padding: 6, width: 32, height: 32, flexShrink: 0 }} onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Attach photo/video">
                  <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                <button className="btn-admin-ghost" style={{ padding: 6, width: 32, height: 32, flexShrink: 0 }} onClick={() => setShowQuickReplies(!showQuickReplies)} title="Quick replies">
                  <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                </button>
                <input
                  className="admin-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(input) } }}
                  placeholder={`Reply to ${selectedConv.user_name}...`}
                  style={{ flex: 1 }}
                />
                <button className="btn-admin-primary" style={{ padding: 6, width: 32, height: 32, flexShrink: 0 }} onClick={() => sendReply(input)} disabled={sending || !input.trim()}>
                  <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" /></svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
