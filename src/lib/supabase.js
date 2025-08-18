import { createClient } from '@supabase/supabase-js'

// ⚠️ HARDCODED CREDENTIALS FOR LOCAL TESTING ONLY
// TODO: Remove before pushing to production and use environment variables
const supabaseUrl = 'https://numuheaxmywbzkocpbik.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51bXVoZWF4bXl3Ynprb2NwYmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDQxODIsImV4cCI6MjA3MTAyMDE4Mn0.rMaBWRv0jA3mWRvET9j2fP4gewdyJmNL1sJQPHmQRgw'

// Validate credentials
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)