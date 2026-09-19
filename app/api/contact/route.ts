import { NextResponse } from 'next/server'

function escapeHtml(str: unknown) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    const message = typeof body.message === 'string' ? body.message.trim() : ''

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    if (!message) return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    if (message.length > 1000) return NextResponse.json({ error: 'Message must be under 1000 characters' }, { status: 400 })

    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    const to = process.env.CONTACT_EMAIL || 'dokopasal@gmail.com'
    const senderEmail = process.env.RESEND_SENDER_EMAIL || 'Doko Pasal <onboarding@resend.dev>'

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [to],
        reply_to: email,
        subject: `Contact form — ${name}`,
        html: `<p><strong>From:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
      }),
    })

    const result = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: result.message || 'Email failed' }, { status: 400 })
    }
    return NextResponse.json({ success: true, id: result.id })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
