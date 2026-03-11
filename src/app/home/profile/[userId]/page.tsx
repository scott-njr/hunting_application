import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ImageIcon } from 'lucide-react'

export default async function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // If viewing own profile, redirect to the editable version
  if (user.id === userId) redirect('/home/profile')

  const { data: profile } = await supabase
    .from('user_profile')
    .select('display_name, avatar_url, photo_urls, state, city, social_facebook, social_instagram, social_x')
    .eq('id', userId)
    .maybeSingle()

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-muted text-sm">This profile doesn&apos;t exist or hasn&apos;t been set up yet.</p>
      </div>
    )
  }

  const photos: string[] = profile.photo_urls ?? []
  const hasSocials = profile.social_facebook || profile.social_instagram || profile.social_x

  return (
    <div>
      <div className="glass-card border border-subtle rounded-lg p-5">
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-subtle" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-elevated flex items-center justify-center text-lg font-bold text-primary border-2 border-subtle">
              {profile.display_name ? profile.display_name.slice(0, 2).toUpperCase() : '??'}
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-primary">{profile.display_name ?? 'Member'}</h1>
            {(profile.city || profile.state) && (
              <span className="text-secondary text-sm">
                {[profile.city, profile.state].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Social links */}
        {hasSocials && (
          <div className="flex gap-3 mb-4 flex-wrap">
            {profile.social_facebook && (
              <a href={profile.social_facebook.startsWith('http') ? profile.social_facebook : `https://facebook.com/${profile.social_facebook}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:text-secondary transition-colors">
                Facebook
              </a>
            )}
            {profile.social_instagram && (
              <a href={profile.social_instagram.startsWith('http') ? profile.social_instagram : `https://instagram.com/${profile.social_instagram}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:text-secondary transition-colors">
                Instagram
              </a>
            )}
            {profile.social_x && (
              <a href={profile.social_x.startsWith('http') ? profile.social_x : `https://x.com/${profile.social_x}`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted hover:text-secondary transition-colors">
                X
              </a>
            )}
          </div>
        )}

        {/* Photo gallery */}
        {photos.length > 0 ? (
          <div>
            <h2 className="text-secondary text-xs font-medium uppercase tracking-wider mb-2">Photos</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {photos.map((url, i) => (
                <div key={i} className="aspect-square rounded overflow-hidden border border-subtle">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted text-xs">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>No photos shared</span>
          </div>
        )}
      </div>
    </div>
  )
}
