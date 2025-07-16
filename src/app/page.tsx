'use client'

import { useState, useRef, useEffect } from 'react'
import { useNotes } from '@/hooks/useNotes'
import NoteItem from '@/components/NoteBubble'
import NoteInput from '@/components/NoteInput'
import type { NoteBubble } from '@/types/note'
import { deleteNoteBubble, swapNoteOrders } from '@/hooks/useSaveNote'

export default function HomePage() {
  const { notes, loading, refetch, setNotes } = useNotes()
  const [pendingDelete, setPendingDelete] = useState<NoteBubble | null>(null)
  const [editingNote, setEditingNote] = useState<NoteBubble | null>(null)
  const [editingTimeNote, setEditingTimeNote] = useState<NoteBubble | null>(null)
  const [deleting, setDeleting] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputWrapperRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [wasAtBottom, setWasAtBottom] = useState(true) // Track if user was at bottom before refresh

  // ===== Multi Select Bubble =====
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showMultiDeleteModal, setShowMultiDeleteModal] = useState(false)

  // ===== Manual Refresh Handler =====
  const handleManualRefresh = async () => {
    // Check if user is at bottom before refresh
    const isAtBottom = scrollContainerRef.current ? 
      (scrollContainerRef.current.scrollHeight - scrollContainerRef.current.scrollTop - scrollContainerRef.current.clientHeight < 50) : true
    
    setWasAtBottom(isAtBottom)
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  // ===== Multi Delete Handler =====
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return
    try {
      setDeleting(true)
      // Optimistic update - remove from UI immediately
      setNotes((prev) => prev.filter((n) => !selectedIds.includes(n.id)))
      setSelectedIds([])
      setSelectMode(false)
      
      // Then delete from database
      await Promise.all(
        selectedIds.map(async (id) => {
          const bubble = notes.find(n => n.id === id)
          if (bubble) await deleteNoteBubble(bubble)
        })
      )
    } catch (error) {
      console.error('Failed to delete selected notes:', error)
      // Revert optimistic update on error
      await refetch()
      alert('Failed to delete selected notes!')
    } finally {
      setDeleting(false)
      setShowMultiDeleteModal(false)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      setDeleting(true)
      // Optimistic update - remove from UI immediately
      setNotes((prev) => prev.filter((n) => n.id !== pendingDelete.id))
      
      // Then delete from database
      await deleteNoteBubble(pendingDelete)
    } catch (err) {
      console.error('❌ Failed to delete note:', err)
      // Revert optimistic update on error
      await refetch()
    } finally {
      setDeleting(false)
      setPendingDelete(null)
    }
  }

  const handleEditDone = async () => {
    setEditingNote(null)
    setEditingTimeNote(null)
    // No auto-refresh - changes should be handled optimistically by NoteInput
  }

  useEffect(() => {
    const updateOffset = () => {
      // Update offset logic removed since bottomOffset was unused
    }
    updateOffset()
    window.addEventListener('resize', updateOffset)
    return () => window.removeEventListener('resize', updateOffset)
  }, [])

  // Auto-scroll to bottom after refresh (if user was at bottom) or new messages
  useEffect(() => {
    if (!scrollContainerRef.current) return
    
    // If refreshing finished and user was at bottom, scroll to bottom
    if (!refreshing && wasAtBottom) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
      })
    }
  }, [notes, refreshing, wasAtBottom])

  // Initial scroll to bottom when notes first load
  useEffect(() => {
    if (!loading && notes.length > 0 && scrollContainerRef.current) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
        }
      })
    }
  }, [loading])

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

  // ===== Optimistic Note Addition =====
  const handleOptimisticAdd = (newNote: NoteBubble) => {
    setNotes((prev) => [...prev, newNote])
    // Auto-scroll to bottom for new messages
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      }
    }, 100)
  }

  // ===== Optimistic Note Edit =====
  const handleOptimisticEdit = (editedNote: NoteBubble) => {
    setNotes((prev) => prev.map(note => 
      note.id === editedNote.id ? editedNote : note
    ))
  }

  // ===== Note Saved Handler (no auto-refresh) =====
  const handleNoteSaved = () => {
    // Note is already added optimistically, no need to refresh
  }

  // ===== Note Reordering Handlers =====
  const handleMoveUp = async (bubble: NoteBubble) => {
    const currentIndex = notes.findIndex(n => n.id === bubble.id)
    if (currentIndex <= 0) return // Already at top

    const bubbleAbove = notes[currentIndex - 1]
    
    // Add animation class before swapping
    const currentElement = document.querySelector(`[data-note-id="${bubble.id}"]`)
    const aboveElement = document.querySelector(`[data-note-id="${bubbleAbove.id}"]`)
    
    if (currentElement && aboveElement) {
      currentElement.classList.add('animate-swap-up')
      aboveElement.classList.add('animate-swap-down')
    }

    // Wait for animation to start
    setTimeout(async () => {
      try {
        // Optimistic update - swap positions
        const newNotes = [...notes]
        const temp = newNotes[currentIndex]
        newNotes[currentIndex] = newNotes[currentIndex - 1]
        newNotes[currentIndex - 1] = temp
        
        // Assign proper order values
        newNotes[currentIndex - 1] = { ...newNotes[currentIndex - 1], order: currentIndex - 1 }
        newNotes[currentIndex] = { ...newNotes[currentIndex], order: currentIndex }
        
        setNotes(newNotes)

        // Update database with new order values
        await swapNoteOrders(bubble.id, currentIndex - 1, bubbleAbove.id, currentIndex)

        // Remove animation classes
        setTimeout(() => {
          currentElement?.classList.remove('animate-swap-up')
          aboveElement?.classList.remove('animate-swap-down')
        }, 300)
      } catch (error) {
        console.error('Failed to reorder notes:', error)
        // Remove animation classes on error
        currentElement?.classList.remove('animate-swap-up')
        aboveElement?.classList.remove('animate-swap-down')
      }
    }, 150)
  }

  const handleMoveDown = async (bubble: NoteBubble) => {
    const currentIndex = notes.findIndex(n => n.id === bubble.id)
    if (currentIndex >= notes.length - 1) return // Already at bottom

    const bubbleBelow = notes[currentIndex + 1]
    
    // Add animation class before swapping
    const currentElement = document.querySelector(`[data-note-id="${bubble.id}"]`)
    const belowElement = document.querySelector(`[data-note-id="${bubbleBelow.id}"]`)
    
    if (currentElement && belowElement) {
      currentElement.classList.add('animate-swap-down')
      belowElement.classList.add('animate-swap-up')
    }

    // Wait for animation to start
    setTimeout(async () => {
      try {
        // Optimistic update - swap positions
        const newNotes = [...notes]
        const temp = newNotes[currentIndex]
        newNotes[currentIndex] = newNotes[currentIndex + 1]
        newNotes[currentIndex + 1] = temp
        
        // Assign proper order values
        newNotes[currentIndex] = { ...newNotes[currentIndex], order: currentIndex }
        newNotes[currentIndex + 1] = { ...newNotes[currentIndex + 1], order: currentIndex + 1 }
        
        setNotes(newNotes)

        // Update database with new order values
        await swapNoteOrders(bubble.id, currentIndex + 1, bubbleBelow.id, currentIndex)

        // Remove animation classes
        setTimeout(() => {
          currentElement?.classList.remove('animate-swap-down')
          belowElement?.classList.remove('animate-swap-up')
        }, 300)
      } catch (error) {
        console.error('Failed to reorder notes:', error)
        // Remove animation classes on error
        currentElement?.classList.remove('animate-swap-down')
        belowElement?.classList.remove('animate-swap-up')
      }
    }, 150)
  }
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
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="text-sm text-green-400 hover:bg-green-400/10 p-2 rounded disabled:opacity-50 transition-colors"
            title="Refresh"
          >
            {refreshing ? (
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
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
          notes.map((bubble, index) => {
            const selected = selectMode && selectedIds.includes(bubble.id)
            return (
              <div
                key={bubble.id}
                data-note-id={bubble.id}
                className={`
                  relative group
                  transition-all duration-300 ease-in-out
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
                  onOptimisticEdit={handleOptimisticEdit}
                  onMoveUp={!selectMode ? handleMoveUp : undefined}
                  onMoveDown={!selectMode ? handleMoveDown : undefined}
                  isFirst={index === 0}
                  isLast={index === notes.length - 1}
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
          onNoteSaved={handleNoteSaved}
          onOptimisticAdd={handleOptimisticAdd}
          onOptimisticEdit={handleOptimisticEdit}
          currentNotes={notes}
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
