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

  useEffect(() => {
    let mounted = true

    // Force loading to false after 6 seconds max (backup)
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.log('⏰ BACKUP Loading timeout reached, setting loading to false')
        setLoading(false)
      }
    }, 4000)

    // Get initial session - fast and simple
    const getSession = async () => {
      try {
        console.log('Getting initial session...')
        
        // Direct session check - no timeout needed, Supabase is fast
        const { data: { session }, error } = await supabase.auth.getSession()
        
        console.log('🔍 Initial session result:', session ? `Found session for ${session.user.email}` : 'No session')
        
        if (mounted && !error) {
          setUser(session?.user ?? null)
          // Auth state change listener will handle profile fetching
          if (!session?.user) {
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
        if (mounted) {
          setUser(session?.user ?? null)
          
          if (session?.user) {
            // Only fetch profile on first auth event or if profile is null
            if (!profile && !profileFetched) {
              console.log('👋 User authenticated, fetching profile for:', session.user.email)
              await fetchProfile(session.user.id)
            } else {
              console.log('ℹ️ Profile already available or being fetched')
              setLoading(false)
            }
          } else {
            console.log('👋 User signed out, clearing state')
            setProfile(null)
            setProfileFetched(false)
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
  }, [])

  const fetchProfile = async (userId) => {
    // Prevent multiple fetches for the same user
    if (profileLoading) {
      console.log('⏳ Profile already loading, skipping...')
      return
    }

    try {
      setProfileLoading(true)
      setProfileFetched(true)
      console.log('🔍 Fetching profile for user ID:', userId)
      
      // Simplified direct query - no session verification to prevent hanging
      console.log('📡 Starting profile query...')
      
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .limit(1)

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile query timeout')), 2000)
      )

      const { data, error } = await Promise.race([profilePromise, timeoutPromise])
      
      console.log('📡 Profile query completed:', { dataLength: data?.length, error: error?.message })

      if (error) {
        if (error.message === 'Profile query timeout') {
          console.error('⏰ Profile query timed out, resetting states...')
          setProfile(null)
          setProfileFetched(false) // Allow retry
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
    try {
      // Check current session before signing out
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 Current session before signout:', session ? 'Active' : 'None')
      
      // Force clear all local state first
      setUser(null)
      setProfile(null)
      setProfileFetched(false)
      setProfileLoading(false)
      setLoading(false)
      
      // Then attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ Supabase signout error:', error)
        // Even if Supabase fails, we've cleared local state
        // This ensures user can't access protected content
      } else {
        console.log('✅ User signed out successfully from Supabase')
      }
      
      // Always return success since we've cleared local state
      return { error: null }
    } catch (err) {
      console.error('💥 Unexpected error during signout:', err)
      // Even on error, we've cleared local state
      return { error: null }
    }
  }

  const value = {
    user,
    profile,
    loading: loading || profileLoading,
    signUp,
    signIn,
    signOut,
    fetchProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}