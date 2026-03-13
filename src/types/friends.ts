export type Friend = {
  friendship_id: string
  friend_id: string
  display_name: string | null
  email: string
  direction: 'sent' | 'received'
  status: 'pending' | 'accepted' | 'declined' | 'blocked'
  created_on: string
}

export type SearchResult = {
  user_id: string
  display_name: string | null
  user_name: string | null
  avatar_url: string | null
}
