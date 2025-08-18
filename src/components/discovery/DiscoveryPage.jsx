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
    
    if (isLeftSwipe) {
      onSwipe('cancel')
    } else if (isRightSwipe) {
      onSwipe('heelo')
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
      className={`absolute w-full max-w-sm lg:max-w-md xl:max-w-lg mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 h-[460px] sm:h-[480px] lg:h-[520px] xl:h-[560px] ${
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
      {/* Photo Section - 75% of card */}
      <div className="relative h-[345px] sm:h-[360px] lg:h-[390px] xl:h-[420px] bg-gray-200">
        <img
          src={currentPhoto}
          alt={`${profile.first_name}'s photo`}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => setShowImageModal(true)}
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

        {/* Photo navigation areas */}
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

      {/* Profile Info - Compact & Elegant (25% of card height) */}
      <div className="bg-white p-4 h-[115px] sm:h-[120px] lg:h-[130px] xl:h-[140px] flex flex-col justify-center">
        {/* Name and Age - Single Line */}
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
            {profile.first_name}
          </h3>
          <span className="text-sm sm:text-base lg:text-lg font-bold bg-pink-100 text-pink-700 px-2 py-1 rounded-full ml-2">
            {profile.age}
          </span>
        </div>
        
        {/* Location - Enhanced */}
        <div className="flex items-center text-gray-700 mb-1.5">
          <span className="text-blue-500 mr-2 text-base lg:text-lg">📍</span>
          <span className="text-sm sm:text-base lg:text-lg font-semibold truncate">{profile.location_value}</span>
        </div>
        
        {/* Clan Info - Enhanced */}
        {(profile.clan_name || profile.subclan_name) && (
          <div className="flex items-center text-gray-700 mb-1.5">
            <span className="text-purple-500 mr-2 text-base lg:text-lg">🏛️</span>
            <span className="text-sm sm:text-base lg:text-lg font-semibold truncate">
              {profile.clan_name}{profile.subclan_name ? ` - ${profile.subclan_name}` : ''}
            </span>
          </div>
        )}
        
        {/* Bio - Compact */}
        {profile.bio && (
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 italic line-clamp-1 mt-1">
            "{profile.bio}"
          </p>
        )}
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-sm lg:max-w-md xl:max-w-lg w-full">
            {/* Close button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-12 right-0 text-white text-2xl hover:text-gray-300 z-10"
            >
              ✕
            </button>
            
            {/* Full-size image */}
            <img
              src={currentPhoto}
              alt={`${profile.first_name}'s photo ${currentPhotoIndex + 1}`}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            
            {/* Photo navigation for modal */}
            {photos.length > 1 && (
              <>
                <div className="absolute top-1/2 left-2 transform -translate-y-1/2">
                  <button
                    onClick={prevPhoto}
                    className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75"
                  >
                    ←
                  </button>
                </div>
                <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
                  <button
                    onClick={nextPhoto}
                    className="bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75"
                  >
                    →
                  </button>
                </div>
                
                {/* Photo indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`w-2 h-2 rounded-full ${
                        index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
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

            if (!existingMatch) {
              // Ensure user1_id < user2_id constraint is respected
              const user1_id = profile.id < currentProfile.id ? profile.id : currentProfile.id
              const user2_id = profile.id < currentProfile.id ? currentProfile.id : profile.id
              
              const { error: matchError } = await supabase
                .from('matches')
                .insert({
                  user1_id: user1_id,
                  user2_id: user2_id,
                  created_at: new Date().toISOString()
                })

              if (matchError) {
                console.error('Error creating match:', matchError)
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
      {/* Header - Simple & Clean */}
      <div className="bg-white shadow-sm px-4 py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Kulanhub 💕
        </h1>
        
        <div className="flex items-center space-x-3">
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
            onClick={signOut}
            className="text-gray-600 hover:text-gray-800 text-sm hidden sm:block"
          >
            Sign Out
          </button>
          
          {/* Mobile user button */}
          <button
            onClick={signOut}
            className="sm:hidden w-8 h-8 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-sm font-semibold"
          >
            {profile?.first_name?.charAt(0)?.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white shadow-lg border-t border-gray-200 p-4">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
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

      {/* Main Discovery Area - Responsive spacing */}
      <div className="flex-1 flex flex-col items-center justify-start p-3 sm:p-4 pt-2 sm:pt-4">
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
            {/* Card Stack - Responsive height to fit different screens */}
            <div className="relative w-full max-w-sm lg:max-w-md xl:max-w-lg h-[460px] sm:h-[480px] lg:h-[520px] xl:h-[560px] mb-4 sm:mb-6">
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

            {/* Action Buttons - Always Visible & Responsive */}
            <div className="flex justify-center space-x-6 sm:space-x-8 lg:space-x-10 px-4 py-3 sm:py-4">
              <button
                onClick={cancelProfile}
                className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-red-300 hover:border-red-500 hover:bg-red-50 transition-all transform hover:scale-105 active:scale-95"
              >
                <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl">❌</span>
              </button>
              
              <button
                onClick={heeloProfile}
                className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full shadow-xl flex items-center justify-center border-2 border-pink-300 hover:border-pink-200 hover:from-pink-500 hover:to-rose-600 transition-all transform hover:scale-105 active:scale-95"
              >
                <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl text-white">👋</span>
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