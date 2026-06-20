import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAccess } from '../../../../lib/admin-api'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and userId required' }, { status: 400 })
    }

    const filePath = `avatars/${userId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    const { error } = await supabaseAdmin.storage.from('profile-avatars').upload(filePath, file)
    if (error) throw error

    const { data: urlData } = supabaseAdmin.storage.from('profile-avatars').getPublicUrl(filePath)
    return NextResponse.json({ url: urlData.publicUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
