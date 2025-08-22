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
    return 'rotate(0deg)'
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
      className={`absolute w-screen max-w-none sm:max-w-sm lg:max-w-md xl:max-w-lg bg-white rounded-2xl overflow-hidden transition-all duration-300 h-[600px] sm:h-[600px] lg:h-[580px] xl:h-[600px] profile-card ${
        isActive ? 'z-10' : 'z-0'
      }`}
      style={{
        transform: `${getCardTransform()}`,
        opacity: getCardOpacity(),
        top: `${cardIndex * 8}px`,
        left: '0',
        right: '0',
        margin: '0',
        padding: '0',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo Section - Responsive Background */}
      <div 
        className="relative h-[380px] sm:h-[380px] lg:h-[360px] xl:h-[380px] bg-gray-50 lg:bg-gray-100 cursor-pointer w-full"
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
          className="w-full h-full cursor-pointer hover:opacity-95 transition-opacity duration-200 bg-gray-100 mobile-image laptop-image"
          style={{
            objectPosition: 'center center',
            width: '100%',
            height: '100%'
          }}
          onClick={(e) => {
            e.stopPropagation() // Ensure click event is handled
            console.log('🖼️ Image clicked! Opening modal...')
            setShowImageModal(true)
          }}
        />
        

        
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

        {/* Action Buttons - Positioned at bottom of image section */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left Button - Cancel/Dislike */}
          <div className="absolute left-4 bottom-4 pointer-events-auto">
            <button
              onClick={() => onSwipe && onSwipe('cancel')}
              className="w-16 h-16 sm:w-18 sm:h-18 bg-white/90 backdrop-blur-sm rounded-full shadow-2xl flex items-center justify-center border-4 border-red-300 hover:border-red-500 hover:bg-red-50 transition-all transform hover:scale-110 active:scale-95"
            >
              <span className="text-2xl sm:text-3xl">❌</span>
            </button>
          </div>

          {/* Right Button - Hello/Like */}
          <div className="absolute right-4 bottom-4 pointer-events-auto">
            <button
              onClick={() => onSwipe && onSwipe('heelo')}
              className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full shadow-2xl flex items-center justify-center border-4 border-pink-300 hover:border-pink-200 hover:from-pink-500 hover:to-rose-600 transition-all transform hover:scale-110 active:scale-95"
            >
              <span className="text-2xl sm:text-3xl text-white">👋</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Info - Clean Tinder/Hinge Style */}
      <div className="bg-white p-4 sm:p-4 lg:p-4 xl:p-5 h-[220px] sm:h-[220px] lg:h-[220px] xl:h-[220px] flex flex-col justify-center border-t border-gray-100">
        {/* Main Info - Responsive Grid Layout */}
        <div className="mb-4">
          {/* Mobile & Tablet: 2x2 Grid Layout */}
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            {/* Row 1, Col 1: Name */}
            <div className="bg-pink-50 rounded-lg p-2 border border-pink-100 min-h-[60px] flex flex-col justify-center overflow-hidden">
              <div className="flex items-center space-x-1 mb-1">
                <span className="text-pink-500 text-[10px]">👤</span>
                <span className="text-pink-600 text-[9px] font-medium uppercase tracking-wide">Name</span>
              </div>
              <div className="text-gray-900 text-[11px] font-semibold leading-tight truncate w-full">{profile.first_name}</div>
            </div>
            
            {/* Row 1, Col 2: Age */}
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 min-h-[60px] flex flex-col justify-center overflow-hidden">
              <div className="flex items-center space-x-1 mb-1">
                <span className="text-blue-500 text-[10px]">🎂</span>
                <span className="text-blue-600 text-[9px] font-medium uppercase tracking-wide">Age</span>
              </div>
              <div className="text-gray-900 text-[11px] font-semibold w-full">{profile.age}</div>
            </div>
            
            {/* Row 2, Col 1: Location */}
            <div className="bg-green-50 rounded-lg p-2 border border-green-100 min-h-[60px] flex flex-col justify-center overflow-hidden">
              <div className="flex items-center space-x-1 mb-1">
                <span className="text-green-500 text-[10px]">📍</span>
                <span className="text-green-600 text-[9px] font-medium uppercase tracking-wide">Location</span>
              </div>
              <div className="text-gray-900 text-[11px] font-semibold leading-tight truncate w-full">{profile.location_value}</div>
            </div>
            
            {/* Row 2, Col 2: Qabiil */}
            <div className="bg-purple-50 rounded-lg p-2 border border-purple-100 min-h-[60px] flex flex-col justify-center overflow-hidden">
              <div className="flex items-center space-x-1 mb-1">
                <span className="text-purple-500 text-[10px]">🏛️</span>
                <span className="text-purple-600 text-[9px] font-medium uppercase tracking-wide">Qabiil</span>
              </div>
              <div className="w-full truncate">
                <span className="text-purple-700 text-[11px] font-semibold">{profile.clan_name || 'Not set'}</span>
                {profile.subclan_name && (
                  <span className="text-green-600 text-[10px] font-medium ml-1">• {profile.subclan_name}</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Laptop/Desktop: 2x2 Grid Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {/* Row 1: Name & Age */}
            <div className="profile-info-row">
              <span className="text-gray-400 text-sm flex-shrink-0">👤</span>
              <span className="text-gray-600 text-xs font-medium uppercase tracking-wider flex-shrink-0">Name</span>
              <span className="text-gray-900 text-base font-semibold profile-info-value">{profile.first_name}</span>
            </div>
            
            <div className="profile-info-row">
              <span className="text-gray-400 text-sm flex-shrink-0">🎂</span>
              <span className="text-gray-600 text-xs font-medium uppercase tracking-wider flex-shrink-0">Age</span>
              <span className="text-gray-900 text-base font-semibold">{profile.age}</span>
            </div>
            
            {/* Row 2: Location & Qabiil */}
            <div className="profile-info-row">
              <span className="text-gray-400 text-sm flex-shrink-0">📍</span>
              <span className="text-gray-600 text-xs font-medium uppercase tracking-wider flex-shrink-0">Location</span>
              <span className="text-gray-900 text-base font-semibold profile-info-value">{profile.location_value}</span>
            </div>
            
            <div className="profile-info-row">
              <span className="text-gray-400 text-sm flex-shrink-0">🏛️</span>
              <span className="text-gray-600 text-xs font-medium uppercase tracking-wider flex-shrink-0">Qabiil</span>
              <div className="qabiil-display">
                <span className="clan-name">{profile.clan_name || 'Not set'}</span>
                {profile.subclan_name && (
                  <span className="subclan-name">• {profile.subclan_name}</span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bio - Clean & Simple with Better Text Handling */}
        {profile.bio ? (
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mt-3">
            <div className="flex items-start space-x-2">
              <span className="text-gray-400 text-sm mt-0.5 flex-shrink-0">💭</span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 text-xs font-medium uppercase tracking-wider mb-1">Bio</p>
                <p className="text-gray-800 text-sm leading-relaxed font-medium profile-info-bio">
                  "{profile.bio}"
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mt-3">
            <div className="flex items-start space-x-2">
              <span className="text-gray-400 text-sm mt-0.5 flex-shrink-0">💭</span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-600 text-xs font-medium uppercase tracking-wider mb-1">Bio</p>
                <p className="text-gray-500 text-sm italic font-medium">
                  No bio available
                </p>
              </div>
            </div>
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
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-gray-100"
              style={{ 
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto'
              }}
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

export default function DiscoveryPage({ onShowNotifications, onShowChat, resetNotifications }) {
  const { user, profile, signOut, isSigningOut } = useAuth()
  
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
  const [acceptanceNotifications, setAcceptanceNotifications] = useState([])
  const [showAcceptanceModal, setShowAcceptanceModal] = useState(false)
  
  // New state for chat message notifications - track unique users who sent messages
  const [newMessageUsers, setNewMessageUsers] = useState(new Set())
  const [messageNotificationSubscription, setMessageNotificationSubscription] = useState(null)
  
  // Profile management states
  const [showProfile, setShowProfile] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    age: '',
    bio: '',
    location_type: '',
    location_value: '',
    clan_family_id: '',
    subclan_id: ''
  })
  
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

  // Fetch notification count (both hellos and acceptance notifications)
  const fetchNotificationCount = async () => {
    if (!profile) {
      console.log('Profile not loaded yet, skipping notification count')
      return
    }
    
    try {
      // Get pending hellos count
      const { count: helloCount, error: helloError } = await supabase
        .from('hellos')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', profile.id)
        .eq('status', 'pending')

      if (helloError) throw helloError

      // Get unread acceptance notifications count  
      const { count: acceptanceCount, error: acceptanceError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('type', 'hello_accepted')
        .eq('is_read', false)

      if (acceptanceError) throw acceptanceError

      // Total notifications = pending hellos + unread acceptances
      const totalCount = (helloCount || 0) + (acceptanceCount || 0)
      setNotificationCount(totalCount)
      
      console.log('🔔 Notification counts:', { 
        hellos: helloCount || 0, 
        acceptances: acceptanceCount || 0, 
        total: totalCount 
      })
    } catch (error) {
      console.error('Error fetching notification count:', error)
    }
  }

  // Fetch acceptance notifications
  const fetchAcceptanceNotifications = async () => {
    if (!profile?.id) return
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          related_user_profile:user_profiles!related_user_id(
            id,
            first_name,
            photo_urls
          )
        `)
        .eq('user_id', profile.id)
        .eq('type', 'hello_accepted')
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      console.log('📬 Acceptance notifications fetched:', data?.length || 0)
      setAcceptanceNotifications(data || [])
      
      // Auto-show modal if there are new acceptances
      if (data && data.length > 0) {
        setShowAcceptanceModal(true)
      }
    } catch (error) {
      console.error('Error fetching acceptance notifications:', error)
    }
  }

  // Mark acceptance notifications as read
  const markAcceptanceNotificationsAsRead = async () => {
    if (!profile?.id || acceptanceNotifications.length === 0) return
    
    try {
      const notificationIds = acceptanceNotifications.map(n => n.id)
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds)
        
      if (error) throw error
      
      console.log('✅ Acceptance notifications marked as read')
      setAcceptanceNotifications([])
      fetchNotificationCount() // Refresh count
    } catch (error) {
      console.error('Error marking acceptance notifications as read:', error)
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

  // Profile management functions
  const openProfile = () => {
    setProfileForm({
      first_name: profile?.first_name || '',
      age: profile?.age || '',
      bio: profile?.bio || '',
      location_type: profile?.location_type || '',
      location_value: profile?.location_value || '',
      clan_family_id: profile?.clan_family_id || '',
      subclan_id: profile?.subclan_id || ''
    })
    setShowProfile(true)
  }

  const saveProfile = async () => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(profileForm)
        .eq('id', profile.id)

      if (error) throw error

      // Refresh profile data
      window.location.reload()
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const getQabiilName = (clanFamilyId, subclanId) => {
    const family = clanFamilies.find(f => f.id === clanFamilyId)
    const subclan = subclans.find(s => s.id === subclanId)
    return {
      family: family?.name || '',
      subclan: subclan?.name || ''
    }
  }

  // POLLING-BASED notification system (like NotificationPage.jsx) - MORE RELIABLE
  const checkForNewMessages = async () => {
    if (!profile?.id) {
      return
    }

    try {
      console.log('🔔 Checking for new messages for user:', profile.id)
      
      // Get user's matches to check their chat rooms
      const { data: userMatches, error: matchError } = await supabase
        .from('matches')
        .select('id')
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)

      if (matchError || !userMatches || userMatches.length === 0) {
        console.log('📭 No matches found for message checking')
        return
      }

      // Get chat rooms for these matches
      const matchIds = userMatches.map(match => match.id)
      const { data: chatRooms, error: roomError } = await supabase
        .from('chat_rooms')
        .select('id')
        .in('match_id', matchIds)

      if (roomError || !chatRooms || chatRooms.length === 0) {
        console.log('📭 No chat rooms found for message checking')
        return
      }

      const chatRoomIds = chatRooms.map(room => room.id)

      // Check for new messages in these chat rooms that are unread and not from current user
      const { data: newMessages, error: messageError } = await supabase
        .from('messages')
        .select('sender_id, created_at')
        .in('chat_room_id', chatRoomIds)
        .neq('sender_id', profile.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })

      if (messageError) {
        console.error('❌ Error checking for new messages:', messageError)
        return
      }

      if (newMessages && newMessages.length > 0) {
        console.log('📨 Found', newMessages.length, 'unread messages')
        
        // Get unique sender IDs
        const uniqueSenders = [...new Set(newMessages.map(msg => msg.sender_id))]
        console.log('🔔 Unique senders with unread messages:', uniqueSenders.length)

        // Update notification state with unique senders
        setNewMessageUsers(new Set(uniqueSenders))
      } else {
        console.log('📭 No unread messages found')
        // Clear notifications when no unread messages
        setNewMessageUsers(new Set())
      }
      
    } catch (error) {
      console.error('❌ Error checking for new messages:', error)
    }
  }

  // Set up polling-based message checking (like NotificationPage.jsx)
  const setupMessageNotificationSubscription = async () => {
    if (!profile?.id) {
      console.log('❌ No profile ID, skipping notification setup')
      return
    }

    console.log('🔔 Setting up POLLING-based message notifications for user:', profile.id)
    
    // Initial check
    await checkForNewMessages()
    
    // Set up regular polling every 5 seconds
    const pollingInterval = setInterval(checkForNewMessages, 5000)
    
    // Store the interval ID so we can clean it up
    setMessageNotificationSubscription({ pollingInterval })
    
    console.log('✅ Polling-based message notifications established')
  }

  // Clean up message notification subscription
  const cleanupMessageNotificationSubscription = () => {
    if (messageNotificationSubscription) {
      console.log('🔔 Cleaning up message notification subscription')
      try {
        if (messageNotificationSubscription.pollingInterval) {
          // Clean up polling interval
          clearInterval(messageNotificationSubscription.pollingInterval)
          console.log('🔔 Polling interval cleared')
        } else {
          // Clean up real-time subscription (fallback)
          messageNotificationSubscription.unsubscribe()
          supabase.removeChannel(messageNotificationSubscription)
        }
      } catch (error) {
        console.error('❌ Error cleaning up subscription:', error)
      }
      setMessageNotificationSubscription(null)
    }
  }

  // Debug function to show which users have sent new messages
  const logNotificationUsers = () => {
    console.log('🔔 Current notification state:')
    console.log('🔔 - New message users count:', newMessageUsers.size)
    console.log('🔔 - New message users:', Array.from(newMessageUsers))
    console.log('🔔 - Profile ID:', profile?.id)
    console.log('🔔 - Subscription active:', !!messageNotificationSubscription)
  }



  // Log notification users whenever they change
  useEffect(() => {
    logNotificationUsers()
  }, [newMessageUsers])

  // Reset notifications when user opens Messages page
  useEffect(() => {
    if (resetNotifications) {
      console.log('🔄 Resetting notifications due to Messages page access')
      setNewMessageUsers(new Set())
    }
  }, [resetNotifications])

  useEffect(() => {
    if (profile?.id) {
      console.log('🚀 Profile loaded, setting up notifications for user:', profile.id)
      
      // Set up notifications immediately (polling-based, no need for delay)
      fetchNotificationCount()
      fetchAcceptanceNotifications()
      setupMessageNotificationSubscription()
      
      // Set up real-time subscription for acceptance notifications
      const notificationSubscription = supabase
        .channel(`user-notifications-${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${profile.id}`
          },
          (payload) => {
            console.log('📬 New notification received:', payload)
            if (payload.new.type === 'hello_accepted') {
              console.log('🎉 Someone accepted your hello!')
              fetchAcceptanceNotifications()
              fetchNotificationCount()
            }
          }
        )
        .subscribe((status) => {
          console.log('🔔 Notification subscription status:', status)
        })
      
      // Refresh notification count every 30 seconds
      const interval = setInterval(() => {
        fetchNotificationCount()
        fetchAcceptanceNotifications()
      }, 30000)
      
      return () => {
        console.log('🧹 Cleaning up discovery page subscriptions')
        clearInterval(interval)
        cleanupMessageNotificationSubscription()
        supabase.removeChannel(notificationSubscription)
      }
    }
  }, [profile?.id]) // Only depend on profile.id, not the entire profile object

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 discovery-container">
      {/* Modern Header - Full Width Responsive */}
      <div className="bg-white/90 backdrop-blur-sm shadow-lg border-b border-pink-100 px-2 sm:px-4 py-3 sm:py-4 w-full">
        <div className="flex justify-between items-center w-full px-2 sm:px-4">
          {/* Left Side - Logo & App Name - Compact on small screens */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10">
              <img 
                src="/ChatGPT Image Aug 21, 2025, 07_58_55 PM.png" 
                alt="Kulanhub Logo" 
                className="w-full h-full object-contain rounded-lg sm:rounded-xl"
              />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
              Kulanhub
            </h1>
          </div>
          
          {/* Right Side - Action Buttons - Optimized spacing for mobile */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`relative p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl transition-all duration-200 ${
                showFilters 
                  ? 'bg-purple-500 text-white shadow-lg' 
                  : 'text-gray-600 hover:text-purple-500 hover:bg-purple-50'
              }`}
            >
              <span className="text-base sm:text-lg">🔍</span>
              {(filters.clanFamily || filters.subclan || filters.locationType || 
                filters.minAge > 18 || filters.maxAge < 60) && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full h-3 w-3 sm:h-4 sm:w-4 flex items-center justify-center">
                  !
                </span>
              )}
            </button>

            {/* Chat Button with Message Notification */}
            <button
              onClick={() => {
                console.log('💬 Chat button clicked, clearing notifications')
                console.log('💬 Before clear - notification users:', Array.from(newMessageUsers))
                setNewMessageUsers(new Set()) // Reset notifications when opening chat
                console.log('💬 After clear - notification users should be empty')
                onShowChat()
              }}
              className="relative p-1.5 sm:p-2 md:p-2.5 text-gray-600 hover:text-pink-500 hover:bg-pink-50 rounded-lg sm:rounded-xl transition-all duration-200"
            >
              <span className="text-base sm:text-lg">💬</span>
              {newMessageUsers.size > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium animate-pulse">
                  {newMessageUsers.size > 9 ? '9+' : newMessageUsers.size}
                </span>
              )}
            </button>



            {/* Notifications Button */}
            <button
              onClick={onShowNotifications}
              className="relative p-1.5 sm:p-2 md:p-2.5 text-gray-600 hover:text-pink-500 hover:bg-pink-50 rounded-lg sm:rounded-xl transition-all duration-200"
            >
              <span className="text-lg">🔔</span>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-medium">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
            
            {/* Modern Profile Section */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Profile Info Button */}
              <button
                onClick={openProfile}
                className="flex items-center space-x-2 sm:space-x-3 p-2.5 sm:p-3 text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-xl transition-all duration-200 group min-h-[44px] touch-manipulation"
              >
                {/* User Avatar */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-pink-200 group-hover:border-pink-400 transition-colors">
                  {profile?.photo_urls?.[0] ? (
                    <img 
                      src={profile.photo_urls[0]} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-semibold text-sm">
                      {profile?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                
                {/* Name and greeting - Hidden on mobile */}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">
                    {profile?.first_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Edit Profile
                  </p>
                </div>
              </button>

              {/* Standalone Sign Out Button */}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center justify-center p-2.5 sm:p-3 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 hover:border-red-300 min-w-[44px] min-h-[44px] touch-manipulation"
                title="Sign Out"
              >
                {isSigningOut ? (
                  <div className="animate-spin w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="hidden md:block ml-1 text-sm font-medium">Sign Out</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ultra Compact Filter Panel - Overlay Style */}
      {showFilters && (
        <div className="bg-white/95 backdrop-blur-sm shadow-2xl border-t border-purple-100 p-2 sm:p-3">
          <div className="max-w-4xl mx-auto">
            {/* Ultra Compact Header */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                🔍 Filters
              </h3>
              <button
                onClick={resetFilters}
                className="px-2 py-1 text-xs sm:text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 border border-purple-200 hover:border-purple-300"
              >
                Reset All
              </button>
            </div>
            
            {/* Ultra Compact Single Row Layout */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Age Range - Ultra Compact */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-2 rounded-lg border border-purple-200 flex items-center space-x-2">
                <span className="text-xs font-semibold text-purple-700 whitespace-nowrap">
                  Age: {filters.minAge}-{filters.maxAge}
                </span>
                <div className="flex items-center space-x-1">
                  <input
                    type="range"
                    min="18"
                    max="60"
                    value={filters.minAge}
                    onChange={(e) => handleFilterChange('minAge', parseInt(e.target.value))}
                    className="w-16 h-1.5 bg-gradient-to-r from-purple-200 to-purple-300 rounded-full appearance-none cursor-pointer slider-thumb"
                  />
                  <input
                    type="range"
                    min="18"
                    max="60"
                    value={filters.maxAge}
                    onChange={(e) => handleFilterChange('maxAge', parseInt(e.target.value))}
                    className="w-16 h-1.5 bg-gradient-to-r from-purple-200 to-purple-300 rounded-full appearance-none cursor-pointer slider-thumb"
                  />
                </div>
              </div>

              {/* Qabiil Family - Ultra Compact */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-2 rounded-lg border border-blue-200">
                <select
                  value={filters.clanFamily}
                  onChange={(e) => handleFilterChange('clanFamily', e.target.value)}
                  className="bg-white/80 backdrop-blur-sm border border-blue-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200"
                >
                  <option value="">🏛️ Any Qabiil</option>
                  {clanFamilies.map(family => (
                    <option key={family.id} value={family.id}>
                      {family.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* qabiilka-hoose - Ultra Compact */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded-lg border border-green-200">
                <select
                  value={filters.subclan}
                  onChange={(e) => handleFilterChange('subclan', e.target.value)}
                  className="bg-white/80 backdrop-blur-sm border border-green-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-green-400 focus:border-green-400 transition-all duration-200"
                  disabled={!filters.clanFamily}
                >
                  <option value="">🏘️ Any qabiilka-hoose</option>
                  {filteredSubclans.map(subclan => (
                    <option key={subclan.id} value={subclan.id}>
                      {subclan.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Type - Ultra Compact */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-2 rounded-lg border border-amber-200">
                <select
                  value={filters.locationType}
                  onChange={(e) => handleFilterChange('locationType', e.target.value)}
                  className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all duration-200"
                >
                  <option value="">📍 Any Location</option>
                  <option value="somalia">Somalia</option>
                  <option value="diaspora">Diaspora</option>
                </select>
              </div>

              {/* Apply Button - Inline */}
              <button
                onClick={() => setShowFilters(false)}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-xs sm:text-sm"
              >
                ✨ Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Management Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800">Profile Management</h2>
                <button
                  onClick={() => setShowProfile(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            {/* Profile Content */}
            <div className="p-6 space-y-6">
              {/* Profile Photos */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Profile Photos</h3>
                <div className="grid grid-cols-2 gap-3">
                  {profile?.photo_urls?.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-xl border-2 border-gray-200"
                      />
                      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Profile Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Edit Information</h3>
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, first_name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200"
                    placeholder="Enter your name"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={profileForm.age}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200"
                    placeholder="Enter your age"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={profileForm.bio || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Current Info Display */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Current Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Qabiil Family:</span>
                      <p className="font-medium">{getQabiilName(profile?.clan_family_id, profile?.subclan_id).family}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">qabiilka-hoose:</span>
                      <p className="font-medium">{getQabiilName(profile?.clan_family_id, profile?.subclan_id).subclan}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Location:</span>
                      <p className="font-medium">{profile?.location_value}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <p className="font-medium capitalize">{profile?.location_type}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={saveProfile}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acceptance Notification Modal */}
      {showAcceptanceModal && acceptanceNotifications.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Great News!</h2>
                    <p className="text-sm text-gray-600">Someone accepted your hello!</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAcceptanceModal(false)
                    markAcceptanceNotificationsAsRead()
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="p-6 space-y-4">
              {acceptanceNotifications.map((notification) => (
                <div key={notification.id} className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center space-x-4">
                    {/* Profile Photo */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-green-300">
                      <img
                        src={notification.related_user_profile?.photo_urls?.[0] || 'https://via.placeholder.com/48x48?text=?'}
                        alt={`${notification.related_user_profile?.first_name}'s photo`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {notification.related_user_profile?.first_name} accepted your hello!
                      </h3>
                      <p className="text-sm text-gray-600">
                        You can now chat with each other! 💬
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* Match Icon */}
                    <div className="text-green-500 text-2xl">
                      💕
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-3xl">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setShowAcceptanceModal(false)
                    markAcceptanceNotificationsAsRead()
                    onShowChat()
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  💬 Open Chat
                </button>
                <button
                  onClick={() => {
                    setShowAcceptanceModal(false)
                    markAcceptanceNotificationsAsRead()
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Discovery Area - Full Width */}
      <div className="flex-1 flex flex-col items-center justify-start px-0 pt-1 sm:pt-2 w-full">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 w-full max-w-sm mx-auto">
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
            {/* Card Stack - Full Screen Width */}
            <div className="relative w-screen max-w-none sm:max-w-sm lg:max-w-md xl:max-w-lg h-[600px] sm:h-[600px] lg:h-[580px] xl:h-[600px] mb-4 sm:mb-6 card-stack">
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

            {/* Action Buttons are now overlaid on the card edges for better accessibility */}
            <div className="px-4 py-3 sm:py-4">
              <p className="text-center text-gray-500 text-sm">
                Use the buttons on the card to interact with profiles
              </p>
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