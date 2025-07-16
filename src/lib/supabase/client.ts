// lib/supabase/client.ts

import { createClient } from '@supabase/supabase-js'

// Your Supabase environment variables
const supabaseUrl = 'https://evjjeixmkcqkzbfaqtok.supabase.co' // ⬅️ replace with your actual URL
// ⚠️ Using anon key for public access since you're the only user
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2amplaXhta2Nxa3piZmFxdG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4MDE0OTgsImV4cCI6MjA2NzM3NzQ5OH0.VR3znsykk0xeY7oaUF0dFdEZ91uNz_9eKZ1tRP0i__o' // Replace with your actual anon key

console.log('[🟢 Supabase] Initializing client...')

export const supabase = createClient(supabaseUrl, supabaseKey)
