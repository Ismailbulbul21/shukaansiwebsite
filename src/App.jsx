import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './components/auth/AuthPage'
import ProfileCreation from './components/profile/ProfileCreation'
import DiscoveryPage from './components/discovery/DiscoveryPage'
import NotificationPage from './components/notifications/NotificationPage'
import ChatPage from './components/chat/ChatPage'

function MainApp() {
  const [currentView, setCurrentView] = useState('discovery') // 'discovery', 'notifications', or 'chat'

  const showDiscovery = () => setCurrentView('discovery')
  const showNotifications = () => setCurrentView('notifications')
  const showChat = () => setCurrentView('chat')

  if (currentView === 'notifications') {
    return <NotificationPage onBackToDiscovery={showDiscovery} onShowChat={showChat} />
  }

  if (currentView === 'chat') {
    return <ChatPage onBackToDiscovery={showDiscovery} />
  }

  return <DiscoveryPage onShowNotifications={showNotifications} onShowChat={showChat} />
}

function AppContent() {
  const { user, profile, loading } = useAuth()

  // Minimal debug logging  
  if (loading) {
    console.log('🔄 App state:', { 
    user: user?.email || 'none', 
    profile: profile?.first_name || 'none', 
    profileComplete: profile?.is_profile_complete,
    loading 
  })
  }

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Kulanhub...</p>
          </div>
        </div>
      </div>
    )
  }

  // If not authenticated, show auth page
  if (!user) {
    return <AuthPage />
  }

  // If authenticated but no profile or profile incomplete, show profile creation
  if (!profile || !profile.is_profile_complete) {
    // If user exists but no profile yet, and we're not in a loading state, show profile creation
    if (user && !loading) {
      console.log('🔄 Showing profile creation for user:', user.email, '- Profile:', profile)
      return <ProfileCreation />
    } else {
      // Still loading profile data, show loading spinner
      console.log('🔄 Still loading profile data... User:', !!user, 'Loading:', loading)
      return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your profile...</p>
            </div>
          </div>
        </div>
      )
    }
  }

  // If we reach here, user is authenticated and profile is complete
  console.log('🎯 Showing MainApp - Profile complete:', profile.first_name)

  // If authenticated and profile complete, show main app
  return <MainApp />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
