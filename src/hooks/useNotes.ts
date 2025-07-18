import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { NoteBubble, MediaItem } from '@/types/note'

export function useNotes() {
  const [notes, setNotes] = useState<NoteBubble[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('order', { ascending: true }) // Order by manual order first
        .order('created_at', { ascending: true }) // Then by creation time as fallback

      if (error) throw error
      if (!data) return

      const mappedNotes: NoteBubble[] = data.map((note: {
        id: string
        description: string
        contents: MediaItem[]
        created_at: string
        order: number
        is_countdown?: boolean
        countdown_date?: string
      }) => ({
        id: note.id,
        description: note.description,
        contents: note.contents,
        createdAt: note.created_at,
        order: note.order ?? null,
        isCountdown: note.is_countdown ?? false,
        countdownDate: note.countdown_date ?? undefined,
      }))

      setNotes(mappedNotes)
    } catch (err) {
      console.error('❌ Failed to fetch notes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
  }, [])

  return { notes, loading, refetch: fetchNotes, setNotes }
}
