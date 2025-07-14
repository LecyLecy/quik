import { supabase } from '@/lib/supabase/client'
import type { MediaItem } from '@/types/note'
import type { NoteBubble } from '@/types/note'

export async function saveNoteBubble(note: NoteBubble) {
  const { data, error } = await supabase
    .from('notes')
    .insert([
      {
        id: note.id,
        description: note.description,
        contents: note.contents,
        created_at: note.createdAt,
        is_countdown: note.isCountdown ?? null,
        countdown_date: note.countdownDate ?? null,
      },
    ])

  if (error) throw error
  return data
}

export async function updateNoteBubble(
  id: string,
  description: string,
  contents?: MediaItem[]
) {
  const updateObj: any = { description }
  if (contents) updateObj.contents = contents

  const { error } = await supabase
    .from('notes')
    .update(updateObj)
    .eq('id', id)

  if (error) throw error
}


export async function deleteNoteBubble(note: NoteBubble) {
  if (note.contents.length > 0) {
    // Delete files from storage first
    const paths = note.contents.map((item) => item.storagePath)
    const { error } = await supabase.storage.from('notes-media').remove(paths)
    if (error) console.error('Failed to delete files:', error)
  }

  const { error } = await supabase.from('notes').delete().eq('id', note.id)
  if (error) throw error
}
