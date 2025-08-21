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
  const [realTimeSubscription, setRealTimeSubscription] = useState(null)

  const otherUser = match.user1_id === profile.id ? match.user2_profile : match.user1_profile

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Set up real-time subscription for new messages
  const setupRealTimeSubscription = async (chatRoomId) => {
    if (!chatRoomId) return

    console.log('🔌 Setting up real-time subscription for chat room:', chatRoomId)
    
    try {
      // Subscribe to new messages in this chat room
      const subscription = supabase
        .channel(`chat:${chatRoomId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `chat_room_id=eq.${chatRoomId}`
          },
          (payload) => {
            console.log('📨 Real-time message received:', payload)
            
            // Add new message to local state
            setMessages(prev => {
              // Check if message already exists to avoid duplicates
              const exists = prev.some(msg => msg.id === payload.new.id)
              if (!exists) {
                return [...prev, payload.new]
              }
              return prev
            })
            
            // Scroll to bottom for new messages
            setTimeout(scrollToBottom, 100)
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
                msg.id === payload.new.id ? payload.new : msg
              )
            )
          }
        )
        .subscribe((status) => {
          console.log('🔌 Real-time subscription status:', status)
        })

      setRealTimeSubscription(subscription)
      console.log('✅ Real-time subscription established')
      
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
      setTimeout(scrollToBottom, 100)

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
        // Add to local messages (real-time will also add it, but this ensures immediate UI update)
        console.log('✅ Message sent successfully!')
        setMessages(prev => [...prev, data[0]])
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col">
      {/* Chat Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex items-center space-x-3">
        <button
          onClick={onBack}
          className="text-pink-500 hover:text-pink-600 font-medium"
        >
          ← Back
        </button>
        
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
          <img
            src={otherUser?.photo_urls?.[0] || 'https://via.placeholder.com/40x40?text=?'}
            alt={`${otherUser?.first_name}'s photo`}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div>
          <h2 className="font-semibold text-gray-800">
            {otherUser?.first_name}
          </h2>
          <div className="text-sm text-gray-600">
            <p>📍 {otherUser?.location_value}</p>
            {(otherUser?.clan_family?.name || otherUser?.subclan?.name) && (
              <p>🏛️ {otherUser.clan_family?.name}{otherUser.subclan?.name ? ` - ${otherUser.subclan.name}` : ''}</p>
            )}
          </div>
        </div>
        

      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center mt-16">
            <p className="text-gray-600 mb-4">
              🎉 You matched with {otherUser?.first_name}!
            </p>
            <p className="text-gray-500 text-sm">
              Start the conversation with a friendly hello.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === profile.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender_id === profile.id
                    ? 'bg-pink-500 text-white'
                    : 'bg-white text-gray-800 shadow-sm'
                }`}
              >
                <p className="break-words">{message.content || message.message_text}</p>
                <p
                  className={`text-xs mt-1 ${
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

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={sendMessage} className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${otherUser?.first_name}...`}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-3 bg-pink-500 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? '⏳' : '💬'}
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
      setMatches(validMatches)

      // Set up global real-time subscription after fetching matches
      if (validMatches.length > 0) {
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

  // If viewing a specific chat
  if (selectedMatch) {
    return (
      <ChatInterface 
        match={selectedMatch} 
        onBack={() => setSelectedMatch(null)} 
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
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-3 flex justify-between items-center">
        <button
          onClick={onBackToDiscovery}
          className="text-pink-500 hover:text-pink-600 font-medium"
        >
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-800">
          Messages 💬
        </h1>
        <div className="w-12"></div> {/* Spacer */}
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-600 text-center">{error}</p>
            <button
              onClick={fetchMatches}
              className="mt-2 w-full bg-red-500 text-white py-2 rounded-lg"
            >
              Try Again
            </button>
          </div>
        )}

        {matches.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 px-2">
              Your Matches ({matches.length})
            </h2>
            
            {matches.map((match) => {
              const otherUser = match.user1_id === profile.id ? match.user2_profile : match.user1_profile
              
              return (
                <div
                  key={match.id}
                  onClick={() => setSelectedMatch(match)}
                  className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    {/* Profile Photo */}
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                      <img
                        src={otherUser?.photo_urls?.[0] || 'https://via.placeholder.com/64x64?text=?'}
                        alt={`${otherUser?.first_name}'s photo`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">
                        {otherUser?.first_name}, {otherUser?.age}
                      </h3>
                      <p className="text-sm text-gray-600">
                        📍 {otherUser?.location_value}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Matched {new Date(match.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    {/* Chat indicator with new message notification */}
                    <div className="flex flex-col items-center space-y-1">
                      <div className="text-gray-400">💬</div>
                      {match.hasNewMessage && (
                        <div className="w-3 h-3 bg-red-500 rounded-full" title="New message"></div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center mt-16">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                No matches yet 💔
              </h2>
              <p className="text-gray-600 mb-6">
                When you both say "Heelo" to each other, you'll be able to chat here!
              </p>
              <button
                onClick={onBackToDiscovery}
                className="bg-pink-500 text-white px-6 py-3 rounded-lg font-medium"
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