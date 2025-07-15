'use client'

import { useState, useRef, useEffect } from 'react'
import { useNotes } from '@/hooks/useNotes'
import NoteItem from '@/components/NoteBubble'
import NoteInput from '@/components/NoteInput'
import type { NoteBubble } from '@/types/note'
import { deleteNoteBubble } from '@/hooks/useSaveNote'

export default function HomePage() {
  const { notes, loading, refetch, setNotes } = useNotes()
  const [pendingDelete, setPendingDelete] = useState<NoteBubble | null>(null)
  const [editingNote, setEditingNote] = useState<NoteBubble | null>(null)
  const [editingTimeNote, setEditingTimeNote] = useState<NoteBubble | null>(null)
  const [deleting, setDeleting] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputWrapperRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)

  // ===== Multi Select Bubble =====
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showMultiDeleteModal, setShowMultiDeleteModal] = useState(false)

  // Track id note terakhir
  const prevLastId = useRef<string | null>(null)

  // ===== Multi Delete Handler =====
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    try {
      setDeleting(true)
      await Promise.all(
        selectedIds.map(async (id) => {
          const bubble = notes.find(n => n.id === id)
          if (bubble) await deleteNoteBubble(bubble)
        })
      )
      setNotes((prev) => prev.filter((n) => !selectedIds.includes(n.id)))
      setSelectedIds([])
      setSelectMode(false)
    } catch {
      alert('Failed to delete selected notes!')
    } finally {
      setDeleting(false)
      setShowMultiDeleteModal(false)
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
      }, 150)
    }
  }

  // ===== Scroll fix: always scroll to bottom after notes update =====
  useEffect(() => {
    // Bandingkan id note terakhir sebelum dan sesudah update
    const lastId = notes.length ? notes[notes.length - 1].id : null
    if (
      scrollContainerRef.current &&
      lastId !== prevLastId.current
    ) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
          }
        })
      })
    }
    prevLastId.current = lastId
  }, [notes])

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      setDeleting(true)
      await deleteNoteBubble(pendingDelete)
      setNotes((prev) => prev.filter((n) => n.id !== pendingDelete.id))
    } catch (err) {
      console.error('❌ Failed to delete note:', err)
    } finally {
      setDeleting(false)
      setPendingDelete(null)
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
      }, 120)
    }
  }

  const handleEditDone = async () => {
    setEditingNote(null)
    setEditingTimeNote(null)
    await refetch()
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      }
    }, 150)
  }

  useEffect(() => {
    const updateOffset = () => {
      // Update offset logic removed since bottomOffset was unused
    }
    updateOffset()
    window.addEventListener('resize', updateOffset)
    return () => window.removeEventListener('resize', updateOffset)
  }, [])
  useEffect(() => {
    const onScroll = () => {
      if (!scrollContainerRef.current) return
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current
      const atBottom = scrollHeight - scrollTop - clientHeight < 50
      setShowScrollButton(!atBottom)
    }
    const container = scrollContainerRef.current
    container?.addEventListener('scroll', onScroll)
    return () => container?.removeEventListener('scroll', onScroll)
  }, [])

  // Listen for content deletion events from NoteBubble
  useEffect(() => {
    const handleContentDeleted = () => {
      refetch() // Refresh the notes when content is deleted
    }
    window.addEventListener('noteContentDeleted', handleContentDeleted)
    return () => window.removeEventListener('noteContentDeleted', handleContentDeleted)
  }, [refetch])
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }

  // ===== Bubble Select Handler =====
  const handleBubbleLongPress = (id: string) => {
    if (!selectMode) {
      if (editingNote) setEditingNote(null)
      setSelectMode(true)
      setSelectedIds([id])
    }
  }
  const handleBubbleSelectToggle = (id: string) => {
    if (!selectMode) return
    if (editingNote) setEditingNote(null)
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((sid) => sid !== id)
        : [...prev, id]
    )
  }

  const handleCancelSelectMode = () => {
    setSelectMode(false)
    setSelectedIds([])
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      }
    }, 120)
  }

  // ===== UI =====
  return (
    <main className="flex flex-col h-screen bg-black text-white relative max-w-screen-2xl mx-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-black px-3 sm:px-6 lg:px-8 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>📒</span>
          <h1 className="text-xl font-semibold">Your Notes</h1>
        </div>
        {!selectMode ? (
          <button
            onClick={async () => {
              await refetch()
              setTimeout(() => {
                if (scrollContainerRef.current) {
                  scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
                }
              }, 120)
            }}
            className="text-sm text-blue-400 hover:underline"
          >
            Refresh
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancelSelectMode}
              className="text-sm bg-gray-700 text-white px-3 py-1 rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowMultiDeleteModal(true)}
              disabled={selectedIds.length === 0}
              className={`text-sm px-3 py-1 rounded font-semibold
                ${selectedIds.length === 0
                  ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'}
              `}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Scrollable notes */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 flex flex-col gap-3 mx-auto w-full max-w-none sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl hide-scrollbar"
      >
        {loading ? (
          <p className="text-gray-400">Loading notes...</p>
        ) : notes.length === 0 ? (
          <p className="text-gray-500">No notes yet.</p>
        ) : (
          notes.map((bubble) => {
            const selected = selectMode && selectedIds.includes(bubble.id)
            return (
              <div
                key={bubble.id}
                className={`
                  relative group
                  transition-all
                `}
                // Hanya toggle select di select mode
                onClick={() => selectMode && handleBubbleSelectToggle(bubble.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  handleBubbleLongPress(bubble.id)
                }}
                onTouchStart={(e) => {
                  if (!selectMode) {
                    const timer = setTimeout(() => handleBubbleLongPress(bubble.id), 700)
                    e.target.addEventListener('touchend', () => clearTimeout(timer), { once: true })
                  }
                }}
              >
                <NoteItem
                  bubble={bubble}
                  onRequestDelete={!selectMode ? () => setPendingDelete(bubble) : undefined}
                  onRequestEdit={!selectMode ? () => setEditingNote(bubble) : undefined}
                  onRequestEditTime={!selectMode ? () => setEditingTimeNote(bubble) : undefined}
                  isEditing={editingNote?.id === bubble.id || editingTimeNote?.id === bubble.id}
                  selectMode={selectMode}
                  selected={selected}
                />
              </div>
            )
          })
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed z-30 bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 transition top-14 right-3 sm:right-6 lg:right-8 xl:right-[calc((100vw-1536px)/2+2rem)]"
          aria-label="Scroll to bottom"
          title="Scroll to bottom"
        >
          ↓
        </button>
      )}

      {/* Input area wrapper */}
      <div ref={inputWrapperRef} className="mx-auto w-full max-w-none sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
        <NoteInput
          editingNote={editingNote || editingTimeNote}
          onEditDone={handleEditDone}
          onEditCancelled={() => {
            setEditingNote(null)
            setEditingTimeNote(null)
          }}
          onNoteSaved={handleEditDone} // <- trigger scroll setelah refetch
          onOptimisticAdd={(note) => setNotes((prev) => [...prev, note])}
        />
      </div>

      {/* Single delete confirm modal */}
      {pendingDelete && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
          onClick={() => setPendingDelete(null)}
        >
          <div
            className="bg-[#2c2c2c] p-6 rounded w-full max-w-xs sm:max-w-md text-center relative mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white mb-4">
              Are you sure you want to delete this note?
            </p>
            {pendingDelete.description && (
              <p className="text-gray-400 text-sm mb-4 italic">
                “{pendingDelete.description.slice(0, 100)}”
              </p>
            )}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setPendingDelete(null)}
                className="bg-gray-600 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 px-4 py-2 rounded disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi delete confirm modal */}
      {showMultiDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
          onClick={() => setShowMultiDeleteModal(false)}
        >
          <div
            className="bg-[#2c2c2c] p-6 rounded w-full max-w-xs sm:max-w-md text-center relative mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white mb-4">
              Delete these bubbles?
            </p>
            <div className="mb-4 text-left max-h-40 overflow-y-auto">
              {selectedIds
                .map(id => notes.find(b => b.id === id))
                .filter(Boolean)
                .slice(0, 4)
                .map((b) =>
                  b ? (
                    <div key={b.id} className="text-gray-400 text-sm italic truncate mb-1">
                      {b.description || '(No description)'}
                    </div>
                  ) : null
                )}
              {selectedIds.length > 4 && (
                <div className="text-gray-400 text-sm italic">...</div>
              )}
            </div>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowMultiDeleteModal(false)}
                className="bg-gray-600 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting || selectedIds.length === 0}
                className="bg-red-600 px-4 py-2 rounded disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
