import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifyAdmin } from '@/lib/admin-utils'
import { apiOk, forbidden, badRequest, serverError, withHandler } from '@/lib/api-response'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const BUCKET = 'broadcast-images'

export const POST = withHandler(async (request: Request) => {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return badRequest('No file provided')
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return badRequest('Invalid file type. Allowed: jpg, png, gif, webp')
    }

    if (file.size > MAX_FILE_SIZE) {
      return badRequest('File too large. Max 5MB.')
    }

    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate unique filename
    const ext = file.name.split('.').pop() ?? 'jpg'
    const timestamp = Date.now()
    const filePath = `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('[Broadcast Upload]', uploadError)
      return serverError('Upload failed')
    }

    const { data: { publicUrl } } = admin.storage
      .from(BUCKET)
      .getPublicUrl(filePath)

    return apiOk({ url: publicUrl })
  } catch (err) {
    console.error('[Broadcast Upload]', err)
    return serverError()
  }
})

