import { supabase } from '@/lib/supabase/client'
import type { MediaItem } from '@/types/note'
import type { NoteBubble } from '@/types/note'

export async function saveNoteBubble(note: NoteBubble) {
  console.log('Attempting to save note:', note)
  
  const { data, error } = await supabase
    .from('notes')
    .insert([
      {
        id: note.id,
        description: note.description,
        contents: note.contents,
        created_at: note.createdAt,
        order: note.order ?? null,
        is_countdown: note.isCountdown ?? null,
        countdown_date: note.countdownDate ?? null,
        // Removed user_id for now since column doesn't exist
      },
    ])

  if (error) {
    console.error('Database save error:', error)
    throw error
  }
  
  console.log('Successfully saved note:', data)
  return data
}

export async function updateNoteBubble(
  id: string,
  description: string,
  contents?: MediaItem[],
  countdownDate?: string
) {
  const updateObj: { description: string; contents?: MediaItem[]; countdown_date?: string } = { description }
  if (contents !== undefined) updateObj.contents = contents
  if (countdownDate !== undefined) updateObj.countdown_date = countdownDate

  const { error } = await supabase
    .from('notes')
    .update(updateObj)
    .eq('id', id)
    // Removed user_id check for now

  if (error) throw error
}


export async function deleteNoteBubble(note: NoteBubble) {
  console.log('Attempting to delete note:', note.id)
  
  if (note.contents.length > 0) {
    // Delete files from storage first
    const paths = note.contents.map((item) => item.storagePath)
    console.log('Deleting files:', paths)
    const { error } = await supabase.storage.from('notes-media').remove(paths)
    if (error) {
      console.error('Failed to delete files:', error)
    } else {
      console.log('Successfully deleted files from storage')
    }
  }

  console.log('Deleting note from database...')
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', note.id)
  
  if (error) {
    console.error('Database delete error:', error)
    throw error
  }
  
  console.log('Successfully deleted note from database')
}

export async function updateNoteOrder(noteId: string, newOrder: number) {
  const { error } = await supabase
    .from('notes')
    .update({ order: newOrder })
    .eq('id', noteId)
    // Removed user_id check for now

  if (error) throw error
}

export async function swapNoteOrders(noteId1: string, order1: number, noteId2: string, order2: number) {
  // Simple approach: update both notes individually
  try {
    await Promise.all([
      updateNoteOrder(noteId1, order1),
      updateNoteOrder(noteId2, order2)
    ])
  } catch (error) {
    console.error('Failed to swap note orders:', error)
    throw error
  }
}
