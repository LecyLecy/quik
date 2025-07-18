'use client'

import React, { useRef, useState, useEffect, forwardRef, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import { saveNoteBubble, updateNoteBubble } from '@/hooks/useSaveNote'
import type { NoteBubble, MediaItem } from '@/types/note'
import { supabase } from '@/lib/supabase/client'
import CustomTimePicker from './CustomTimePicker'
import CustomDatePicker from './CustomDatePicker'

interface NoteInputProps {
  onNoteSaved?: () => void
  onOptimisticAdd?: (note: NoteBubble) => void
  onOptimisticEdit?: (note: NoteBubble) => void
  editingNote?: NoteBubble | null
  onEditDone?: () => void
  onEditCancelled?: () => void
  currentNotes?: NoteBubble[] // For calculating order
}

const NoteInput = forwardRef<HTMLDivElement, NoteInputProps>(function NoteInput({
  onNoteSaved,
  onOptimisticAdd,
  onOptimisticEdit,
  editingNote,
  onEditDone,
  onEditCancelled,
  currentNotes = [],
}, ref) {
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [existingUploads, setExistingUploads] = useState<MediaItem[]>([])
  const [newUploads, setNewUploads] = useState<MediaItem[]>([])
  const [isCountdownMode, setIsCountdownMode] = useState(false)
  const [countdownDate, setCountdownDate] = useState('')
  const [countdownTime, setCountdownTime] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingNote) {
      setDescription(editingNote.description || '')
      setExistingUploads(editingNote.contents || [])
      setNewUploads([])
      
      // Jika edit countdown bubble, set countdown mode dan parse date/time
      if (editingNote.isCountdown && editingNote.countdownDate) {
        setIsCountdownMode(true)
        const date = new Date(editingNote.countdownDate)
        const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
        const timeStr = date.toTimeString().slice(0, 5) // HH:MM
        setCountdownDate(dateStr)
        setCountdownTime(timeStr)
      } else {
        setIsCountdownMode(false)
        setCountdownDate('')
        setCountdownTime('')
      }
    } else {
      setDescription('')
      setExistingUploads([])
      setNewUploads([])
      setIsCountdownMode(false)
      setCountdownDate('')
      setCountdownTime('')
    }
  }, [editingNote])

  const uploadFile = useCallback(async (file: File) => {
    const fileId = uuid()
    const fileExt = file.name.split('.').pop()
    const filePath = `${fileId}.${fileExt}`

    const { error } = await supabase.storage
      .from('notes-media')
      .upload(filePath, file)

    if (error) {
      console.error('❌ Upload failed:', error)
      return null
    }

    const publicUrl = supabase.storage.from('notes-media').getPublicUrl(filePath).data.publicUrl

    // Penentuan tipe file media
    const mediaType: MediaItem['type'] = file.type.startsWith('image')
      ? (file.type === 'image/gif' ? 'gif' : 'image')
      : file.type.startsWith('video')
      ? 'video'
      : 'document'

    const media: MediaItem = {
      id: fileId,
      url: publicUrl,
      storagePath: filePath,
      type: mediaType,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      createdAt: new Date().toISOString(),
    }

    return media
  }, [])

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          // Generate a filename for pasted images
          const timestamp = Date.now()
          const ext = file.type.split('/')[1] || 'png'
          const fileName = `pasted-image-${timestamp}.${ext}`
          
          // Create a new file with proper name
          const renamedFile = new File([file], fileName, { type: file.type })
          
          const media = await uploadFile(renamedFile)
          if (media) {
            setNewUploads((prev) => [...prev, media])
          }
        }
        break // Only handle the first image found
      }
    }
  }, [uploadFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    // Handle first file only (you can modify to handle multiple files)
    const file = files[0]
    const media = await uploadFile(file)
    if (media) {
      setNewUploads((prev) => [...prev, media])
    }
  }

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    const media = await uploadFile(file)
    if (media) {
      setNewUploads((prev) => [...prev, media])
    }
  }, [uploadFile])

  const handleRemoveUpload = useCallback(async (id: string) => {
    const fileToRemoveNew = newUploads.find((item) => item.id === id)
    if (fileToRemoveNew) {
      const { error } = await supabase.storage
        .from('notes-media')
        .remove([fileToRemoveNew.storagePath])

      if (error) {
        console.error('Failed to delete file from storage:', error)
        return
      }

      setNewUploads((prev) => prev.filter((item) => item.id !== id))
      return
    }

    setExistingUploads((prev) => prev.filter((item) => item.id !== id))
  }, [newUploads])

  const handleSend = useCallback(async () => {
    // Allow send if there's description OR if there are files to upload
    const hasContent = description.trim() || existingUploads.length > 0 || newUploads.length > 0
    if (!hasContent) return

    const isCountdown = Boolean(isCountdownMode && countdownDate && countdownTime)
    const fullCountdownISO = isCountdown
      ? new Date(`${countdownDate}T${countdownTime}:00`).toISOString()
      : null

    if (editingNote) {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('notes')
          .select('id')
          .eq('id', editingNote.id)
          .single()

        if (error || !data) {
          alert('This note was deleted and can no longer be edited.')
          onEditCancelled?.()
          return
        }

        // Create optimistic update
        const isEditingDefault = !editingNote.isCountdown
        let updatedContents = existingUploads
        if (isEditingDefault && newUploads.length > 0) {
          updatedContents = [...existingUploads, ...newUploads]
        }

        const optimisticNote: NoteBubble = {
          ...editingNote,
          description,
          contents: isEditingDefault ? updatedContents : editingNote.contents,
          countdownDate: editingNote.isCountdown ? (fullCountdownISO || undefined) : editingNote.countdownDate,
        }

        // Apply optimistic update immediately
        onOptimisticEdit?.(optimisticNote)
        onEditDone?.()

        // Then save to database
        const updateCountdownDate = editingNote.isCountdown ? fullCountdownISO || undefined : undefined

        await updateNoteBubble(
          editingNote.id,
          description,
          isEditingDefault ? updatedContents : undefined, // update contents hanya untuk default
          updateCountdownDate // update countdown date jika edit countdown
        )
      } catch (err) {
        console.error('❌ Error updating note:', err)
      } finally {
        setLoading(false)
      }
    } else {
      if (isCountdown && newUploads.length > 0) {
        const pathsToRemove = newUploads.map((item) => item.storagePath)
        const { error } = await supabase.storage.from('notes-media').remove(pathsToRemove)
        if (error) {
          console.error('Failed to delete files when sending countdown note:', error)
        }
        setNewUploads([])
      }

      const newNote: NoteBubble = {
        id: uuid(),
        description,
        createdAt: new Date().toISOString(),
        contents: isCountdown ? existingUploads : [...existingUploads, ...newUploads],
        isCountdown: isCountdown ? true : undefined,
        countdownDate: fullCountdownISO || undefined,
        order: currentNotes.length > 0 ? Math.max(0, ...currentNotes.map(n => n.order || 0)) + 1 : 1, // Next available order
      }

      console.log('📝 Creating note:', newNote)
      onOptimisticAdd?.(newNote)

      try {
        setLoading(true)
        await saveNoteBubble(newNote)
        onNoteSaved?.()
        setDescription('')
        setExistingUploads([])
        setNewUploads([])
        setCountdownDate('')
        setCountdownTime('')
        setIsCountdownMode(false)
      } catch (err) {
        console.error('❌ Error saving note:', err)
      } finally {
        setLoading(false)
      }
    }
  }, [
    description, existingUploads, newUploads, isCountdownMode, countdownDate, countdownTime,
    editingNote, onOptimisticEdit, onEditDone, onOptimisticAdd, onNoteSaved, currentNotes
  ])

  // Cek apakah sedang edit bubble default (bukan countdown)

  return (
    <div 
      ref={ref} 
      className={`p-3 sm:p-4 bg-black border-t border-gray-800 sticky bottom-0 transition-all ${
        isDragOver ? 'border-blue-500 border-2 bg-blue-900/20' : ''
      }`}
      onPaste={handlePaste}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {(isCountdownMode || (editingNote && editingNote.isCountdown)) && (
        <div className="flex flex-col gap-2 mb-2">
          <CustomDatePicker
            value={countdownDate}
            onChange={setCountdownDate}
            className="w-full"
          />
          <CustomTimePicker
            value={countdownTime}
            onChange={setCountdownTime}
            className="w-full"
          />
        </div>
      )}

      {/* Upload preview */}
      {(!isCountdownMode && !(editingNote && editingNote.isCountdown) && (existingUploads.length + newUploads.length) > 0) && (
        <div className="flex flex-wrap gap-3 mb-3">
          {[...existingUploads, ...newUploads].map((item) => (
            <div
              key={item.id}
              className="relative bg-[#1e1e1e] border border-gray-700 rounded p-2 w-24 h-24 sm:w-36 sm:h-36 overflow-hidden"
            >
              {item.type === 'image' || item.type === 'gif' ? (
                <img
                  src={item.url}
                  alt={item.fileName}
                  className="rounded w-full h-full object-contain"
                />
              ) : item.type === 'video' ? (
                <video
                  src={item.url}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                  controls={false}
                />
              ) : (
                <p className="text-xs text-white truncate">{item.fileName}</p>
              )}

              <button
                onClick={() => handleRemoveUpload(item.id)}
                className="absolute top-1 right-1 bg-red-600 rounded-full w-6 h-6 text-xs text-white flex items-center justify-center cursor-pointer"
                title="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={editingNote ? 'Edit note...' : 'Write something...'}
        className="w-full bg-[#1e1e1e] text-white p-2 rounded resize-none h-20"
      />

      <div className="flex justify-between items-center mt-2">
        {/* Upload button & Countdown toggle */}
        <div className="flex gap-2">
          {/* Saat edit bubble default ATAU saat tambah note baru (bukan countdown mode) */}
          {((!editingNote && !isCountdownMode) ||
            (editingNote && !editingNote.isCountdown)) && (
            <>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors cursor-pointer"
                title="Upload files"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
                multiple
              />
            </>
          )}
          {/* Toggle countdown hanya tampil kalau bukan sedang edit */}
          {!editingNote && (
            <button
              onClick={() => setIsCountdownMode((prev) => !prev)}
              className={`p-2 rounded transition-colors cursor-pointer ${
                isCountdownMode ? 'bg-teal-600 hover:bg-teal-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              title={isCountdownMode ? 'Switch to normal note' : 'Create countdown'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex gap-2 ml-auto">
          {editingNote && (
            <button
              onClick={onEditCancelled}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded disabled:opacity-50 transition-colors cursor-pointer"
              title="Cancel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={loading}
            className={`${
              editingNote ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500'
            } text-white p-2 rounded disabled:opacity-50 transition-colors cursor-pointer`}
            title={editingNote ? 'Save changes' : 'Send note'}
          >
            {loading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : editingNote ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
})

export default NoteInput
