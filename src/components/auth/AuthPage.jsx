import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { signUp, signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password)

      if (error) {
        // Check if it's an account already exists error
        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          setError('Account already exists! Please sign in instead.')
        } else {
          setError(error.message)
        }
      } else if (isSignUp) {
        setSuccess('✅ Account created! Check your email.')
        setEmail('')
        setPassword('')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp)
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center p-4">
      {/* Main Auth Container - Compact & Mobile Friendly */}
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
        {/* Header - Simple & Clean */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl text-white">💕</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            Kulanhub
          </h1>
          <p className="text-gray-500 text-sm">
            {isSignUp ? 'Ku dar account' : 'Ku soo gal'}
          </p>
        </div>

        {/* Success Message - Compact */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-700 text-sm text-center">{success}</p>
          </div>
        )}

        {/* Auth Form - Streamlined */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Email"
              required
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Password"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Error Message - Compact */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm text-center">{error}</p>
              {/* Show helpful message for existing account */}
              {error.includes('already exists') && (
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className="mt-2 w-full text-red-600 hover:text-red-700 text-sm font-medium underline"
                >
                  Click here to sign in instead
                </button>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{isSignUp ? 'Ku daraya...' : 'Ku soo galaya...'}</span>
              </div>
            ) : (
              <span>{isSignUp ? 'Ku dar Account' : 'Ku soo gal'}</span>
            )}
          </button>
        </form>

        {/* Toggle - Simple */}
        <div className="mt-5 text-center">
          <button
            onClick={toggleAuthMode}
            className="text-pink-600 hover:text-pink-700 text-sm font-medium"
          >
            {isSignUp 
              ? 'Hadda account leedahay? Ku soo gal' 
              : 'Account ma leedahay? Ku dar'
            }
          </button>
        </div>

        {/* Simple Info - Only for Sign Up */}
        {isSignUp && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-blue-700 text-xs text-center">
              Ka dib waxaad sameysaa profile-kaaga
            </p>
          </div>
        )}
      </div>
    </div>
  )
}