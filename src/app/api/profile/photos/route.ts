import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const MAX_PHOTOS = 6

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error('[profile-photos] SUPABASE_SERVICE_ROLE_KEY is not set')
    return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Image file required' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 })
  }

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  // Get current photos
  const { data: profile } = await admin
    .from('hunter_profiles')
    .select('photo_urls')
    .eq('id', user.id)
    .maybeSingle()

  const currentPhotos: string[] = profile?.photo_urls ?? []
  if (currentPhotos.length >= MAX_PHOTOS) {
    return NextResponse.json({ error: `Maximum ${MAX_PHOTOS} photos allowed` }, { status: 400 })
  }

  // Upload to storage
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${user.id}/gallery_${Date.now()}.${ext}`
  const buffer = new Uint8Array(await file.arrayBuffer())

  const { error: uploadErr } = await admin.storage
    .from('user_profile_pics')
    .upload(filename, buffer, { upsert: false, contentType: file.type })

  if (uploadErr) {
    console.error('[profile-photos] upload error:', uploadErr)
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage
    .from('user_profile_pics')
    .getPublicUrl(filename)

  const url = `${publicUrl}?t=${Date.now()}`
  const updatedPhotos = [...currentPhotos, url]

  const { error: dbErr } = await admin
    .from('hunter_profiles')
    .update({ photo_urls: updatedPhotos })
    .eq('id', user.id)

  if (dbErr) {
    console.error('[profile-photos] db error:', dbErr)
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  return NextResponse.json({ photo_urls: updatedPhotos })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

  const { url: photoUrl } = await request.json()
  if (!photoUrl) return NextResponse.json({ error: 'URL required' }, { status: 400 })

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  const { data: profile } = await admin
    .from('hunter_profiles')
    .select('photo_urls')
    .eq('id', user.id)
    .maybeSingle()

  const currentPhotos: string[] = profile?.photo_urls ?? []
  const updatedPhotos = currentPhotos.filter(u => u !== photoUrl)

  // Remove from storage — extract path from URL
  const baseUrl = admin.storage.from('user_profile_pics').getPublicUrl('').data.publicUrl
  const storagePath = photoUrl.split('?')[0].replace(baseUrl, '')
  if (storagePath) {
    await admin.storage.from('user_profile_pics').remove([storagePath])
  }

  const { error: dbErr } = await admin
    .from('hunter_profiles')
    .update({ photo_urls: updatedPhotos })
    .eq('id', user.id)

  if (dbErr) {
    console.error('[profile-photos] delete db error:', dbErr)
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  return NextResponse.json({ photo_urls: updatedPhotos })
}
