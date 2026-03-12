import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { apiOk, unauthorized, badRequest, serverError, withHandler } from '@/lib/api-response'

const MAX_PHOTOS = 6

export const POST = withHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error('[profile-photos] SUPABASE_SERVICE_ROLE_KEY is not set')
    return serverError('Server config error')
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file || !file.type.startsWith('image/')) {
    return badRequest('Image file required')
  }
  if (file.size > 5 * 1024 * 1024) {
    return badRequest('Image must be under 5MB')
  }

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  // Get current photos
  const { data: profile } = await admin
    .from('user_profile')
    .select('photo_urls')
    .eq('id', user.id)
    .maybeSingle()

  const currentPhotos: string[] = profile?.photo_urls ?? []
  if (currentPhotos.length >= MAX_PHOTOS) {
    return badRequest(`Maximum ${MAX_PHOTOS} photos allowed`)
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
    return serverError()
  }

  const { data: { publicUrl } } = admin.storage
    .from('user_profile_pics')
    .getPublicUrl(filename)

  const url = `${publicUrl}?t=${Date.now()}`
  const updatedPhotos = [...currentPhotos, url]

  const { error: dbErr } = await admin
    .from('user_profile')
    .update({ photo_urls: updatedPhotos })
    .eq('id', user.id)

  if (dbErr) {
    console.error('[profile-photos] db error:', dbErr)
    return serverError()
  }

  return apiOk({ photo_urls: updatedPhotos })
})


export const DELETE = withHandler(async (request: Request) => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return serverError('Server config error')

  const { url: photoUrl } = await request.json()
  if (!photoUrl) return badRequest('URL required')

  const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey)

  const { data: profile } = await admin
    .from('user_profile')
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
    .from('user_profile')
    .update({ photo_urls: updatedPhotos })
    .eq('id', user.id)

  if (dbErr) {
    console.error('[profile-photos] delete db error:', dbErr)
    return serverError()
  }

  return apiOk({ photo_urls: updatedPhotos })
})

