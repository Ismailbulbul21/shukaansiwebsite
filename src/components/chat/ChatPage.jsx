import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

// Individual Chat Component
function ChatInterface({ match, onBack }) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const formRef = useRef(null)
  const [realTimeSubscription, setRealTimeSubscription] = useState(null)

  const otherUser = match.user1_id === profile.id ? match.user2_profile : match.user1_profile

  // Scroll to bottom of messages
  const scrollToBottom = (immediate = false) => {
    // Try scrolling the messages container directly
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      
      // Scroll to the very bottom
      container.scrollTo({
        top: container.scrollHeight,
        behavior: immediate ? 'instant' : 'smooth'
      })
    }
    
    // Backup: scroll to the end element (more reliable for some browsers)
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: immediate ? 'instant' : 'smooth',
        block: 'end',
        inline: 'nearest'
      })
    }
  }

  // Set up real-time subscription for new messages
  const setupRealTimeSubscription = async (chatRoomId) => {
    if (!chatRoomId) return

    console.log('🔌 Setting up real-time subscription for chat room:', chatRoomId)
    
    try {
      // Subscribe to new messages in this chat room with immediate handling
      const subscription = supabase
        .channel(`chat-room-${chatRoomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_room_id=eq.${chatRoomId}`
          },
          async (payload) => {
            console.log('📨 Real-time message received:', payload)
            
            // Get sender profile info for proper display
            let senderProfile = null
            if (payload.new.sender_id === profile.id) {
              senderProfile = {
                id: profile.id,
                first_name: profile.first_name,
                user_id: profile.user_id
              }
            } else {
              // Fetch other user's profile for display
              try {
                const { data: senderData } = await supabase
                  .from('user_profiles')
                  .select('id, first_name, user_id')
                  .eq('id', payload.new.sender_id)
                  .single()
                
                senderProfile = senderData
              } catch (error) {
                console.error('Error fetching sender profile:', error)
              }
            }
            
            // Add new message to local state immediately
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some(msg => msg.id === payload.new.id)
              if (!exists) {
                const messageWithProfile = {
                  ...payload.new,
                  sender_profile: senderProfile
                }
                console.log('✅ Adding real-time message to chat:', messageWithProfile)
                return [...prev, messageWithProfile]
              }
              return prev
            })
            
            // Scroll to bottom for new messages immediately
            setTimeout(scrollToBottom, 50)
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `chat_room_id=eq.${chatRoomId}`
          },
          (payload) => {
            console.log('📝 Real-time message updated:', payload)
            
            // Update existing message in local state
            setMessages(prev => 
              prev.map(msg => 
                msg.id === payload.new.id ? { ...payload.new, sender_profile: msg.sender_profile } : msg
              )
            )
          }
        )
        .subscribe((status) => {
          console.log('🔌 Real-time subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time chat subscription established successfully')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Real-time chat subscription failed')
          } else if (status === 'TIMED_OUT') {
            console.error('❌ Real-time chat subscription timed out')
          }
        })

      setRealTimeSubscription(subscription)
      
    } catch (error) {
      console.error('❌ Error setting up real-time subscription:', error)
    }
  }

  // Clean up real-time subscription
  const cleanupRealTimeSubscription = () => {
    if (realTimeSubscription) {
      console.log('🔌 Cleaning up real-time subscription')
      supabase.removeChannel(realTimeSubscription)
      setRealTimeSubscription(null)
    }
  }

  // Fetch chat messages
  const fetchMessages = async () => {
    try {
      setLoading(true)
      
      // First ensure chat room exists
      let { data: chatRooms, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('match_id', match.id)
        .limit(1)

      let chatRoom = null
      if (chatRooms && chatRooms.length > 0) {
        chatRoom = chatRooms[0]
      } else {
        // Create chat room if it doesn't exist
        console.log('🏠 Creating chat room for match:', match.id)
        const { data: newRooms, error: createError } = await supabase
          .from('chat_rooms')
          .insert({
            match_id: match.id
          })
          .select()
          .limit(1)

        if (createError) {
          console.error('❌ Error creating chat room:', createError)
          throw createError
        }
        
        if (newRooms && newRooms.length > 0) {
          chatRoom = newRooms[0]
          console.log('✅ Chat room created:', chatRoom.id)
        } else {
          throw new Error('Failed to create chat room')
        }
      }

      // Now fetch messages for this chat room
      console.log('📥 Fetching messages for chat room:', chatRoom.id)
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select(`
          *,
          sender_profile:user_profiles!sender_id(
            id,
            first_name,
            user_id
          )
        `)
        .eq('chat_room_id', chatRoom.id)
        .order('created_at', { ascending: true })

      if (messageError) throw messageError

      setMessages(messageData || [])
      console.log('📥 Messages loaded:', messageData?.length || 0)
      
      // Enhanced scroll to bottom when messages load
      requestAnimationFrame(() => {
        // Multiple scroll attempts with increasing delays
        setTimeout(() => scrollToBottom(true), 50)    // Quick immediate
        setTimeout(() => scrollToBottom(true), 150)   // Second immediate
        setTimeout(() => scrollToBottom(false), 300)  // Smooth
        setTimeout(() => scrollToBottom(false), 600)  // Final backup
      })

      // Mark messages as read when user opens chat
      if (messageData && messageData.length > 0) {
        const unreadMessageIds = messageData
          .filter(msg => !msg.is_read && msg.sender_id !== profile.id)
          .map(msg => msg.id)
        
        if (unreadMessageIds.length > 0) {
          console.log('📖 Marking', unreadMessageIds.length, 'messages as read')
          try {
            const { data, error } = await supabase
              .from('messages')
              .update({ is_read: true })
              .in('id', unreadMessageIds)
              .select()
            
            if (error) {
              console.error('❌ Error marking messages as read:', error)
            } else {
              console.log('✅ Messages marked as read successfully:', data?.length || 0, 'updated')
            }
          } catch (error) {
            console.error('❌ Exception marking messages as read:', error)
          }
        }
      }

      // Set up real-time subscription AFTER fetching messages
      await setupRealTimeSubscription(chatRoom.id)
      
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Send a message
  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      // Get or create chat room
      let { data: chatRooms, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('match_id', match.id)
        .limit(1)

      let chatRoom = null
      if (chatRooms && chatRooms.length > 0) {
        chatRoom = chatRooms[0]
      } else {
        console.log('🏠 Creating chat room for sending message...')
        const { data: newRooms, error: createError } = await supabase
          .from('chat_rooms')
          .insert({
            match_id: match.id
          })
          .select()
          .limit(1)

        if (createError) {
          console.error('❌ Error creating chat room for message:', createError)
          throw createError
        }
        
        if (newRooms && newRooms.length > 0) {
          chatRoom = newRooms[0]
          console.log('✅ Chat room created for messaging:', chatRoom.id)
        } else {
          throw new Error('Failed to create chat room for message')
        }
      }

      // Send message
      console.log('💬 Sending message to chat room:', chatRoom.id)
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: chatRoom.id,
          sender_id: profile.id,
          content: newMessage.trim(),
          message_type: 'text'
        })
        .select()
        .limit(1)

      if (error) {
        console.error('❌ Error sending message:', error)
        throw error
      }

      if (data && data.length > 0) {
        // Add to local messages immediately for instant UI feedback
        console.log('✅ Message sent successfully!')
        const messageWithProfile = {
          ...data[0],
          sender_profile: {
            id: profile.id,
            first_name: profile.first_name,
            user_id: profile.user_id
          }
        }
        
        // Update messages immediately for instant feedback
        setMessages(prev => {
          // Check for duplicates before adding
          const exists = prev.some(msg => msg.id === data[0].id)
          if (!exists) {
            console.log('✅ Adding sent message to chat immediately')
            return [...prev, messageWithProfile]
          }
          return prev
        })
        
        // Update chat room last message timestamp
        if (chatRoom) {
          supabase
            .from('chat_rooms')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', chatRoom.id)
            .then(() => console.log('✅ Chat room timestamp updated'))
            .catch(err => console.error('❌ Error updating chat room timestamp:', err))
        }
      }
      setNewMessage('')
      setTimeout(scrollToBottom, 100)
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    
    // Cleanup function to remove real-time subscription
    return () => {
      cleanupRealTimeSubscription()
    }
  }, [match.id])

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      // Multiple scroll attempts for better reliability
      requestAnimationFrame(() => {
        setTimeout(() => scrollToBottom(true), 50)    // Immediate
        setTimeout(() => scrollToBottom(false), 200)  // Smooth
        setTimeout(() => scrollToBottom(false), 500)  // Final backup
      })
    }
  }, [messages.length])

  // Scroll to bottom when component mounts (when chat opens)
  useEffect(() => {
    const scrollOnMount = () => {
      requestAnimationFrame(() => {
        setTimeout(() => scrollToBottom(true), 100)
        setTimeout(() => scrollToBottom(false), 300)
      })
    }
    
    scrollOnMount()
  }, []) // Empty dependency - runs once when component mounts

  // Format message time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col overflow-hidden">
      {/* Sticky Chat Header - Mobile Optimized */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-lg border-b border-pink-100 px-3 sm:px-4 py-3 flex items-center space-x-3">
        <button
          onClick={onBack}
          className="flex-shrink-0 p-2 text-pink-500 hover:text-pink-600 font-medium rounded-full hover:bg-pink-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-pink-200">
          <img
            src={otherUser?.photo_urls?.[0] || 'https://via.placeholder.com/40x40?text=?'}
            alt={`${otherUser?.first_name}'s photo`}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-800 text-base truncate">
            {otherUser?.first_name}
          </h2>
          <div className="text-xs sm:text-sm text-gray-600 truncate">
            <p className="truncate">📍 {otherUser?.location_value}</p>
            {(otherUser?.clan_family?.name || otherUser?.subclan?.name) && (
              <p className="truncate">🏛️ {otherUser.clan_family?.name}{otherUser.subclan?.name ? ` - ${otherUser.subclan.name}` : ''}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Container - Mobile Optimized */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-3 sm:px-4 py-2 space-y-3 pb-4">
        {messages.length === 0 ? (
          <div className="text-center mt-16 px-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-gray-700 font-medium mb-2">
                You matched with {otherUser?.first_name}!
              </p>
              <p className="text-gray-500 text-sm">
                Start the conversation with a friendly hello.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === profile.id ? 'justify-end' : 'justify-start'} px-2 message-enter`}
            >
              <div
                className={`max-w-[75%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl shadow-sm ${
                  message.sender_id === profile.id
                    ? 'bg-gradient-to-br from-pink-500 to-rose-500 text-white'
                    : 'bg-white text-gray-800 border border-gray-100'
                }`}
              >
                <p className="break-words text-sm sm:text-base leading-relaxed">
                  {message.content || message.message_text}
                </p>
                <p
                  className={`text-xs mt-2 opacity-80 ${
                    message.sender_id === profile.id 
                      ? 'text-pink-100' 
                      : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Mobile Optimized & Always Visible */}
      <div ref={formRef} className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-2 sm:p-3 md:p-4 pb-safe">
        <form onSubmit={sendMessage} className="flex items-center space-x-2 max-w-full">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${otherUser?.first_name}...`}
              className="w-full px-3 py-2.5 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 text-sm sm:text-base min-w-0"
              disabled={sending}
              maxLength={500}
            />
            {newMessage.trim() && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                {newMessage.length}/500
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 touch-manipulation"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ChatPage({ onBackToDiscovery, refreshTrigger }) {
  const { user, profile } = useAuth()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [error, setError] = useState('')
  const [realTimeSubscription, setRealTimeSubscription] = useState(null)
  const [shouldRefreshMatches, setShouldRefreshMatches] = useState(false)

  // Truncate message to 2 sentences or reasonable length
  const truncateMessage = (message) => {
    if (!message) return ''
    
    // Split by periods to get sentences
    const sentences = message.split('.').filter(s => s.trim().length > 0)
    
    // Take first 2 sentences
    let preview = sentences.slice(0, 2).join('. ')
    
    // If we have more than 2 sentences, add period and ellipsis
    if (sentences.length > 2) {
      preview += '...'
    } else if (sentences.length > 0 && !preview.endsWith('.')) {
      preview += '.'
    }
    
    // Also limit by character count (max 80 chars)
    if (preview.length > 80) {
      preview = preview.substring(0, 77) + '...'
    }
    
    return preview
  }

  // Debug: Log profile information
  useEffect(() => {
    if (profile) {
      console.log('👤 ChatPage - Profile loaded:', {
        profileId: profile.id,
        profileName: profile.first_name,
        userId: profile.user_id,
        isProfileValid: !!profile.id
      })
    }
  }, [profile])

  // Set up real-time subscription for new matches and message notifications
  const setupGlobalRealTimeSubscription = async () => {
    if (!profile?.id) return

    console.log('🔌 Setting up global real-time subscription for profile:', profile.id)
    
    try {
      // Subscribe to new matches
      const subscription = supabase
        .channel(`user:${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'matches',
            filter: `user1_id=eq.${profile.id},user2_id=eq.${profile.id}`
          },
          (payload) => {
            console.log('💕 New match created:', payload)
            // Refresh matches list
            fetchMatches()
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_room_id.in.(${matches.map(m => m.id).join(',')})`
          },
          (payload) => {
            console.log('📨 New message in any chat:', payload)
            // Update match list to show new message indicator
            setMatches(prev => 
              prev.map(match => {
                // Find which match this message belongs to
                if (match.chat_room_id === payload.new.chat_room_id) {
                  return { ...match, hasNewMessage: true }
                }
                return match
              })
            )
          }
        )
        .subscribe((status) => {
          console.log('🔌 Global real-time subscription status:', status)
        })

      setRealTimeSubscription(subscription)
      console.log('✅ Global real-time subscription established')
      
    } catch (error) {
      console.error('❌ Error setting up global real-time subscription:', error)
    }
  }

  // Clean up global real-time subscription
  const cleanupGlobalRealTimeSubscription = () => {
    if (realTimeSubscription) {
      console.log('🔌 Cleaning up global real-time subscription')
      supabase.removeChannel(realTimeSubscription)
      setRealTimeSubscription(null)
    }
  }

  // Fetch user matches
  const fetchMatches = async () => {
    if (!profile || !profile.id) {
      console.log('❌ Profile not loaded or invalid, skipping matches fetch')
      console.log('❌ Profile state:', { profile: !!profile, profileId: profile?.id })
      return
    }
    
    try {
      setLoading(true)
      setError('')

      console.log('🔍 Fetching matches for profile ID:', profile.id)
      console.log('🔍 Profile details:', { id: profile.id, name: profile.first_name, user_id: profile.user_id })
      console.log('🔍 Refresh trigger value:', refreshTrigger)
      
      // Validate profile ID format (should be a valid UUID)
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id)) {
        console.error('❌ Invalid profile ID format:', profile.id)
        setError('Invalid profile ID format')
        return
      }

      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1_profile:user_profiles!user1_id(
            *,
            clan_family:clan_families(name),
            subclan:subclans(name)
          ),
          user2_profile:user_profiles!user2_id(
            *,
            clan_family:clan_families(name),
            subclan:subclans(name)
          )
        `)
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching matches:', error)
        throw error
      }

      console.log('📋 Matches fetched:', data?.length || 0)
      console.log('📋 Raw matches data:', data)
      
      // Debug: Log each match to see what's being displayed
      if (data && data.length > 0) {
        data.forEach((match, index) => {
          const otherUser = match.user1_id === profile.id ? match.user2_profile : match.user1_profile
          console.log(`📋 Match ${index + 1}:`, {
            matchId: match.id,
            user1Id: match.user1_id,
            user2Id: match.user2_id,
            currentUserId: profile.id,
            otherUserName: otherUser?.first_name,
            otherUserId: otherUser?.id,
            isCurrentUserInMatch: match.user1_id === profile.id || match.user2_id === profile.id
          })
        })
      }
      
      // Filter matches to ensure only valid ones are shown
      const validMatches = data?.filter(match => {
        const isValid = match.user1_id === profile.id || match.user2_id === profile.id
        if (!isValid) {
          console.warn('⚠️ Invalid match filtered out:', {
            matchId: match.id,
            user1Id: match.user1_id,
            user2Id: match.user2_id,
            currentUserId: profile.id
          })
        }
        return isValid
      }) || []
      
      console.log('✅ Valid matches after filtering:', validMatches.length)
      
      // Fetch latest message and unread count for each match
      const matchesWithMessages = await Promise.all(
        validMatches.map(async (match) => {
          try {
            // First get the chat room for this match
            const { data: chatRoom } = await supabase
              .from('chat_rooms')
              .select('id')
              .eq('match_id', match.id)
              .single()

            if (!chatRoom) {
              return { ...match, latestMessage: null, unreadCount: 0 }
            }

            // Get latest message
            const { data: latestMsg } = await supabase
              .from('messages')
              .select('content, created_at, sender_id')
              .eq('chat_room_id', chatRoom.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            // Get unread count (messages from other user that are unread)
            const otherUserId = match.user1_id === profile.id ? match.user2_profile?.id : match.user1_profile?.id
            const { count: unreadCount } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_room_id', chatRoom.id)
              .eq('sender_id', otherUserId)
              .eq('is_read', false)

            return {
              ...match,
              latestMessage: latestMsg,
              unreadCount: unreadCount || 0,
              chatRoomId: chatRoom.id
            }
          } catch (error) {
            console.error('Error fetching message data for match:', match.id, error)
            return { ...match, latestMessage: null, unreadCount: 0 }
          }
        })
      )

      // Sort matches by latest message time (most recent first)
      const sortedMatches = matchesWithMessages.sort((a, b) => {
        const aTime = a.latestMessage ? new Date(a.latestMessage.created_at) : new Date(a.created_at)
        const bTime = b.latestMessage ? new Date(b.latestMessage.created_at) : new Date(b.created_at)
        return bTime - aTime // Most recent first
      })

      setMatches(sortedMatches)

      // Set up global real-time subscription after fetching matches
      if (matchesWithMessages.length > 0) {
        await setupGlobalRealTimeSubscription()
      }
      
    } catch (error) {
      console.error('Error fetching matches:', error)
      setError('Failed to load your matches. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profile) {
      fetchMatches()
    }
    
    // Cleanup function
    return () => {
      cleanupGlobalRealTimeSubscription()
    }
  }, [profile])

  // Refresh matches when refreshTrigger changes (when coming from notifications)
  useEffect(() => {
    console.log('🔄 Refresh trigger useEffect - refreshTrigger:', refreshTrigger, 'profile:', !!profile)
    if (refreshTrigger && profile) {
      console.log('🔄 Refresh trigger activated, refreshing matches...')
      fetchMatches()
    }
  }, [refreshTrigger, profile])

  // Refresh matches when returning from specific chat (if messages were read)
  useEffect(() => {
    if (shouldRefreshMatches && !selectedMatch && profile?.id) {
      console.log('🔄 Refreshing matches after reading messages...')
      fetchMatches()
      setShouldRefreshMatches(false)
    }
  }, [shouldRefreshMatches, selectedMatch, profile?.id])

  // If viewing a specific chat
  if (selectedMatch) {
    return (
      <ChatInterface 
        match={selectedMatch} 
        onBack={() => {
          setSelectedMatch(null)
          setShouldRefreshMatches(true) // Refresh matches when returning from chat
        }} 
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your matches...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100">
      {/* Sticky Header - Mobile Optimized */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-lg border-b border-pink-100 px-3 sm:px-4 py-3 flex justify-between items-center">
        <button
          onClick={onBackToDiscovery}
          className="flex-shrink-0 p-2 text-pink-500 hover:text-pink-600 font-medium rounded-full hover:bg-pink-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
          Messages 💬
        </h1>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      {/* Content - Mobile Optimized */}
      <div className="px-3 sm:px-4 py-3 pb-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-center text-sm">{error}</p>
            <button
              onClick={fetchMatches}
              className="mt-3 w-full bg-red-500 text-white py-2 rounded-lg text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {matches.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 px-2 mb-2">
              Your Matches ({matches.length})
            </h2>
            
            {matches.map((match) => {
              const otherUser = match.user1_id === profile.id ? match.user2_profile : match.user1_profile
              
              return (
                <div
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className="bg-white rounded-xl shadow-md p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-all duration-200 active:scale-95"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    {/* Profile Photo */}
                    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-200 border-2 border-pink-200">
                      <img
                        src={otherUser?.photo_urls?.[0] || 'https://via.placeholder.com/64x64?text=?'}
                        alt={`${otherUser?.first_name}'s photo`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm sm:text-base truncate ${
                        match.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'
                      }`}>
                        {otherUser?.first_name}, {otherUser?.age}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">
                        📍 {otherUser?.location_value}
                      </p>
                      
                      {/* Show latest message preview if available */}
                      {match.latestMessage ? (
                        <div className="mt-1">
                          <p className={`text-xs sm:text-sm ${
                            match.unreadCount > 0 ? 'font-semibold text-gray-800' : 'text-gray-500'
                          }`}>
                            {match.latestMessage.sender_id === profile.id ? 'You: ' : ''}
                            {truncateMessage(match.latestMessage.content)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(match.latestMessage.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 mt-1">
                          Matched {new Date(match.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      )}
                    </div>

                    {/* Chat indicator with new message notification */}
                    <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                      <div className="text-gray-400 text-lg">💬</div>
                      {match.unreadCount > 0 && (
                        <div className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium animate-pulse" title={`${match.unreadCount} unread messages`}>
                          {match.unreadCount > 9 ? '9+' : match.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center mt-16 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-sm mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
                No matches yet 💔
              </h2>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                When you both say "Heelo" to each other, you'll be able to chat here!
              </p>
              <button
                onClick={onBackToDiscovery}
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Find Matches
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}