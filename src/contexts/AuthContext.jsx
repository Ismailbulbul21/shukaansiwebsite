import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileFetched, setProfileFetched] = useState(false)
  const [fetchAttempts, setFetchAttempts] = useState(0)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    let mounted = true

    // Force loading to false after 8 seconds max (backup)
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.log('⏰ BACKUP Loading timeout reached, setting loading to false')
        setLoading(false)
      }
    }, 8000)

    // Get initial session - fast and simple
    const getSession = async () => {
      try {
        console.log('Getting initial session...')
        
        // Direct session check - no timeout needed, Supabase is fast
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('🔍 Initial session result:', session ? `Found session for ${session.user.email}` : 'No session')
        
        if (mounted && !error) {
          setUser(session?.user ?? null)
          // For initial session, fetch profile immediately if user exists
          if (session?.user && !profileFetched) {
            console.log('🚀 Initial session found, fetching profile immediately')
            await fetchProfile(session.user.id)
          } else if (!session?.user) {
            setLoading(false)
            setProfileFetched(false)
          }
        } else if (error) {
          console.error('Session error:', error)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error in getSession:', error)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    }

    getSession()

    // Listen for auth changes (simplified)
    let subscription
    try {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 Auth state changed:', event, session ? `User: ${session.user.email}` : 'No session')
        
        // If we're in the middle of signing out, ignore all auth changes
        if (isSigningOut) {
          console.log('🚫 Ignoring auth change during signout process')
          return
        }
        
        if (mounted) {
          // Handle signout events specifically
          if (event === 'SIGNED_OUT') {
            console.log('👋 User signed out, clearing all state')
            setUser(null)
            setProfile(null)
            setProfileFetched(false)
            setFetchAttempts(0)
            setLoading(false)
            setProfileLoading(false)
            return
          }
          
          // Handle signin events
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user)
            // Only fetch profile if we don't have one and haven't successfully fetched before
            if (!profile && !profileLoading && (!profileFetched || fetchAttempts === 0)) {
              console.log('👋 User authenticated, fetching profile for:', session.user.email)
              await fetchProfile(session.user.id)
            } else if (profile) {
              console.log('ℹ️ Profile already available, setting loading to false')
              setLoading(false)
            } else {
              console.log('ℹ️ Profile fetch in progress or already attempted')
            }
          } else if (event === 'INITIAL_SESSION' && session?.user) {
            setUser(session.user)
            if (!profile && !profileLoading && !profileFetched) {
              console.log('🚀 Initial session found, fetching profile immediately')
              await fetchProfile(session.user.id)
            } else if (profile) {
              console.log('ℹ️ Profile already available, setting loading to false')
              setLoading(false)
            }
          } else if (!session?.user) {
            console.log('ℹ️ No active session')
            setUser(null)
            setProfile(null)
            setProfileFetched(false)
            setFetchAttempts(0)
            setLoading(false)
          }
        }
      })
      subscription = data.subscription
    } catch (error) {
      console.error('Error setting up auth listener:', error)
      if (mounted) {
        setLoading(false)
      }
    }

    return () => {
      mounted = false
      clearTimeout(loadingTimeout)
      subscription?.unsubscribe()
    }
  }, [profile, profileLoading, profileFetched, fetchAttempts, isSigningOut])

  const fetchProfile = async (userId) => {
    // Prevent multiple fetches for the same user
    if (profileLoading) {
      console.log('⏳ Profile already loading, skipping...')
      return
    }

    const currentAttempts = fetchAttempts + 1
    setFetchAttempts(currentAttempts)

    try {
      setProfileLoading(true)
      setProfileFetched(true)
      console.log(`🔍 Fetching profile for user ID: ${userId} (Attempt ${currentAttempts}/3)`)
      
      // Simplified direct query with longer timeout
      console.log('📡 Starting profile query...')
      
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .limit(1)

      // Increased timeout to 6 seconds for better reliability
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout')), 6000)
      )

      const { data, error } = await Promise.race([profilePromise, timeoutPromise])
      
      console.log('📡 Profile query completed:', { dataLength: data?.length, error: error?.message })

      if (error) {
        if (error.message === 'Profile query timeout') {
          console.error('⏰ Profile query timed out...')
          
          // Retry logic for timeouts
          if (currentAttempts < 3) {
            console.log(`🔄 Retrying profile fetch (attempt ${currentAttempts + 1}/3)`)
            setProfileLoading(false)
            setProfileFetched(false)
            // Wait 1 second before retry
            setTimeout(() => fetchProfile(userId), 1000)
            return
          } else {
            console.error('❌ Max retry attempts reached, giving up on profile fetch')
            setProfile(null)
            setProfileFetched(false)
          }
        } else if (error.code === 'PGRST116') {
          console.log('👤 No profile found for user - needs to create profile')
          setProfile(null)
        } else {
          console.error('❌ Profile fetch error:', error)
          setProfile(null)
          setProfileFetched(false) // Reset on error to allow retry
        }
        return
      }

      if (data && data.length > 0) {
        const profile = data[0]
        console.log('✅ Profile found and loaded:', {
          name: profile.first_name,
          complete: profile.is_profile_complete,
          id: profile.id
        })
        setProfile(profile)
        console.log('🎯 Profile set, forcing loading to false')
        
        // Immediate state update  
        setLoading(false)
        setProfileLoading(false)
        console.log('⚡ Loading states set to false immediately')
      } else {
        console.log('❌ No profile data returned')
        setProfile(null)
        console.log('🎯 No profile found, forcing loading to false')
      }
    } catch (error) {
      console.error('💥 Error in fetchProfile:', error.message)
      
      // Retry logic for network errors
      if (currentAttempts < 3 && !error.message.includes('timeout')) {
        console.log(`🔄 Retrying profile fetch due to error (attempt ${currentAttempts + 1}/3)`)
        setProfileLoading(false)
        setProfileFetched(false)
        setTimeout(() => fetchProfile(userId), 1000)
        return
      }
      
      setProfile(null)
      setProfileFetched(false) // Reset on error to allow retry
    } finally {
      setProfileLoading(false)
      setLoading(false)
      console.log('🏁 Profile fetch completed, loading set to false')
    }
  }

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signOut = async () => {
    console.log('🚪 Signing out user...')
    setIsSigningOut(true) // Set flag to prevent re-authentication
    
    try {
      // Check current session before signing out
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 Current session before signout:', session ? 'Active' : 'None')
      
      // Set flags to prevent automatic re-authentication
      setProfileFetched(true) // Prevent profile fetching
      setLoading(false)
      setProfileLoading(false)
      
      // Force clear all local state first
      setUser(null)
      setProfile(null)
      setProfileLoading(false)
      setFetchAttempts(0)
      
      // Clear any stored tokens or session data
      try {
        localStorage.removeItem('supabase.auth.token')
        sessionStorage.removeItem('supabase.auth.token')
        // Clear any other potential auth-related storage
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key)
          }
        })
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            sessionStorage.removeItem(key)
          }
        })
      } catch (e) {
        console.log('ℹ️ Storage clearing note:', e.message)
      }
      
      // Small delay to ensure state is cleared before Supabase signout
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Then attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Supabase signout error:', error)
        // Even if Supabase fails, we've cleared local state
        // This ensures user can't access protected content
      } else {
        console.log('✅ User signed out successfully from Supabase')
      }
      
      // Additional delay to ensure all auth state changes are processed
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Reset the signout flag
      setIsSigningOut(false)
      
      // Always return success since we've cleared local state
      return { error: null }
    } catch (err) {
      console.error('💥 Unexpected error during signout:', err)
      // Reset the signout flag even on error
      setIsSigningOut(false)
      // Even on error, we've cleared local state
      return { error: null }
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      console.log('🔄 Manual profile refresh requested')
      setProfile(null)
      setProfileFetched(false)
      setFetchAttempts(0)
      await fetchProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading: loading || profileLoading,
    isSigningOut,
    signUp,
    signIn,
    signOut,
    fetchProfile,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}