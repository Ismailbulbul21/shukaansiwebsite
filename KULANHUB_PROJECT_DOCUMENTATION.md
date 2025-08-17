# Kulanhub - Somali Dating App 💕

## 🎯 Project Overview

**Kulanhub** is a Tinder-style dating app specifically designed for the Somali community, featuring cultural elements like clan systems and location preferences (Somalia vs diaspora). The app uses React.js, Tailwind CSS, and Supabase with a mobile-first design approach.

---

## 📊 Current Status: **PARTIALLY COMPLETE**

### ✅ **COMPLETED FEATURES**

#### 🔐 **Authentication System**
- **Sign up/Sign in** with email and password
- **Supabase authentication** integration
- **Session management** with AuthContext
- **Loading states** and error handling
- **Recent fix**: Resolved infinite loading issue with timeout mechanisms

#### 👤 **Profile Creation (5-Step Flow)**
- **Step 1**: Basic Info (name, age, gender)
- **Step 2**: Clan Selection (family → subclan dropdown system)
- **Step 3**: Location (Somalia cities vs diaspora countries with pre-filled dropdowns)
- **Step 4**: Photo Upload (exactly 4 photos required, Supabase storage integration)
- **Step 5**: Bio (optional)
- **Progress indicators** and validation
- **Mobile-first design** with large touch targets

#### 🗄️ **Database Structure (Supabase)**
- **Complete clan hierarchy**: 4 main families, 18 subclans
- **User profiles** with clan, location, photos, bio
- **Matching system**: hellos, matches, notifications
- **Chat system**: rooms and messages (text + voice)
- **Storage buckets**: profile photos and voice messages
- **Row Level Security (RLS)** policies
- **Helper functions** for discovery

#### 🎨 **UI/UX**
- **Tailwind CSS v3** properly configured
- **Mobile-first responsive design**
- **Beautiful gradient backgrounds**
- **Modern card layouts**
- **Loading spinners and progress bars**
- **Error handling with user-friendly messages**

---

## 🏗️ **Technical Architecture**

### **Frontend Stack**
```
React 19.1.1 + Vite 7.1.2
Tailwind CSS v3.4.17
Supabase JavaScript Client
```

### **Backend (Supabase)**
```
Project ID: numuheaxmywbzkocpbik
URL: https://numuheaxmywbzkocpbik.supabase.co
Database: PostgreSQL with RLS
Storage: profile-photos (public), voice-messages (private)
```

### **Database Tables**
```sql
clan_families (4 records: Darood, Hawiye, Dir, Digil & Mirifle)
subclans (18 records: Majeerteen, Isaaq, Abgaal, etc.)
user_profiles (main user data with 4 photos requirement)
hellos (when users click "Heelo" button)
matches (when both users accept each other)
notifications (real-time alerts)
chat_rooms (individual chat spaces)
messages (text + voice messages)
```

### **Project Structure**
```
src/
├── lib/
│   └── supabase.js (client configuration)
├── contexts/
│   └── AuthContext.jsx (authentication state)
├── components/
│   ├── auth/
│   │   └── AuthPage.jsx (sign up/login)
│   ├── profile/
│   │   └── ProfileCreation.jsx (5-step onboarding)
│   └── discovery/
│       └── DiscoveryPage.jsx (welcome page, placeholder)
└── App.jsx (main app with routing logic)
```

---

## 🔧 **Recent Fixes**

### **Loading Issue Resolution**
- **Problem**: App stuck on "Loading Kulanhub..." screen
- **Solution**: Implemented timeout mechanisms and robust error handling
- **Features Added**:
  - 5-second maximum loading timeout
  - Promise racing for Supabase queries
  - Comprehensive error logging
  - Simplified profile fetching

### **Photo Upload System**
- **Complete implementation** with Supabase storage
- **Validation**: File type, size (5MB), count (exactly 4)
- **Features**: Progress tracking, individual photo removal
- **Mobile support**: Works with camera and gallery

### **Location Dropdowns**
- **Somalia**: 20+ major cities (Mogadishu, Hargeisa, etc.)
- **Diaspora**: 25+ countries (US, UK, Canada, Sweden, etc.)
- **Data consistency** for better filtering

---

## 🚧 **PENDING FEATURES (TO BE BUILT)**

### 🔍 **Discovery/Swiping System**
**Status**: 🔴 Not Started
**Priority**: HIGH

**Requirements**:
- Tinder-style card interface
- One profile at a time on mobile
- Large photo display with user info
- "Cancel ❌" and "Heelo 👋" buttons
- Smart algorithm to exclude already seen/matched users
- Integration with `get_discovery_profiles()` function

**Technical Approach**:
```jsx
// Use Supabase function for discovery
const { data: profiles } = await supabase.rpc('get_discovery_profiles', {
  current_user_id: user.id,
  limit_count: 10,
  clan_filter: selectedClan,
  location_type_filter: locationType
})
```

### 📱 **Notification System**
**Status**: 🔴 Not Started
**Priority**: HIGH

**Requirements**:
- List of received "hellos"
- Show sender's full profile (all 4 photos)
- Accept ✅ or Ignore ❌ buttons
- Real-time updates
- Badge counts for unread notifications

**Database Integration**:
- Query `notifications` table
- Update `hellos` status (pending → accepted/ignored)
- Create `matches` when mutual acceptance

### 💬 **Chat System**
**Status**: 🔴 Not Started
**Priority**: MEDIUM

**Requirements**:
- WhatsApp-style interface
- Text messages with bubbles
- Voice message recording and playback
- Mobile: Full screen chat
- Desktop: Two-column layout (chat list + active chat)
- Real-time messaging with Supabase realtime

### 🔧 **Advanced Features**
**Status**: 🔴 Not Started
**Priority**: LOW

- **Filters**: Age range, clan preferences, location
- **Profile editing**: Update photos, bio, location
- **Settings**: Notifications, privacy, account
- **Admin panel**: User management, moderation

---

## 📋 **Development Roadmap**

### **Phase 1: Core Matching (Next Steps)**
1. **Build Discovery Page**
   - Implement card-based UI
   - Add swipe gestures for mobile
   - Connect to discovery function
   - Add filter controls

2. **Implement Notification System**
   - Create notification list component
   - Add profile view modal
   - Implement accept/ignore logic
   - Add real-time updates

3. **Basic Chat System**
   - Create chat room interface
   - Implement text messaging
   - Add message history

### **Phase 2: Enhanced Features**
1. **Voice Messages**
   - Audio recording in browser
   - Supabase storage integration
   - Playback controls

2. **Advanced Filtering**
   - Age range sliders
   - Location preferences
   - Clan family filters

3. **Profile Management**
   - Edit profile functionality
   - Photo management
   - Privacy settings

### **Phase 3: Polish & Deploy**
1. **Performance Optimization**
   - Image optimization
   - Lazy loading
   - Caching strategies

2. **Mobile App (Optional)**
   - React Native conversion
   - Push notifications
   - App store deployment

---

## 🐛 **Known Issues**

### **Resolved Issues**
- ✅ **Loading timeout**: Fixed with robust error handling
- ✅ **Photo upload**: Fully implemented and tested
- ✅ **Tailwind CSS**: Properly configured and working
- ✅ **Clan dropdowns**: Working with hierarchical data

### **Current Issues**
- **Clan data in discovery**: Simplified profile loading (clan names not shown in discovery page)
- **No real discovery yet**: Placeholder page only

---

## 🔑 **Important Configuration**

### **Supabase Credentials**
```javascript
URL: [Your Supabase Project URL]
Anon Key: [Your Supabase Anon Key]
```
**⚠️ Important: Never commit actual credentials to Git. Use environment variables.**

### **Environment Setup**
```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env
# Edit .env with your actual Supabase credentials

# 3. Start development server
npm run dev  # Starts on http://localhost:5173
```

**⚠️ SECURITY NOTICE: Read SECURITY.md before pushing to GitHub!**

### **MCP Configuration**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "cmd",
      "args": ["/c", "mcp-server-supabase", "--access-token", "[YOUR_SUPABASE_ACCESS_TOKEN]"]
    }
  }
}
```
**⚠️ Security Note: Replace with your actual access token. Never commit real tokens to repositories.**

---

## 📱 **User Flow (Current)**

1. **Landing**: Loading screen (fixed timeout)
2. **Authentication**: Sign up or log in
3. **Profile Creation**: 5-step guided process
4. **Discovery**: Welcome page (placeholder)

**Expected Complete Flow**:
1. **Landing** → **Auth** → **Profile Creation**
2. **Discovery** (swipe through profiles)
3. **Notifications** (receive hellos)
4. **Chat** (matched conversations)

---

## 🎯 **Cultural Features**

### **Somali-Specific Elements**
- **Clan System**: 4 main families, 18 subclans with proper hierarchy
- **Location Awareness**: Somalia vs diaspora with relevant cities/countries
- **Cultural Sensitivity**: Respectful approach to traditional values
- **Community Focus**: Building connections within Somali community

### **Language Considerations**
- **UI Language**: English (primary)
- **Cultural Terms**: "Heelo" instead of "Like"
- **Future**: Somali language support possible

---

## 🚀 **Getting Started (New Developer)**

### **Prerequisites**
- Node.js 22+ (current: v22.11.0)
- npm or yarn
- Supabase account access

### **Setup Steps**
```bash
1. git clone [repository]
2. cd kulanhub
3. npm install
4. npm run dev
5. Open http://localhost:5173
```

### **Testing**
```bash
# Test Authentication
1. Sign up with email/password
2. Complete profile step-by-step
3. Upload 4 photos
4. Reach discovery page

# Test Database
- Check Supabase dashboard
- Verify profile data saved
- Check photo storage
```

---

## 🔮 **Future Enhancements**

- **AI Matching**: Smart compatibility algorithms
- **Video Calls**: WebRTC integration
- **Events**: Community meetups and events
- **Verification**: Profile verification system
- **Analytics**: User engagement tracking
- **Monetization**: Premium features, subscriptions

---

## 📞 **Support & Maintenance**

### **Key Areas to Monitor**
- **Supabase usage**: Storage and database limits
- **Photo uploads**: Storage bucket management
- **Authentication**: Session management
- **Performance**: Load times and responsiveness

### **Regular Tasks**
- Monitor error logs
- Update dependencies
- Review user feedback
- Backup database
- Optimize storage

---

**Last Updated**: August 2025
**Status**: Development Phase 1 Complete
**Next Phase**: Discovery & Matching System

---

*This documentation should provide complete context for continuing development in new chat sessions.*