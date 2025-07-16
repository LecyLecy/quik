// Quick script to check and fix database
import { supabase } from './src/lib/supabase/client.js'

const FIXED_USER_ID = 'your-fixed-user-id-123'

async function checkAndFixDatabase() {
  console.log('🔍 Checking database...')
  
  // First, let's see all notes
  const { data: allNotes, error: fetchError } = await supabase
    .from('notes')
    .select('*')
  
  if (fetchError) {
    console.error('❌ Error fetching notes:', fetchError)
    return
  }
  
  console.log('📊 All notes in database:', allNotes)
  console.log('📝 Total notes found:', allNotes?.length || 0)
  
  if (allNotes && allNotes.length > 0) {
    // Check if any notes have NULL or missing user_id
    const notesWithoutUserId = allNotes.filter(note => !note.user_id)
    
    if (notesWithoutUserId.length > 0) {
      console.log(`🔧 Found ${notesWithoutUserId.length} notes without user_id. Fixing...`)
      
      // Update all notes without user_id to use our fixed user ID
      const { error: updateError } = await supabase
        .from('notes')
        .update({ user_id: FIXED_USER_ID })
        .is('user_id', null)
      
      if (updateError) {
        console.error('❌ Error updating notes:', updateError)
      } else {
        console.log('✅ Successfully updated notes with user_id!')
      }
    } else {
      console.log('✅ All notes already have user_id set')
    }
  } else {
    console.log('📝 No notes found in database')
  }
}

checkAndFixDatabase().catch(console.error)
