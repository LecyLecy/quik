import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { NoteBubble } from '@/types/note'

export function useNotes() {
  const [notes, setNotes] = useState<NoteBubble[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: true }) // ascending agar oldest dulu

      if (error) throw error
      if (!data) return

      const mappedNotes: NoteBubble[] = data.map((note: any) => ({
        id: note.id,
        description: note.description,
        contents: note.contents,
        createdAt: note.created_at,
        isCountdown: note.is_countdown ?? false,
        countdownDate: note.countdown_date ?? null,
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
