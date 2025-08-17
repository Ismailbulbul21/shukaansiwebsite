import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

// Profile Modal Component
function ProfileModal({ hello, onClose, onAccept, onIgnore }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  
  const profile = hello.sender_profile
  const photos = profile?.photo_urls || []
  const currentPhoto = photos[currentPhotoIndex] || 'https://via.placeholder.com/400x600?text=No+Photo'

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const handleAccept = async () => {
    setLoading(true)
    await onAccept(hello.id, hello.sender_id)
    setLoading(false)
    onClose()
  }

  const handleIgnore = async () => {
    setLoading(true)
    await onIgnore(hello.id)
    setLoading(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full max-h-[90vh] overflow-hidden">
        {/* Close Button */}
        <div className="flex justify-end p-2">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Photo Section */}
        <div className="relative h-96 bg-gray-200 -mt-2">
          <img
            src={currentPhoto}
            alt={`${profile?.first_name}'s photo`}
            className="w-full h-full object-cover"
          />
          
          {/* Photo indicators */}
          {photos.length > 1 && (
            <div className="absolute top-2 left-2 right-2 flex space-x-1">
              {photos.map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-1 rounded-full ${
                    index === currentPhotoIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Photo navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-0 top-0 w-1/2 h-full z-10"
              />
              <button
                onClick={nextPhoto}
                className="absolute right-0 top-0 w-1/2 h-full z-10"
              />
            </>
          )}
        </div>

        {/* Profile Info */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-2xl font-bold text-gray-800">
              {profile?.first_name}
            </h3>
            <span className="text-xl text-gray-600">{profile?.age}</span>
          </div>
          
          <div className="space-y-1 text-sm text-gray-600 mb-4">
            <p>📍 {profile?.location_value}</p>
            {(profile?.clan_family?.name || profile?.subclan?.name) && (
              <p>🏛️ {profile.clan_family?.name}{profile.subclan?.name ? ` - ${profile.subclan.name}` : ''}</p>
            )}
            {profile?.bio && (
              <p className="text-gray-700 mt-2">{profile.bio}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleIgnore}
              disabled={loading}
              className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? '⏳' : 'Ignore ❌'}
            </button>
            <button
              onClick={handleAccept}
              disabled={loading}
              className="flex-1 bg-pink-500 text-white py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? '⏳' : 'Accept ✅'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function NotificationPage({ onBackToDiscovery }) {
  const { user, profile } = useAuth()
  const [hellos, setHellos] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedHello, setSelectedHello] = useState(null)
  const [error, setError] = useState('')

  // Fetch received hellos
  const fetchHellos = async () => {
    if (!profile) {
      console.log('Profile not loaded yet, skipping hello fetch')
      return
    }
    
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('hellos')
        .select(`
          *,
          sender_profile:user_profiles!sender_id(
            *,
            clan_family:clan_families(name),
            subclan:subclans(name)
          )
        `)
        .eq('receiver_id', profile.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      setHellos(data || [])
    } catch (error) {
      console.error('Error fetching hellos:', error)
      setError('Failed to load notifications. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) {
      fetchHellos()
    }
  }, [profile])

  // Accept a hello (create a match)
  const handleAccept = async (helloId, senderId) => {
    try {
      // Update hello status to accepted
      console.log('Accepting hello:', helloId, 'from sender:', senderId)
      const { error: updateError } = await supabase
        .from('hellos')
        .update({ 
          status: 'accepted',
          responded_at: new Date().toISOString()
        })
        .eq('id', helloId)

      if (updateError) throw updateError
      
      console.log('✅ Hello accepted successfully!')

      // Check if the sender also sent us a hello (mutual match)
      const { data: mutualHellos, error: checkError } = await supabase
        .from('hellos')
        .select('*')
        .eq('sender_id', profile.id)
        .eq('receiver_id', senderId)
        .eq('status', 'accepted')

      const mutualHello = mutualHellos && mutualHellos.length > 0 ? mutualHellos[0] : null

      if (checkError) {
        console.error('Error checking mutual hello:', checkError)
      } else {
        console.log('Mutual hello check result:', mutualHellos ? mutualHellos.length : 0, 'hellos found')
      }

      // If mutual match, create a match record
      if (mutualHello) {
        console.log('🎉 Mutual match detected! Creating match record...')
        const { error: matchError } = await supabase
          .from('matches')
          .insert({
            user1_id: profile.id,
            user2_id: senderId,
            created_at: new Date().toISOString()
          })

        if (matchError) {
          console.error('Error creating match:', matchError)
        } else {
          console.log('🎉 Match created successfully!')
        }
      } else {
        console.log('No mutual match yet - waiting for them to send hello back')
      }

      // Show success message  
      alert('✅ Hello accepted! They will be notified.')
      
      // Refresh hellos list
      fetchHellos()
    } catch (error) {
      console.error('Error accepting hello:', error)
    }
  }

  // Ignore a hello
  const handleIgnore = async (helloId) => {
    try {
      const { error } = await supabase
        .from('hellos')
        .update({ status: 'ignored' })
        .eq('id', helloId)

      if (error) throw error

      // Refresh hellos list
      fetchHellos()
    } catch (error) {
      console.error('Error ignoring hello:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your hellos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex justify-between items-center">
        <button
          onClick={onBackToDiscovery}
          className="text-pink-500 hover:text-pink-600 font-medium"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          Notifications 💕
        </h1>
        <div className="w-12"></div> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-center">{error}</p>
            <button
              onClick={fetchHellos}
              className="mt-2 w-full bg-red-500 text-white py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {hellos.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 px-2">
              You have {hellos.length} hello{hellos.length > 1 ? 's' : ''}! 👋
            </h2>
            
            {hellos.map((hello) => (
              <div
                key={hello.id}
                onClick={() => setSelectedHello(hello)}
                className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  {/* Profile Photo */}
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src={hello.sender_profile?.photo_urls?.[0] || 'https://via.placeholder.com/64x64?text=?'}
                      alt={`${hello.sender_profile?.first_name}'s photo`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Profile Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {hello.sender_profile?.first_name}, {hello.sender_profile?.age}
                    </h3>
                    <p className="text-sm text-gray-600">
                      📍 {hello.sender_profile?.location_value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(hello.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="text-gray-400">
                    →
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center mt-16">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                No new hellos yet 📭
              </h2>
              <p className="text-gray-600 mb-6">
                When someone says "Heelo" to you, you'll see their profile here to accept or ignore.
              </p>
              <button
                onClick={onBackToDiscovery}
                className="bg-pink-500 text-white px-6 py-3 rounded-lg font-medium"
              >
                Back to Discovery
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      {selectedHello && (
        <ProfileModal
          hello={selectedHello}
          onClose={() => setSelectedHello(null)}
          onAccept={handleAccept}
          onIgnore={handleIgnore}
        />
      )}
    </div>
  )
}