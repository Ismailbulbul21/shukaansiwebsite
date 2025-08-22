import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

// Photo Upload Component
function PhotoUploadStep({ photoUrls, onPhotosUpdate, userId }) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files)
    
    if (files.length === 0) return

    // Validate file count
    if (photoUrls.length + files.length > 4) {
      setError('You can only upload a maximum of 4 photos')
      return
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const invalidFiles = files.filter(file => !validTypes.includes(file.type))
    if (invalidFiles.length > 0) {
      setError('Please upload only JPEG, PNG, or WebP images')
      return
    }

    // Validate file sizes (5MB max each)
    const maxSize = 5 * 1024 * 1024 // 5MB
    const largeFiles = files.filter(file => file.size > maxSize)
    if (largeFiles.length > 0) {
      setError('Each photo must be smaller than 5MB')
      return
    }

    setError('')
    setUploading(true)
    setUploadProgress(0)

    try {
      const uploadedUrls = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${userId}/${Date.now()}-${i}.${fileExt}`

        const { data, error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, file)

        if (uploadError) {
          throw uploadError
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName)

        uploadedUrls.push(publicUrl)
        setUploadProgress(((i + 1) / files.length) * 100)
      }

      // Update photo URLs
      onPhotosUpdate([...photoUrls, ...uploadedUrls])
      
    } catch (error) {
      console.error('Upload error:', error)
      setError('Failed to upload photos. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const removePhoto = async (indexToRemove, urlToRemove) => {
    try {
      // Extract file path from URL to delete from storage
      if (urlToRemove && urlToRemove.includes('profile-photos')) {
        const filePath = urlToRemove.split('/profile-photos/')[1]
        if (filePath) {
          await supabase.storage
            .from('profile-photos')
            .remove([filePath])
        }
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
    }

    // Remove from local state
    const newUrls = photoUrls.filter((_, index) => index !== indexToRemove)
    onPhotosUpdate(newUrls)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 text-center">
        Upload Photos
      </h2>
      <p className="text-center text-gray-600">
        Upload exactly 4 photos ({photoUrls.length}/4)
      </p>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div 
            key={index}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden relative"
          >
            {photoUrls[index] ? (
              // Show uploaded photo
              <div className="relative w-full h-full">
                <img
                  src={photoUrls[index]}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removePhoto(index, photoUrls[index])}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            ) : (
              // Show upload placeholder
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <div className="text-2xl mb-2">📸</div>
                <div className="text-xs text-center">
                  Photo {index + 1}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upload Button */}
      {photoUrls.length < 4 && (
        <div>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="photo-upload"
          />
          <label
            htmlFor="photo-upload"
            className={`w-full block text-center py-3 px-6 border-2 border-dashed border-pink-300 rounded-lg text-pink-600 font-medium cursor-pointer hover:border-pink-400 hover:bg-pink-50 transition-colors ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? '⏳ Uploading...' : '📱 Select Photos'}
          </label>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="w-full">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading photos...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-blue-700 text-sm">
          💡 <strong>Tips:</strong> Upload clear photos of yourself. JPEG, PNG, or WebP formats. Max 5MB each.
        </p>
      </div>


    </div>
  )
}

const steps = [
  { id: 1, title: 'Basic Info', description: 'Name, age, and gender' },
  { id: 2, title: 'Clan', description: 'Family and subclan' },
  { id: 3, title: 'Location', description: 'Where you live' },
  { id: 4, title: 'Photos', description: 'Upload 4 photos' },
  { id: 5, title: 'Bio', description: 'Tell us about yourself' },
]

export default function ProfileCreation() {
  const { user, fetchProfile } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [clanFamilies, setClanFamilies] = useState([])
  const [subclans, setSubclans] = useState([])

  // Form data
  const [profileData, setProfileData] = useState({
    firstName: '',
    age: '',
    gender: '',
    clanFamilyId: '',
    subclanId: '',
    locationType: '',
    locationValue: '',
    photoUrls: [],
    bio: '',
  })

  useEffect(() => {
    fetchClanFamilies()
  }, [])

  useEffect(() => {
    if (profileData.clanFamilyId) {
      fetchSubclans(profileData.clanFamilyId)
    }
  }, [profileData.clanFamilyId])

  const fetchClanFamilies = async () => {
    const { data } = await supabase
      .from('clan_families')
      .select('*')
      .order('name')
    setClanFamilies(data || [])
  }

  const fetchSubclans = async (clanFamilyId) => {
    const { data } = await supabase
      .from('subclans')
      .select('*')
      .eq('clan_family_id', clanFamilyId)
      .order('name')
    setSubclans(data || [])
  }

  const updateProfileData = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return profileData.firstName && profileData.age && profileData.gender
      case 2:
        return profileData.clanFamilyId && profileData.subclanId
      case 3:
        return profileData.locationType && profileData.locationValue
      case 4:
        return profileData.photoUrls.length === 4
      case 5:
        return true // Bio is optional
      default:
        return false
    }
  }

  const submitProfile = async () => {
    setLoading(true)
    try {
      console.log('💾 Attempting to save profile for user:', user.id)
      
      // First check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, is_profile_complete')
        .eq('user_id', user.id)
        .limit(1)
      
      if (checkError) {
        console.error('❌ Error checking existing profile:', checkError)
      }
      
      if (existingProfile && existingProfile.length > 0) {
        console.log('✅ Profile already exists and is complete! Redirecting...')
        await fetchProfile(user.id)
        return
      }

      console.log('💾 Creating new profile...')
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          first_name: profileData.firstName,
          age: parseInt(profileData.age),
          gender: profileData.gender,
          clan_family_id: profileData.clanFamilyId,
          subclan_id: profileData.subclanId,
          location_type: profileData.locationType,
          location_value: profileData.locationValue,
          photo_urls: profileData.photoUrls,
          bio: profileData.bio || null,
          is_profile_complete: true,
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          console.log('⚠️ Profile already exists, fetching existing profile...')
          await fetchProfile(user.id)
          return
        }
        throw error
      }

      console.log('✅ Profile created successfully!')
      await fetchProfile(user.id)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Error saving profile. Please try again or contact support.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              Basic Information
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={profileData.firstName}
                onChange={(e) => updateProfileData('firstName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Enter your first name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                value={profileData.age}
                onChange={(e) => updateProfileData('age', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="Enter your age"
                min="18"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <div className="grid grid-cols-2 gap-4">
                {['Male', 'Female'].map((gender) => (
                  <button
                    key={gender}
                    type="button"
                    onClick={() => updateProfileData('gender', gender)}
                    className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                      profileData.gender === gender
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {gender}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              Clan Information
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Clan Family
              </label>
              <select
                value={profileData.clanFamilyId}
                onChange={(e) => {
                  updateProfileData('clanFamilyId', e.target.value)
                  updateProfileData('subclanId', '') // Reset subclan
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="">Select clan family</option>
                {clanFamilies.map((family) => (
                  <option key={family.id} value={family.id}>
                    {family.name}
                  </option>
                ))}
              </select>
            </div>

            {profileData.clanFamilyId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subclan
                </label>
                <select
                  value={profileData.subclanId}
                  onChange={(e) => updateProfileData('subclanId', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select subclan</option>
                  {subclans.map((subclan) => (
                    <option key={subclan.id} value={subclan.id}>
                      {subclan.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              Location
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Where do you live?
              </label>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { value: 'somalia', label: 'Somalia' },
                  { value: 'diaspora', label: 'Diaspora' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      updateProfileData('locationType', option.value)
                      updateProfileData('locationValue', '') // Reset location value
                    }}
                    className={`p-3 rounded-lg border-2 font-medium transition-colors ${
                      profileData.locationType === option.value
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {profileData.locationType === 'somalia' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Somali City
                </label>
                <select
                  value={profileData.locationValue}
                  onChange={(e) => updateProfileData('locationValue', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select your city</option>
                  <option value="Mogadishu">Mogadishu</option>
                  <option value="Hargeisa">Hargeisa</option>
                  <option value="Kismayo">Kismayo</option>
                  <option value="Berbera">Berbera</option>
                  <option value="Marka">Marka</option>
                  <option value="Baidoa">Baidoa</option>
                  <option value="Galkayo">Galkayo</option>
                  <option value="Bosaso">Bosaso</option>
                  <option value="Garowe">Garowe</option>
                  <option value="Burao">Burao</option>
                  <option value="Erigavo">Erigavo</option>
                  <option value="Las Anod">Las Anod</option>
                  <option value="Beledweyne">Beledweyne</option>
                  <option value="Jowhar">Jowhar</option>
                  <option value="Afgoye">Afgoye</option>
                  <option value="Wajid">Wajid</option>
                  <option value="Luuq">Luuq</option>
                  <option value="Bardera">Bardera</option>
                  <option value="Dhusamareb">Dhusamareb</option>
                  <option value="Garbahaarrey">Garbahaarrey</option>
                </select>
              </div>
            )}

            {profileData.locationType === 'diaspora' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  value={profileData.locationValue}
                  onChange={(e) => updateProfileData('locationValue', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Select your country</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Sweden">Sweden</option>
                  <option value="Norway">Norway</option>
                  <option value="Denmark">Denmark</option>
                  <option value="Finland">Finland</option>
                  <option value="Netherlands">Netherlands</option>
                  <option value="Germany">Germany</option>
                  <option value="Italy">Italy</option>
                  <option value="France">France</option>
                  <option value="Switzerland">Switzerland</option>
                  <option value="Belgium">Belgium</option>
                  <option value="Austria">Austria</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="Qatar">Qatar</option>
                  <option value="Kuwait">Kuwait</option>
                  <option value="Turkey">Turkey</option>
                  <option value="Egypt">Egypt</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Ethiopia">Ethiopia</option>
                  <option value="Uganda">Uganda</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="South Africa">South Africa</option>
                  <option value="Malaysia">Malaysia</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            )}
          </div>
        )

      case 4:
        return <PhotoUploadStep 
          photoUrls={profileData.photoUrls}
          onPhotosUpdate={(urls) => updateProfileData('photoUrls', urls)}
          userId={user.id}
        />

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center">
              Bio (Optional)
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tell us about yourself
              </label>
              <textarea
                value={profileData.bio}
                onChange={(e) => updateProfileData('bio', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent h-32 resize-none"
                placeholder="Write a short bio about yourself..."
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">
                {profileData.bio.length}/500 characters
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Step {currentStep} of 5</span>
            <span>{Math.round((currentStep / 5) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            ></div>
          </div>
          <p className="text-center text-gray-600 mt-2">
            {steps[currentStep - 1]?.description}
          </p>
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Back
          </button>

          {currentStep < 5 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="px-6 py-2 bg-pink-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={submitProfile}
              disabled={loading}
              className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Saving...' : '✅ Complete Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}