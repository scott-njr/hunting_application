import { Navbar } from '@/components/layout/navbar'
import ProfilePage from '@/components/profile/profile-page'

export default function AccountProfilePage() {
  return (
    <div className="min-h-screen bg-base text-primary">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <ProfilePage />
      </div>
    </div>
  )
}
