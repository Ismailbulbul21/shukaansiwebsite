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
      if (isSignUp) {
        // Sign up flow
        const { data, error: signUpError } = await signUp(email, password)
        
        if (signUpError) {
          if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
            setError('Account already exists! Please sign in instead.')
          } else {
            setError(signUpError.message)
          }
        } else {
          // 🚀 NEW: Auto-sign-in after successful signup
          setSuccess('✅ Account created successfully! Signing you in...')
          
          // Wait a moment for the account to be fully created
          setTimeout(async () => {
            try {
              // Automatically sign in the user
              const { error: signInError } = await signIn(email, password)
              
              if (signInError) {
                // If auto-sign-in fails, show manual sign-in option
                setError('Account created! Please sign in manually.')
                setIsSignUp(false)
              } else {
                // Success! User is now signed in
                setSuccess('🎉 Welcome to Kulanhub!')
                // User will automatically go to profile creation via App.jsx routing
              }
            } catch (autoSignInError) {
              setError('Account created! Please sign in manually.')
              setIsSignUp(false)
            }
          }, 1500) // 1.5 second delay for account creation
          
          // Clear form
          setEmail('')
          setPassword('')
        }
      } else {
        // Sign in flow
        const { error: signInError } = await signIn(email, password)
        
        if (signInError) {
          setError(signInError.message)
        }
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center p-4">
      {/* Modern Auth Container - Smaller and More Compact */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 max-w-sm w-full border border-pink-100">
        {/* Header with Bilingual Text - More Compact */}
        <div className="text-center mb-6">
          {/* Logo/Icon - Smaller */}
          <div className="w-16 h-16 mx-auto mb-3 shadow-lg">
            <img 
              src="/ChatGPT Image Aug 21, 2025, 07_58_55 PM.png" 
              alt="Kulanhub Logo" 
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          
          {/* App Name - Smaller */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
            Kulanhub
          </h1>
          
          {/* Bilingual Subtitle - Better Layout */}
          <div className="space-y-1">
            <p className="text-gray-800 font-semibold text-base">
              {isSignUp ? 'Create Account' : 'Login'}
            </p>
            <p className="text-gray-600 text-sm font-medium">
              {isSignUp ? 'Account sameeso' : 'Ku soo gal'}
            </p>
          </div>
        </div>

        {/* Success Message - More Compact */}
        {success && (
          <div className="mb-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-green-700 font-medium text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Modern Auth Form - More Compact Spacing */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                placeholder="Enter your email"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-400">📧</span>
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 bg-white/70 backdrop-blur-sm"
                placeholder="Enter your password"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-pink-500 transition-colors duration-200"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Error Message - More Compact */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              {/* Helpful action for existing account error */}
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

          {/* Submit Button - Modern Button Design */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] border-0 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 min-h-[60px] flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-sm">
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </span>
              </div>
            ) : (
              <span className="text-sm font-semibold">
                {isSignUp ? 'Create Account' : 'Login'}
              </span>
            )}
          </button>
        </form>

        {/* Toggle Button - Bilingual with Smaller Sizing and Width */}
        <div className="mt-4 text-center">
          {isSignUp ? (
            // Show Login button when in Create Account mode
            <button
              onClick={toggleAuthMode}
              className="w-48 mx-auto bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 min-h-[48px] flex items-center justify-center"
            >
              <div className="text-center">
                <p className="font-medium text-sm">
                  Login
                </p>
                <p className="text-xs text-blue-100">
                  Ku soo gal
                </p>
              </div>
            </button>
          ) : (
            // Show Create Account button when in Login mode
            <button
              onClick={toggleAuthMode}
              className="w-48 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] border-0 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 min-h-[48px] flex items-center justify-center"
            >
              <div className="text-center">
                <p className="text-sm">
                  Create Account
                </p>
                <p className="text-xs text-green-100">
                  Account sameeso
                </p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}