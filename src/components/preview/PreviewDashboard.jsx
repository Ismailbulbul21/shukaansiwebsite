import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import RobustImage from '../common/RobustImage'

// Profile Card Component for Preview Mode
function PreviewProfileCard({ profile, onNext, onShowSignUp, isActive, cardIndex }) {
  // Initialize with first valid photo index
  const getFirstValidPhotoIndex = (photoUrls) => {
    if (!photoUrls || photoUrls.length === 0) return 0
    for (let i = 0; i < photoUrls.length; i++) {
      const photoUrl = photoUrls[i]
      if (photoUrl && 
          !photoUrl.includes('via.placeholder.com') && 
          !photoUrl.includes('No+Photo') &&
          photoUrl.trim() !== '') {
        return i
      }
    }
    return 0 // Fallback to first photo if none are valid
  }
  
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(() => getFirstValidPhotoIndex(profile.photo_urls))
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)

  const photos = profile.photo_urls || []
  
  // Check if current photo is valid (not a placeholder)
  const currentPhotoUrl = photos[currentPhotoIndex] || ''
  const isCurrentPhotoValid = currentPhotoUrl && 
    !currentPhotoUrl.includes('via.placeholder.com') && 
    !currentPhotoUrl.includes('No+Photo') &&
    currentPhotoUrl.trim() !== ''
  
  const currentPhoto = isCurrentPhotoValid 
    ? currentPhotoUrl 
    : 'https://via.placeholder.com/400x600?text=No+Photo'

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
    
    if (Math.abs(distance) > 50) {
      if (isLeftSwipe) {
        onNext()
      } else if (isRightSwipe) {
        onShowSignUp()
      }
    }
    
    setTouchStart(null)
    setTouchEnd(null)
    setDragX(0)
    setIsDragging(false)
  }

  // Helper function to check if a photo is valid
  const isPhotoValid = (photoUrl) => {
    return photoUrl && 
      !photoUrl.includes('via.placeholder.com') && 
      !photoUrl.includes('No+Photo') &&
      photoUrl.trim() !== ''
  }

  // Get array of valid photo indices
  const validPhotoIndices = photos.map((photo, index) => 
    isPhotoValid(photo) ? index : null
  ).filter(index => index !== null)

  // DEBUG: Log photo validation details (AFTER validPhotoIndices is defined)
  console.log(`🖼️ Preview Photo Debug for ${profile.first_name}:`)
  console.log(`📸 Total photos: ${photos.length}`)
  console.log(`📸 Current index: ${currentPhotoIndex}`)
  console.log(`📸 Current URL: ${currentPhotoUrl}`)
  console.log(`📸 Is valid: ${isCurrentPhotoValid}`)
  console.log(`📸 Final photo: ${currentPhoto}`)
  console.log(`📸 Valid indices: [${validPhotoIndices.join(', ')}]`)

  // Photo navigation - only navigate to valid photos
  const nextPhoto = () => {
    if (validPhotoIndices.length <= 1) return // No need to navigate if only 1 or no valid photos
    
    const currentValidIndex = validPhotoIndices.indexOf(currentPhotoIndex)
    const nextValidIndex = (currentValidIndex + 1) % validPhotoIndices.length
    setCurrentPhotoIndex(validPhotoIndices[nextValidIndex])
  }

  const prevPhoto = () => {
    if (validPhotoIndices.length <= 1) return // No need to navigate if only 1 or no valid photos
    
    const currentValidIndex = validPhotoIndices.indexOf(currentPhotoIndex)
    const prevValidIndex = (currentValidIndex - 1 + validPhotoIndices.length) % validPhotoIndices.length
    setCurrentPhotoIndex(validPhotoIndices[prevValidIndex])
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
      className={`absolute w-full max-w-none sm:max-w-sm lg:max-w-md xl:max-w-lg bg-white rounded-2xl overflow-hidden transition-all duration-300 h-[650px] sm:h-[650px] lg:h-[630px] xl:h-[650px] profile-card ${
        isActive ? 'z-10' : 'z-0'
      }`}
      style={{
        transform: `${getCardTransform()}`,
        opacity: getCardOpacity(),
        top: `${cardIndex * 8}px`,
        left: '0',
        right: '0',
        margin: '0 auto',
        padding: '0',
        width: '100%',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Photo Section */}
      <div 
        className="relative h-[420px] sm:h-[420px] lg:h-[400px] xl:h-[420px] bg-gray-50 lg:bg-gray-100 cursor-pointer w-full"
        onClick={(e) => {
          if (e.target === e.currentTarget || e.target.tagName === 'IMG') {
            setShowImageModal(true)
          }
        }}
      >
        <RobustImage
          src={currentPhoto}
          alt={`${profile.first_name}'s photo`}
          className="w-full h-full cursor-pointer hover:opacity-95 transition-opacity duration-200 bg-gray-100 mobile-image laptop-image"
          style={{
            objectPosition: 'center center',
            width: '100%',
            height: '100%',
            borderRadius: '0px'
          }}
          onClick={(e) => {
            e.stopPropagation()
            setShowImageModal(true)
          }}
          profileName={profile.first_name}
          retryAttempts={3}
          retryDelay={1500}
          showLoadingSpinner={false}
        />

        {/* Photo indicators - only show for valid photos */}
        {validPhotoIndices.length > 1 && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
            {validPhotoIndices.map((photoIndex) => (
              <button
                key={photoIndex}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setCurrentPhotoIndex(photoIndex)
                }}
                className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                  photoIndex === currentPhotoIndex 
                    ? 'bg-white shadow-lg scale-110' 
                    : 'bg-white/50 hover:bg-white/70'
                }`}
                aria-label={`Go to photo ${validPhotoIndices.indexOf(photoIndex) + 1}`}
              />
            ))}
          </div>
        )}

        {/* Photo Navigation Buttons */}
        {validPhotoIndices.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200 hover:scale-110 z-20"
              aria-label="Previous photo"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextPhoto}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-all duration-200 hover:scale-110 z-20"
              aria-label="Next photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  NEXT ❌
                </div>
              </div>
            )}
          </>
        )}

        {/* Action Buttons - Keep these as requested */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Left Button - Next Profile */}
          <div className="absolute left-4 bottom-4 pointer-events-auto">
            <button
              onClick={onNext}
              className="w-16 h-16 sm:w-18 sm:h-18 bg-white/90 backdrop-blur-sm rounded-full shadow-2xl flex items-center justify-center border-4 border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition-all transform hover:scale-110 active:scale-95"
            >
              <span className="text-2xl sm:text-3xl">❌</span>
            </button>
          </div>

          {/* Right Button - Heelo Sign Up */}
          <div className="absolute right-4 bottom-4 pointer-events-auto">
            <button
              onClick={onShowSignUp}
              className="w-16 h-16 sm:w-18 sm:h-18 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full shadow-2xl flex items-center justify-center border-4 border-pink-300 hover:border-pink-200 hover:from-pink-500 hover:to-rose-600 transition-all transform hover:scale-110 active:scale-95"
            >
              <span className="text-2xl sm:text-3xl text-white">👋</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white p-3 sm:p-3 lg:p-3 xl:p-4 h-[230px] sm:h-[230px] lg:h-[230px] xl:h-[230px] flex flex-col justify-center border-t border-gray-100">
        {/* Main Info - Responsive Grid Layout */}
        <div className="mb-3">
          {/* Mobile & Tablet: 2x2 Grid Layout */}
          <div className="grid grid-cols-2 gap-2 lg:hidden">
            {/* Row 1, Col 1: Name */}
            <div className="bg-pink-50 rounded-lg p-2 border border-pink-100 min-h-[50px] flex flex-col justify-center overflow-hidden">
              <div className="flex items-center space-x-1 mb-1">
                <span className="text-pink-500 text-[10px]">👤</span>
                <span className="text-pink-600 text-[9px] font-medium uppercase tracking-wide">Name</span>
              </div>
              <div className="text-gray-900 text-[11px] font-semibold leading-tight truncate w-full">{profile.first_name}</div>
            </div>
            
            {/* Row 1, Col 2: Age */}
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-100 min-h-[50px] flex flex-col justify-center overflow-hidden">
              <div className="flex items-center space-x-1 mb-1">
                <span className="text-blue-500 text-[10px]">🎂</span>
                <span className="text-blue-600 text-[9px] font-medium uppercase tracking-wide">Age</span>
              </div>
              <div className="text-gray-900 text-[11px] font-semibold w-full">{profile.age}</div>
            </div>
            
            {/* Row 2, Col 1: Location */}
            <div className="bg-green-50 rounded-lg p-2 border border-green-100 min-h-[50px] flex flex-col justify-center overflow-hidden">
              <div className="flex items-center space-x-1 mb-1">
                <span className="text-green-500 text-[10px]">📍</span>
                <span className="text-green-600 text-[9px] font-medium uppercase tracking-wide">Location</span>
              </div>
              <div className="text-gray-900 text-[11px] font-semibold leading-tight truncate w-full">{profile.location_value}</div>
            </div>
            
            {/* Row 2, Col 2: Qabiil */}
            <div className="bg-purple-50 rounded-lg p-2 border border-purple-100 min-h-[50px] flex flex-col justify-center overflow-hidden">
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
        
        {/* Bio */}
        {profile.bio ? (
          <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 mt-2">
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
          <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 mt-2">
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
            <RobustImage
              src={currentPhoto}
              alt={`${profile.first_name}'s photo ${currentPhotoIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl bg-gray-100"
              style={{ 
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto'
              }}
              profileName={`${profile.first_name} (Preview Modal)`}
              retryAttempts={3}
              retryDelay={1500}
              showLoadingSpinner={false}
            />
            
            {/* Photo navigation for modal */}
            {validPhotoIndices.length > 1 && (
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
                  {validPhotoIndices.map((photoIndex) => (
                    <button
                      key={photoIndex}
                      onClick={() => setCurrentPhotoIndex(photoIndex)}
                      className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                        photoIndex === currentPhotoIndex 
                          ? 'bg-white shadow-lg scale-110' 
                          : 'bg-white/60 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Photo counter */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white text-sm px-3 py-1 rounded-full">
                  {validPhotoIndices.indexOf(currentPhotoIndex) + 1} of {validPhotoIndices.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Main PreviewDashboard Component
export default function PreviewDashboard({ onSignUp, onLogin }) {
  const [profiles, setProfiles] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasMore, setHasMore] = useState(true)

  // Fetch preview profiles without authentication
  const fetchPreviewProfiles = async () => {
    try {
      setLoading(true)
      setError('')

      console.log('🔍 Fetching preview profiles for unauthenticated users')
      
      // Use the fixed database function with NULL current_user_id
      console.log('🔍 Calling get_discovery_profiles with params:', {
        current_user_id: null,
        limit_count: 15
      })
      
      const { data, error } = await supabase.rpc('get_discovery_profiles', {
        current_user_id: null,  // ← Key: No authentication required
        limit_count: 15  // ← More profiles for preview mode
      })

      if (error) {
        console.error('❌ Preview profiles fetch error:', error)
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('📋 Preview profiles fetched:', data?.length || 0)
      
      // ULTRA STRICT Frontend validation: only show truly complete profiles with working images and bio
      const validProfiles = (data || []).filter(fetchedProfile => {
        const isComplete = fetchedProfile.first_name && 
                          fetchedProfile.age >= 18 && 
                          fetchedProfile.age <= 100 &&
                          // BIO IS NOW MANDATORY - just needs to be non-empty
                          fetchedProfile.bio &&
                          fetchedProfile.bio.trim() !== '' &&
                          // PHOTO VALIDATION
                          fetchedProfile.photo_urls && 
                          fetchedProfile.photo_urls.length === 4 &&
                          fetchedProfile.photo_urls.every(url => 
                            url && 
                            !url.includes('placeholder') && 
                            !url.includes('No+Photo') &&
                            url.trim() !== '' &&
                            // Must be valid Supabase storage URL
                            url.includes('numuheaxmywbzkocpbik.supabase.co/storage/v1/object/public/profile-photos/')
                          ) &&
                          fetchedProfile.clan_name &&
                          fetchedProfile.subclan_name &&
                          fetchedProfile.location_type &&
                          fetchedProfile.location_value
        
        if (!isComplete) {
          console.warn(`⚠️ Preview: Filtering out incomplete profile: ${fetchedProfile.first_name}`, {
            hasName: !!fetchedProfile.first_name,
            validAge: fetchedProfile.age >= 18 && fetchedProfile.age <= 100,
            hasBio: !!fetchedProfile.bio && fetchedProfile.bio.trim() !== '',
            photoCount: fetchedProfile.photo_urls?.length,
            validPhotos: fetchedProfile.photo_urls?.every(url => 
              url && !url.includes('placeholder') && !url.includes('No+Photo') && url.trim() !== '' &&
              url.includes('numuheaxmywbzkocpbik.supabase.co/storage/v1/object/public/profile-photos/')
            )
          })
        }
        
        return isComplete
      })
      
      console.log('📋 Valid complete profiles for preview:', validProfiles.length)
      setProfiles(validProfiles)
      setHasMore(data && data.length === 15)
    } catch (error) {
      console.error('Error fetching preview profiles:', error)
      setError('Failed to load profiles. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load profiles on component mount
  useEffect(() => {
    fetchPreviewProfiles()
  }, [])

  // Handle profile navigation
  const handleNext = () => {
    setCurrentIndex(prev => prev + 1)
    
    // Load more profiles if running low
    if (currentIndex >= profiles.length - 3 && hasMore) {
      fetchPreviewProfiles()
    }
  }

  const handleShowSignUp = () => {
    console.log('👋 User wants to sign up from preview mode')
    onSignUp()
  }

  // Show loading spinner while fetching profiles
  if (loading && profiles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading amazing Somali profiles...</p>
          </div>
        </div>
      </div>
    )
  }

  const currentProfile = profiles[currentIndex]
  const hasProfiles = profiles.length > 0 && currentIndex < profiles.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 discovery-container">
      {/* Modern Header - Full Width Responsive (like DiscoveryPage) */}
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
          
          {/* Right Side - Authentication Buttons - Optimized spacing for mobile */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={onLogin}
              className="px-3 sm:px-4 py-2 text-gray-700 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all duration-200 border border-gray-300 hover:border-pink-300 text-sm sm:text-base"
            >
              Login
            </button>
            <button
              onClick={onSignUp}
              className="px-4 sm:px-6 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-rose-600 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>

      {/* Main Preview Content - Full Width Responsive (like DiscoveryPage) */}
      <div className="flex-1 flex flex-col items-center justify-start px-0 pt-1 sm:pt-2 w-full">
        {/* Error Display - Mobile First */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 w-full max-w-sm mx-auto">
            <p className="text-red-600 text-center">{error}</p>
            <button
              onClick={() => fetchPreviewProfiles()}
              className="mt-2 w-full bg-red-500 text-white py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Profile Display */}
        {hasProfiles ? (
          <>
            {/* Card Stack - Proper Width with Margins (like DiscoveryPage) */}
            <div className="relative w-[95%] max-w-sm lg:max-w-md xl:max-w-lg h-[650px] sm:h-[650px] lg:h-[630px] xl:h-[650px] mb-4 sm:mb-6 card-stack mx-auto">
              {/* Show current and next profile cards */}
              {[currentIndex, currentIndex + 1].map((index, cardIndex) => {
                const profile = profiles[index]
                if (!profile) return null
                
                return (
                  <PreviewProfileCard
                    key={`${profile.id}-${index}`}
                    profile={profile}
                    onNext={handleNext}
                    onShowSignUp={handleShowSignUp}
                    isActive={cardIndex === 0}
                    cardIndex={cardIndex}
                  />
                )
              })}
            </div>

            {/* Progress indicator */}
            <div className="mt-4 text-center">
              <p className="text-gray-600 text-sm">
                              {/* Profile count hidden */}
              </p>
              </div>
          </>
        ) : (
          <div className="text-center max-w-sm">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                🎉 Welcome to Kulanhub!
              </h2>
              <p className="text-gray-600 mb-6">
                Join our community of Somali singles and start your journey to meaningful connections.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={onSignUp}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-200"
                >
                  Create Account
                </button>
                <button
                  onClick={onLogin}
                  className="w-full border-2 border-pink-500 text-pink-600 px-6 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-colors"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
