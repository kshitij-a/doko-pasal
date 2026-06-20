import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../../lib/admin-api'
import { verifyAdminAccess } from '../../../../lib/admin-api'

export async function POST(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Admin upload requires SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 })
  }

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
