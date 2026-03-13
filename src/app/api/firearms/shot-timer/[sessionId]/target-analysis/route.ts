import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { aiVisionCall } from '@/lib/ai/client'
import { apiOk, unauthorized, notFound, badRequest, serverError, withHandler } from '@/lib/api-response'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/** POST /api/firearms/shot-timer/[sessionId]/target-analysis — Upload target photo + AI analysis */
export const POST = withHandler(async (req: Request, { params }: RouteParams) => {
  const { sessionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error('[target-analysis] SUPABASE_SERVICE_ROLE_KEY is not set')
    return serverError('Server config error')
  }

  // Verify session belongs to user and fetch scoring data
  const { data: session } = await supabase
    .from('firearms_shot_session')
    .select('id, course_name, alpha, bravo, charlie, delta, miss, points, hit_factor, status, total_strings, shots_per_string')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) return notFound('Session not found')

  // Parse FormData
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file || !file.type.startsWith('image/')) {
    return badRequest('Image file required')
  }

  if (file.size > 5 * 1024 * 1024) {
    return badRequest('Image must be under 5MB')
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const
  type ImageMediaType = typeof validTypes[number]
  if (!validTypes.includes(file.type as ImageMediaType)) {
    return badRequest('Supported formats: JPEG, PNG, GIF, WebP')
  }

  // Verify file is actually an image by checking magic bytes (don't trust MIME type alone)
  const headerBuffer = await file.slice(0, 12).arrayBuffer()
  const header = new Uint8Array(headerBuffer)
  const isValidImage =
    (header[0] === 0xFF && header[1] === 0xD8) ||                           // JPEG
    (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E) ||     // PNG
    (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) ||     // GIF
    (header[0] === 0x52 && header[1] === 0x49 && header[8] === 0x57)        // WebP (RIFF...WEBP)

  if (!isValidImage) {
    return badRequest('File does not appear to be a valid image')
  }

  // Fetch dominant hand from firearms_profile
  const { data: profile } = await supabase
    .from('firearms_profile')
    .select('dominant_hand')
    .eq('id', user.id)
    .maybeSingle()

  const dominantHand = profile?.dominant_hand ?? 'right'

  // Upload to Supabase storage
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
  )

  const ext = file.name.split('.').pop() ?? 'jpg'
  const storagePath = `${user.id}/${sessionId}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const { error: uploadErr } = await admin.storage
    .from('firearms-targets')
    .upload(storagePath, buffer, {
      upsert: true,
      contentType: file.type,
    })

  if (uploadErr) {
    console.error('[target-analysis] upload error:', uploadErr)
    return serverError('Failed to upload image')
  }

  const { data: { publicUrl } } = admin.storage
    .from('firearms-targets')
    .getPublicUrl(storagePath)

  const photoUrl = `${publicUrl}?t=${Date.now()}`

  // Convert to base64 for AI vision call
  const imageBase64 = Buffer.from(arrayBuffer).toString('base64')

  // Build context with scoring data
  const scoringContext = [
    `Shooter is ${dominantHand}-handed.`,
    session.course_name ? `Course: ${session.course_name}` : null,
    `Scoring: Alpha=${session.alpha}, Bravo=${session.bravo}, Charlie=${session.charlie}, Delta=${session.delta}, Miss=${session.miss}`,
    `Total Points: ${session.points}`,
    session.hit_factor ? `Hit Factor: ${session.hit_factor}` : null,
    session.total_strings ? `Strings: ${session.total_strings}` : null,
    session.shots_per_string ? `Shots per string: ${session.shots_per_string}` : null,
    session.status === 'dq' ? 'Shooter was disqualified.' : null,
    session.status === 'dnf' ? 'Shooter did not finish.' : null,
  ].filter(Boolean).join('\n')

  const userMessage = `Analyze this shooting target photo. The shooter is ${dominantHand}-handed.\n\nScoring data:\n${scoringContext}`

  // Call AI with vision
  const aiResult = await aiVisionCall({
    module: 'firearms',
    feature: 'firearms_target_analysis',
    userMessage,
    imageBase64,
    imageMediaType: file.type as ImageMediaType,
    userId: user.id,
    maxTokens: 2048,
  })

  if (!aiResult.success) {
    // Still save the photo even if AI fails
    await admin
      .from('firearms_shot_session')
      .update({ target_photo_url: photoUrl })
      .eq('id', sessionId)

    return serverError(aiResult.error ?? 'AI analysis failed')
  }

  // Save photo URL + analysis to session
  const analysisData = {
    text: aiResult.response,
    generated_at: new Date().toISOString(),
    dominant_hand: dominantHand,
  }

  const { error: updateErr } = await admin
    .from('firearms_shot_session')
    .update({
      target_photo_url: photoUrl,
      target_analysis: analysisData,
    })
    .eq('id', sessionId)

  if (updateErr) {
    console.error('[target-analysis] update error:', updateErr)
    return serverError('Failed to save analysis')
  }

  return apiOk({ analysis: { text: aiResult.response, photo_url: photoUrl } })
})
