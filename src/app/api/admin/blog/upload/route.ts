import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { verifyAdmin } from '@/lib/admin-utils'
import { apiOk, forbidden, badRequest, serverError } from '@/lib/api-response'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  const adminUser = await verifyAdmin()
  if (!adminUser) return forbidden()

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return badRequest('No file provided')
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return badRequest('Only JPEG, PNG, WebP, and GIF images are allowed')
  }

  if (file.size > MAX_SIZE) {
    return badRequest('Image must be under 5MB')
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await admin.storage
    .from('blog-images')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    return serverError('Failed to upload image')
  }

  const { data: urlData } = admin.storage
    .from('blog-images')
    .getPublicUrl(fileName)

  return apiOk({ url: urlData.publicUrl })
}
