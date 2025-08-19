import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

// Profile Card Component
function ProfileCard({ profile, onSwipe, isActive, cardIndex }) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)

  // Debug modal state
  useEffect(() => {
    console.log('🔄 Modal state changed:', showImageModal)
  }, [showImageModal])
  const cardRef = useRef(null)

  const photos = profile.photo_urls || []
  const currentPhoto = photos[currentPhotoIndex] || 'https://via.placeholder.com/400x600?text=No+Photo'

  // Touch handlers for mobile swiping
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e) => {
    if (!touchStart) return
    const currentTouch = e.targetTouches[0].clientX
    const drag = currentTouch - touchStart
    setDragX(drag)
    setTouchEnd(currentTouch)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50
    
    // Only trigger swipe if there's significant movement
    if (Math.abs(distance) > 50) {
      if (isLeftSwipe) {
        onSwipe('cancel')
      } else if (isRightSwipe) {
        onSwipe('heelo')
      }
    }
    
    // Reset
    setTouchStart(null)
    setTouchEnd(null)
    setDragX(0)
    setIsDragging(false)
  }

  // Photo navigation
  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  // Calculate transform for swipe animation
  const getCardTransform = () => {
    if (!isActive) return 'scale(0.95) translateY(10px)'
    if (isDragging) {
      const rotation = dragX * 0.1
      return `translateX(${dragX}px) rotate(${rotation}deg)`
    }
    return 'translateX(0px) rotate(0deg)'
  }

  const getCardOpacity = () => {
    if (!isActive) return 0.7
    if (isDragging) {
      return Math.max(0.5, 1 - Math.abs(dragX) / 300)
    }
    return 1
  }

  return (
    <div
      ref={cardRef}
      className={`absolute w-full max-w-sm lg:max-w-md xl:max-w-lg mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 h-[550px] sm:h-[570px] lg:h-[520px] xl:h-[540px] ${
        isActive ? 'z-10' : 'z-0'
      }`}
      style={{
        transform: getCardTransform(),
        opacity: getCardOpacity(),
        top: `${cardIndex * 8}px`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo Section - Responsive height for all devices */}
      <div 
        className="relative h-[420px] sm:h-[435px] lg:h-[390px] xl:h-[405px] bg-gray-200 cursor-pointer"
        onClick={(e) => {
          // Only open modal if clicking directly on the section (not on navigation elements)
          if (e.target === e.currentTarget || e.target.tagName === 'IMG') {
            console.log('🖼️ Photo section clicked! Opening modal...')
            setShowImageModal(true)
          }
        }}
      >
        <img
          src={currentPhoto}
          alt={`${profile.first_name}'s photo`}
          className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity duration-200"
          onClick={(e) => {
            e.stopPropagation() // Ensure click event is handled
            console.log('🖼️ Image clicked! Opening modal...')
            setShowImageModal(true)
          }}
        />
        
        {/* Click to view full size indicator */}
        <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
          <span>Tap to view</span>
        </div>
        
        {/* Photo indicators */}
        {photos.length > 1 && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {photos.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation() // Prevent image click when using indicators
                  e.preventDefault() // Prevent any default behavior
                  setCurrentPhotoIndex(index)
                }}
                className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                  index === currentPhotoIndex 
                    ? 'bg-white shadow-lg scale-110' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to photo ${index + 1}`}
              />
            ))}
          </div>
        )}



        {/* Photo Navigation Buttons - Visible on all devices */}
        {photos.length > 1 && (
          <>
            {/* Left Arrow Button */}
            <button
              onClick={prevPhoto}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200 hover:scale-110 z-20"
              aria-label="Previous photo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Right Arrow Button */}
            <button
              onClick={nextPhoto}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200 hover:scale-110 z-20"
              aria-label="Next photo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Swipe indication overlays */}
        {isDragging && (
          <>
            {dragX > 50 && (
              <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                  HEELO 👋
                </div>
              </div>
            )}
            {dragX < -50 && (
              <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                  CANCEL ❌
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Profile Info - Clean & Modern Design */}
      <div className="bg-white p-4 h-[130px] sm:h-[135px] lg:h-[130px] xl:h-[135px] flex flex-col justify-center shadow-sm border-t border-gray-100">
        {/* New Mobile-First Info Layout - Compact */}
        <div className="space-y-1.5">
          {/* Name - Compact Display */}
          <div className="flex items-center">
            <span className="text-xs font-semibold text-gray-500 mr-1.5 min-w-[35px]">Name:</span>
            <span className="text-xs font-bold text-gray-900 truncate">
              {profile.first_name}
            </span>
          </div>
          
          {/* Age - Compact Display */}
          <div className="flex items-center">
            <span className="text-xs font-semibold text-gray-500 mr-1.5 min-w-[35px]">Age:</span>
            <span className="text-xs font-bold text-gray-900">
              {profile.age}
            </span>
          </div>
          
          {/* Location - Compact Display */}
          <div className="flex items-center">
            <span className="text-xs font-semibold text-gray-500 mr-1.5 min-w-[35px]">📍</span>
            <span className="text-xs font-bold text-gray-900 truncate">
              {profile.location_value}
            </span>
          </div>
          
          {/* Qabiil/Clan - Compact Display */}
          {(profile.clan_name || profile.subclan_name) && (
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-500 mr-1.5 min-w-[35px]">Qabiil:</span>
              <span className="text-xs font-bold text-gray-900 truncate">
                {profile.clan_name}
                {profile.subclan_name && (
                  <span className="text-gray-600 ml-1 font-medium">
                    • {profile.subclan_name}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
        
        {/* Bio - Clean & Readable */}
        {profile.bio && (
          <div className="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 italic leading-relaxed line-clamp-2">
              "{profile.bio}"
            </p>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[9999] p-4">
          <div className="relative max-w-4xl w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-colors"
            >
              ✕
            </button>
            
            {/* Full-size image */}
            <img
              src={currentPhoto}
              alt={`${profile.first_name}'s photo ${currentPhotoIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              style={{ maxHeight: '90vh' }}
            />
            
            {/* Photo navigation for modal */}
            {photos.length > 1 && (
              <>
                {/* Left navigation button */}
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white rounded-full p-3 hover:bg-opacity-80 transition-colors hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Right navigation button */}
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white rounded-full p-3 hover:bg-opacity-80 transition-colors hover:scale-110"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Photo indicators */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
                  {photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                        index === currentPhotoIndex 
                          ? 'bg-white shadow-lg scale-110' 
                          : 'bg-white/60 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Photo counter */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded-full">
                  {currentPhotoIndex + 1} of {photos.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DiscoveryPage({ onShowNotifications, onShowChat }) {
  const { user, profile, signOut } = useAuth()
  
  // Handle sign out with error handling
  const handleSignOut = async () => {
    try {
      console.log('🔄 User requested sign out...')
      const { error } = await signOut()
      if (error) {
        console.error('❌ Sign out error:', error)
        // Even if there's an error, user should be signed out locally
      }
    } catch (err) {
      console.error('💥 Unexpected error during sign out:', err)
      // Continue with sign out process
    }
  }
  const [profiles, setProfiles] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')
  const [notificationCount, setNotificationCount] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [filters, setFilters] = useState({
    minAge: 18,
    maxAge: 60,
    clanFamily: '',
    subclan: '',
    locationType: '',
    locationValue: ''
  })
  
  // Filter options data
  const [clanFamilies, setClanFamilies] = useState([])
  const [subclans, setSubclans] = useState([])
  const [filteredSubclans, setFilteredSubclans] = useState([])

  // Fetch discovery profiles using the smart filtering function
  const fetchProfiles = async (offset = 0) => {
    if (!profile) {
      console.log('Profile not loaded yet, skipping profile fetch')
      return
    }
    
    try {
      setLoading(true)
      setError('')

      console.log('🔍 Fetching discovery profiles for user:', profile.id)
      
      // Use the database function with filter parameters
      const filterParams = {
        current_user_id: profile.id,
        limit_count: 10
      }
      
      // Add filters if they're set
      if (filters.clanFamily) filterParams.clan_filter = filters.clanFamily
      if (filters.subclan) filterParams.subclan_filter = filters.subclan
      if (filters.locationType) filterParams.location_type_filter = filters.locationType
      if (filters.locationValue) filterParams.location_value_filter = filters.locationValue
      if (filters.minAge > 18) filterParams.min_age = filters.minAge
      if (filters.maxAge < 60) filterParams.max_age = filters.maxAge
      
      console.log('🔍 Fetching with filters:', filterParams)
      
      const { data, error } = await supabase.rpc('get_discovery_profiles', filterParams)

      if (error) {
        console.error('❌ Discovery function error:', error)
        throw error
      }

      console.log('📋 Discovery profiles fetched:', data?.length || 0)
      
      if (offset === 0) {
        setProfiles(data || [])
      } else {
        setProfiles(prev => [...prev, ...(data || [])])
      }

      setHasMore(data && data.length === 10)
    } catch (error) {
      console.error('Error fetching profiles:', error)
      setError('Failed to load profiles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch notification count
  const fetchNotificationCount = async () => {
    if (!profile) {
      console.log('Profile not loaded yet, skipping notification count')
      return
    }
    
    try {
      const { count, error } = await supabase
        .from('hellos')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', profile.id)
        .eq('status', 'pending')

      if (error) throw error
      setNotificationCount(count || 0)
    } catch (error) {
      console.error('Error fetching notification count:', error)
    }
  }

  // Load filter options on component mount
  useEffect(() => {
    loadFilterOptions()
  }, [])

  useEffect(() => {
    if (profile) {
      fetchProfiles()
    }
  }, [profile, filters]) // Re-fetch when filters change
  
  // Load clan families and subclans for filter dropdowns
  const loadFilterOptions = async () => {
    try {
      // Fetch clan families
      const { data: families, error: familyError } = await supabase
        .from('clan_families')
        .select('*')
        .order('name')
      
      if (familyError) throw familyError
      setClanFamilies(families || [])
      
      // Fetch all subclans
      const { data: subclansData, error: subclanError } = await supabase
        .from('subclans')
        .select('*')
        .order('name')
      
      if (subclanError) throw subclanError
      setSubclans(subclansData || [])
      setFilteredSubclans(subclansData || [])
    } catch (error) {
      console.error('Error loading filter options:', error)
    }
  }
  
  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    
    // Reset current index to start fresh
    setCurrentIndex(0)
    
    // If clan family changes, filter subclans
    if (key === 'clanFamily') {
      if (value) {
        const filtered = subclans.filter(sub => sub.clan_family_id === value)
        setFilteredSubclans(filtered)
      } else {
        setFilteredSubclans(subclans)
      }
      // Reset subclan selection
      setFilters(prev => ({ ...prev, subclan: '' }))
    }
  }
  
  // Reset all filters
  const resetFilters = () => {
    setFilters({
      minAge: 18,
      maxAge: 60,
      clanFamily: '',
      subclan: '',
      locationType: '',
      locationValue: ''
    })
    setFilteredSubclans(subclans)
    setCurrentIndex(0)
  }

  useEffect(() => {
    if (profile) {
      fetchNotificationCount()
      
      // Refresh notification count every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000)
      return () => clearInterval(interval)
    }
  }, [profile])

  // Handle swipe actions
  const handleSwipe = async (action) => {
    const currentProfile = profiles[currentIndex]
    if (!currentProfile) return

    try {
      if (action === 'heelo') {
        // Check if hello already exists to prevent 409 conflicts
        const { data: existingHello } = await supabase
          .from('hellos')
          .select('id')
          .eq('sender_id', profile.id)
          .eq('receiver_id', currentProfile.id)
          .single()

        if (existingHello) {
          console.log('Hello already sent to this user')
          // Still move to next profile even if hello was already sent
          setCurrentIndex(prev => prev + 1)
          if (currentIndex >= profiles.length - 3 && hasMore) {
            fetchProfiles(profiles.length)
          }
          return
        }

        // Send a "hello" to this user
        // Use profile IDs, not auth user IDs for RLS compatibility
        const { error } = await supabase
          .from('hellos')
          .insert({
            sender_id: profile.id,  // ← Fixed: Use profile ID
            receiver_id: currentProfile.id,  // ← Fixed: Use profile ID  
            status: 'pending'
          })

        if (error) {
          if (error.code === '23505') {
            console.log('Hello already sent to this user (duplicate)')
          } else {
            console.error('Error sending hello:', error)
          }
        } else {
          console.log('Hello sent successfully!')
          
          // Check if this creates a mutual match (they already sent us a hello)
          const { data: mutualHello } = await supabase
            .from('hellos')
            .select('id, status')
            .eq('sender_id', currentProfile.id)
            .eq('receiver_id', profile.id)
            .single()

          if (mutualHello) {
            console.log('🎉 Mutual interest detected! Creating match record...')
            
            // Check if match already exists to prevent duplicates
            const { data: existingMatch } = await supabase
              .from('matches')
              .select('id')
              .or(`and(user1_id.eq.${profile.id},user2_id.eq.${currentProfile.id}),and(user1_id.eq.${currentProfile.id},user2_id.eq.${profile.id})`)
              .limit(1)

            if (!existingMatch || existingMatch.length === 0) {
              // Ensure user1_id < user2_id constraint is respected
              // Use proper UUID comparison by converting to array and sorting
              const ids = [profile.id, currentProfile.id].sort()
              const user1_id = ids[0]
              const user2_id = ids[1]
              
              console.log('🔍 Creating match with user1_id:', user1_id, 'user2_id:', user2_id)
              
              const { error: matchError } = await supabase
                .from('matches')
                .insert({
                  user1_id: user1_id,
                  user2_id: user2_id,
                  created_at: new Date().toISOString()
                })

              if (matchError) {
                console.error('❌ Error creating match:', matchError)
                console.error('❌ Match error details:', matchError.message)
              } else {
                console.log('🎉 Match created successfully!')
                // Show match notification
                alert(`🎉 It's a match with ${currentProfile.first_name}!`)
              }
            } else {
              console.log('✅ Match already exists')
            }
          }
          
          // Refresh notification count for the receiver (if they're checking)
          fetchNotificationCount()
        }
      } else if (action === 'cancel') {
        // Track cancel action so this user doesn't appear again
        console.log('❌ Cancelling profile:', currentProfile.first_name)
        
        const { error } = await supabase
          .from('hellos')
          .insert({
            sender_id: profile.id,
            receiver_id: currentProfile.id,
            status: 'ignored'
          })

        if (error) {
          console.error('Error tracking cancel action:', error)
          // Don't throw error for cancel tracking failure
        } else {
          console.log('✅ Cancel action tracked successfully!')
        }
      }

      // Move to next profile
      setCurrentIndex(prev => prev + 1)

      // Load more profiles if running low
      if (currentIndex >= profiles.length - 3 && hasMore) {
        fetchProfiles(profiles.length)
      }
    } catch (error) {
      console.error('Error handling swipe:', error)
    }
  }

  // Button actions
  const cancelProfile = () => handleSwipe('cancel')
  const heeloProfile = () => handleSwipe('heelo')

  if (loading && profiles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Finding amazing people for you...</p>
          </div>
        </div>
      </div>
    )
  }

  const currentProfile = profiles[currentIndex]
  const hasProfiles = profiles.length > 0 && currentIndex < profiles.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Header - Optimized & Compact */}
      <div className="bg-white shadow-sm px-4 py-2 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Kulanhub 💕
        </h1>
        
        <div className="flex items-center space-x-2">
          {/* Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative p-2 rounded-full transition-colors ${
              showFilters 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-600 hover:text-purple-500'
            }`}
          >
            <span className="text-xl">🔍</span>
            {(filters.clanFamily || filters.subclan || filters.locationType || 
              filters.minAge > 18 || filters.maxAge < 60) && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                !
              </span>
            )}
          </button>

          {/* Chat Button */}
          <button
            onClick={onShowChat}
            className="p-2 text-gray-600 hover:text-pink-500 transition-colors"
          >
            <span className="text-xl">💬</span>
          </button>

          {/* Notifications Button */}
          <button
            onClick={onShowNotifications}
            className="relative p-2 text-gray-600 hover:text-pink-500 transition-colors"
          >
            <span className="text-xl">🔔</span>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
          
          <span className="text-sm text-gray-600 hidden sm:block">
            {profile?.first_name}
          </span>
          <button
            onClick={handleSignOut}
            className="text-gray-600 hover:text-gray-800 text-sm hidden sm:block"
          >
            Sign Out
          </button>
          
          {/* Mobile user button */}
          <button
            onClick={handleSignOut}
            className="sm:hidden w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-semibold hover:bg-pink-200 transition-colors"
            title="Sign Out"
          >
            {profile?.first_name?.charAt(0)?.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white shadow-lg border-t border-gray-200 p-3">
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
              <button
                onClick={resetFilters}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Reset All
              </button>
            </div>
            
            {/* Age Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Range: {filters.minAge} - {filters.maxAge}
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex flex-col items-center">
                  <input
                    type="range"
                    min="18"
                    max="60"
                    value={filters.minAge}
                    onChange={(e) => handleFilterChange('minAge', parseInt(e.target.value))}
                    className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 mt-1">Min</span>
                </div>
                <div className="flex flex-col items-center">
                  <input
                    type="range"
                    min="18"
                    max="60"
                    value={filters.maxAge}
                    onChange={(e) => handleFilterChange('maxAge', parseInt(e.target.value))}
                    className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 mt-1">Max</span>
                </div>
              </div>
            </div>

            {/* Clan Family */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clan Family
              </label>
              <select
                value={filters.clanFamily}
                onChange={(e) => handleFilterChange('clanFamily', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Any Clan Family</option>
                {clanFamilies.map(family => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subclan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subclan
              </label>
              <select
                value={filters.subclan}
                onChange={(e) => handleFilterChange('subclan', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={!filters.clanFamily}
              >
                <option value="">Any Subclan</option>
                {filteredSubclans.map(subclan => (
                  <option key={subclan.id} value={subclan.id}>
                    {subclan.name}
                  </option>
                ))}
              </select>
              {!filters.clanFamily && (
                <p className="text-xs text-gray-500 mt-1">Select a clan family first</p>
              )}
            </div>

            {/* Location Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={filters.locationType}
                onChange={(e) => handleFilterChange('locationType', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Any Location</option>
                <option value="somalia">Somalia</option>
                <option value="diaspora">Diaspora</option>
              </select>
            </div>

            {/* Apply Filters Button */}
            <button
              onClick={() => setShowFilters(false)}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Main Discovery Area - Optimized spacing */}
      <div className="flex-1 flex flex-col items-center justify-start p-3 sm:p-4 pt-1 sm:pt-2">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 max-w-sm w-full">
            <p className="text-red-600 text-center">{error}</p>
            <button
              onClick={() => fetchProfiles()}
              className="mt-2 w-full bg-red-500 text-white py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {hasProfiles ? (
          <>
            {/* Card Stack - Responsive height for all devices */}
            <div className="relative w-full max-w-sm lg:max-w-md xl:max-w-lg h-[550px] sm:h-[570px] lg:h-[520px] xl:h-[540px] mb-4 sm:mb-6">
              {/* Show current and next profile cards */}
              {[currentIndex, currentIndex + 1].map((index, cardIndex) => {
                const profile = profiles[index]
                if (!profile) return null
                
                return (
                  <ProfileCard
                    key={`${profile.id}-${index}`}
                    profile={profile}
                    onSwipe={cardIndex === 0 ? handleSwipe : null}
                    isActive={cardIndex === 0}
                    cardIndex={cardIndex}
                  />
                )
              })}
            </div>

            {/* Action Buttons - Enhanced & More Prominent */}
            <div className="flex justify-center space-x-6 sm:space-x-8 lg:space-x-10 px-4 py-3 sm:py-4">
              <button
                onClick={cancelProfile}
                className="w-16 h-16 sm:w-18 sm:h-18 lg:w-22 lg:h-22 xl:w-28 xl:h-28 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-red-300 hover:border-red-500 hover:bg-red-50 transition-all transform hover:scale-105 active:scale-95"
              >
                <span className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">❌</span>
              </button>
              
              <button
                onClick={heeloProfile}
                className="w-16 h-16 sm:w-18 sm:h-18 lg:w-22 lg:h-22 xl:w-28 xl:h-28 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full shadow-xl flex items-center justify-center border-2 border-pink-300 hover:border-pink-200 hover:from-pink-500 hover:to-rose-600 transition-all transform hover:scale-105 active:scale-95"
              >
                <span className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl text-white">👋</span>
              </button>
            </div>

            {/* Progress indicator */}
            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                {currentIndex + 1} of {profiles.length}
                {hasMore && ' (loading more...)'}
              </p>
            </div>
          </>
        ) : (
          <div className="text-center max-w-sm">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                🎉 You're all caught up!
              </h2>
              <p className="text-gray-600 mb-6">
                No more profiles to show right now. Check back later for new members!
              </p>
              <button
                onClick={() => {
                  setCurrentIndex(0)
                  fetchProfiles()
                }}
                className="bg-pink-500 text-white px-6 py-3 rounded-lg font-medium"
              >
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}