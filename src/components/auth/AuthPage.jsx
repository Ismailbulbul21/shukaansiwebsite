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
        const { error: signUpError } = await signUp(email, password)
        
        if (signUpError) {
          if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
            setError('Account already exists! Please sign in instead.')
          } else {
            setError(signUpError.message)
          }
                 } else {
           setSuccess('✅ Account created successfully! Please check your email to confirm your account.')
           setEmail('')
           setPassword('')
           
           // Switch to login mode after successful signup
           setTimeout(() => {
             setIsSignUp(false)
             setSuccess('')
           }, 3000)
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
      {/* Modern Auth Container */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md w-full border border-pink-100">
        {/* Header with Bilingual Text */}
        <div className="text-center mb-8">
          {/* Logo/Icon */}
          <div className="w-20 h-20 mx-auto mb-4 shadow-lg">
            <img 
              src="/ChatGPT Image Aug 21, 2025, 07_58_55 PM.png" 
              alt="Kulanhub Logo" 
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
          
          {/* App Name */}
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
            Kulanhub
          </h1>
          
          {/* Bilingual Subtitle */}
          <div className="space-y-1">
            <p className="text-gray-700 font-medium text-lg">
              {isSignUp ? 'Create Account' : 'Login'}
            </p>
            <p className="text-gray-500 text-sm">
              {isSignUp ? 'Account sameeso' : 'Accountkaaga ku soo gal'}
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
              <p className="text-green-700 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Modern Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 bg-white/50 backdrop-blur-sm"
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
                className="w-full px-4 py-3.5 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all duration-200 bg-white/50 backdrop-blur-sm"
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

          {/* Error Message */}
          {error && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{isSignUp ? 'Creating Account...' : 'Signing In...'}</span>
              </div>
            ) : (
              <span>{isSignUp ? 'Create Account' : 'Login'}</span>
            )}
          </button>
        </form>

        {/* Toggle Button - Bilingual */}
        <div className="mt-6 text-center">
          <button
            onClick={toggleAuthMode}
            className="text-pink-600 hover:text-pink-700 text-sm font-medium transition-colors duration-200"
          >
            <div className="space-y-1">
              <p className="font-medium">
                {isSignUp 
                  ? 'Already have an account? Login' 
                  : "Don't have an account? Create Account"
                }
              </p>
              <p className="text-xs text-gray-500">
                {isSignUp 
                  ? 'Account leedahay? Ku soo gal' 
                  : 'Account ma leedahay? Account sameeso'
                }
              </p>
            </div>
          </button>
        </div>

                 {/* Info Box for Sign Up */}
         {isSignUp && (
           <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
             <div className="flex items-center space-x-2">
               <span className="text-blue-500">💡</span>
               <p className="text-blue-700 text-sm text-center">
                 After creating your account, check your email to confirm, then come back to sign in!
               </p>
             </div>
           </div>
         )}
      </div>
    </div>
  )
}