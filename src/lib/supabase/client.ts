// lib/supabase/client.ts

import { createClient } from '@supabase/supabase-js'

// Your Supabase environment variables
const supabaseUrl = 'https://evjjeixmkcqkzbfaqtok.supabase.co' // ⬅️ replace with your actual URL
// ⚠️ Using anon key for public access since you're the only user
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2amplaXhta2Nxa3piZmFxdG9rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgwMTQ5OCwiZXhwIjoyMDY3Mzc3NDk4fQ.yHf7JbAi9W3Q-Mhn4R5YYl2xGguAS2CEKmUxesr6YHo' // Replace with your actual anon key

console.log('[🟢 Supabase] Initializing client...')

export const supabase = createClient(supabaseUrl, supabaseKey)
