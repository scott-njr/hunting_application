import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  // Verify auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error('[profile-pic] SUPABASE_SERVICE_ROLE_KEY is not set')
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

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
  )

  // Upload to storage
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${user.id}/profile_pic.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadErr } = await admin.storage
    .from('user_profile_pics')
    .upload(path, buffer, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadErr) {
    console.error('[profile-pic] upload error:', uploadErr)
    return NextResponse.json({ error: uploadErr.message }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage
    .from('user_profile_pics')
    .getPublicUrl(path)

  const avatar_url = `${publicUrl}?t=${Date.now()}`

  // Save to DB
  const { data: existing } = await admin
    .from('hunter_profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await admin
      .from('hunter_profiles')
      .update({ avatar_url })
      .eq('id', user.id)

    if (error) {
      console.error('[profile-pic] update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await admin
      .from('hunter_profiles')
      .insert({ id: user.id, avatar_url })

    if (error) {
      console.error('[profile-pic] insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ avatar_url })
}
