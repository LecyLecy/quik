'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useNotes } from '@/hooks/useNotes'
import NoteItem from '@/components/NoteBubble'
import NoteInput from '@/components/NoteInput'
import type { NoteBubble } from '@/types/note'
import { deleteNoteBubble, swapNoteOrders } from '@/hooks/useSaveNote'

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface NotesPageProps {
  onMenuToggle: () => void
}

export default function NotesPage({ onMenuToggle }: NotesPageProps) {
  const { notes, loading, refetch, setNotes } = useNotes()
  const [pendingDelete, setPendingDelete] = useState<NoteBubble | null>(null)
  const [editingNote, setEditingNote] = useState<NoteBubble | null>(null)
  const [editingTimeNote, setEditingTimeNote] = useState<NoteBubble | null>(null)
  const [deleting, setDeleting] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputWrapperRef = useRef<HTMLDivElement>(null)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [wasAtBottom, setWasAtBottom] = useState(true)

  // Multi Select Bubble
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showMultiDeleteModal, setShowMultiDeleteModal] = useState(false)

  // Search
  const [searchMode, setSearchMode] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [scrollPositionBeforeSearch, setScrollPositionBeforeSearch] = useState(0)

  // Debounced search
  const debouncedSearchText = useDebounce(searchText, 300)

  // Filter notes based on search
  const filteredNotes = notes.filter(note => {
    if (!debouncedSearchText) return true
    const description = note.description || ''
    return description.toLowerCase().includes(debouncedSearchText.toLowerCase())
  })

  // Auto-scroll to bottom when new notes are added
  useEffect(() => {
    if (scrollContainerRef.current && wasAtBottom && !refreshing) {
      const container = scrollContainerRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [notes, wasAtBottom, refreshing])

  // Handle scroll events
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50
      setWasAtBottom(isAtBottom)
      
      // DEBUG: Log the values to understand what's happening
      console.log('Scroll Debug:', {
        scrollTop,
        scrollHeight,
        clientHeight,
        isAtBottom,
        shouldShowButton: !isAtBottom
      })
      
      // Show scroll button when NOT at bottom (inverted the logic)
      setShowScrollButton(!isAtBottom)
    }

    // Check initial state
    const checkInitialState = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50
      setWasAtBottom(isAtBottom)
      
      // DEBUG: Log initial state
      console.log('Initial State Debug:', {
        scrollTop,
        scrollHeight,
        clientHeight,
        isAtBottom,
        shouldShowButton: !isAtBottom
      })
      
      setShowScrollButton(!isAtBottom)
    }

    // Check state when content changes
    checkInitialState()

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [notes]) // Add notes as dependency to recheck when notes change

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  // Handle delete
  const handleDelete = useCallback(async (bubble: NoteBubble) => {
    setDeleting(true)
    try {
      await deleteNoteBubble(bubble)
      await refetch()
      setPendingDelete(null)
    } catch (error) {
      console.error('Error deleting note:', error)
    } finally {
      setDeleting(false)
    }
  }, [refetch])

  // Handle multi-select
  const handleBubbleSelectToggle = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }, [])

  const handleExitSelectMode = useCallback(() => {
    setSelectMode(false)
    setSelectedIds([])
  }, [])

  // Handle move up/down
  const handleMoveUp = useCallback(async (bubble: NoteBubble) => {
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
        // Revert optimistic update on error
        await refetch()
      }
    }, 150)
  }, [notes, setNotes, refetch])

  const handleMoveDown = useCallback(async (bubble: NoteBubble) => {
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
        // Revert optimistic update on error
        await refetch()
      }
    }, 150)
  }, [notes, setNotes, refetch])

  // Handle search
  const handleSearchToggle = useCallback(() => {
    if (searchMode) {
      // Exit search mode
      setSearchMode(false)
      setSearchText('')
      setShowSearchModal(false)
      // Restore scroll position
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollPositionBeforeSearch
      }
    } else {
      // Enter search mode
      setScrollPositionBeforeSearch(scrollContainerRef.current?.scrollTop || 0)
      setSearchMode(true)
    }
  }, [searchMode, scrollPositionBeforeSearch])

  const handleOptimisticEdit = useCallback((bubble: NoteBubble) => {
    setNotes(prevNotes => 
      prevNotes.map(note => 
        note.id === bubble.id ? bubble : note
      )
    )
  }, [setNotes])

  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [])

  const shouldShowModal = searchText.trim() && filteredNotes.length > 6

  // Auto-open modal when search has many results
  useEffect(() => {
    if (shouldShowModal && !showSearchModal) {
      setShowSearchModal(true)
    } else if (!shouldShowModal && showSearchModal) {
      setShowSearchModal(false)
    }
  }, [shouldShowModal, showSearchModal])

  // Helper function to highlight search terms
  const highlightSearchText = useCallback((text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 text-black">$1</mark>')
  }, [])

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-black border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {!selectMode ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </button>
            
            <span>📒</span>
            <h1 className="text-xl font-semibold">Notes</h1>
          </div>
          {!selectMode ? (
            <div className="flex items-center gap-2">
              {searchMode ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search notes..."
                    className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600 focus:border-blue-400 focus:outline-none text-sm w-40"
                    autoFocus
                  />
                  {searchText && filteredNotes.length > 6 && (
                    <button
                      onClick={() => setShowSearchModal(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      title="View all results"
                    >
                      {filteredNotes.length} results
                    </button>
                  )}
                  <button
                    onClick={handleSearchToggle}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Cancel search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    // Store current scroll position before entering search mode
                    if (scrollContainerRef.current) {
                      setScrollPositionBeforeSearch(scrollContainerRef.current.scrollTop)
                    }
                    setSearchMode(true)
                  }}
                  className="text-gray-400 hover:bg-gray-400/10 p-2 rounded transition-colors cursor-pointer"
                  title="Search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}

              {/* Select Multiple Button */}
              <button
                onClick={() => setSelectMode(true)}
                className="text-gray-400 hover:bg-gray-400/10 p-2 rounded transition-colors cursor-pointer"
                title="Select multiple"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Refresh - Only show on notes page */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-sm text-green-400 hover:bg-green-400/10 p-2 rounded disabled:opacity-50 transition-colors cursor-pointer"
                title="Refresh"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleExitSelectMode}
                className="text-sm bg-gray-700 text-white px-3 py-1 rounded cursor-pointer"
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
      </div>

      {/* Main Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 flex flex-col gap-3 mx-auto w-full max-w-none sm:max-w-4xl lg:max-w-7xl xl:max-w-none hide-scrollbar"
      >
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {searchText ? 'No notes found.' : 'No notes yet.'}
          </div>
        ) : (
          filteredNotes.map((bubble, index) => {
            const selected = selectMode && selectedIds.includes(bubble.id)
            const originalIndex = notes.findIndex(n => n.id === bubble.id)
            
            return (
              <div
                key={bubble.id}
                data-note-id={bubble.id}
                className="transition-all duration-200"
                onClick={() => selectMode && handleBubbleSelectToggle(bubble.id)}
              >
                <NoteItem
                  bubble={bubble}
                  onRequestDelete={!selectMode ? () => setPendingDelete(bubble) : undefined}
                  onRequestEdit={!selectMode ? () => setEditingNote(bubble) : undefined}
                  onRequestEditTime={!selectMode ? () => setEditingTimeNote(bubble) : undefined}
                  onOptimisticEdit={handleOptimisticEdit}
                  onMoveUp={!selectMode && !searchText ? handleMoveUp : undefined}
                  onMoveDown={!selectMode && !searchText ? handleMoveDown : undefined}
                  isFirst={originalIndex === 0}
                  isLast={originalIndex === notes.length - 1}
                  isEditing={editingNote?.id === bubble.id || editingTimeNote?.id === bubble.id}
                  searchText={searchText}
                  highlightSearchText={highlightSearchText}
                  selectMode={selectMode}
                  selected={selected}
                />
              </div>
            )
          })
        )}
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed z-30 bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 transition-colors cursor-pointer top-24 right-3 sm:right-6 lg:right-8"
          aria-label="Scroll to bottom"
          title="Scroll to bottom"
        >
          ↓
        </button>
      )}

      {/* Input area wrapper */}
      <div ref={inputWrapperRef} className="mx-auto w-full max-w-none sm:max-w-4xl lg:max-w-7xl xl:max-w-none">
        <NoteInput
          editingNote={editingNote || editingTimeNote}
          onEditDone={() => {
            setEditingNote(null)
            setEditingTimeNote(null)
          }}
          onEditCancelled={() => {
            setEditingNote(null)
            setEditingTimeNote(null)
          }}
          onNoteSaved={refetch}
          onOptimisticAdd={(bubble) => {
            setNotes(prevNotes => [...prevNotes, bubble])
          }}
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
                "{pendingDelete.description.slice(0, 100)}"
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
                onClick={() => pendingDelete && handleDelete(pendingDelete)}
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
                onClick={async () => {
                  setDeleting(true)
                  try {
                    for (const id of selectedIds) {
                      const bubble = notes.find(b => b.id === id)
                      if (bubble) {
                        await deleteNoteBubble(bubble)
                      }
                    }
                    await refetch()
                    setShowMultiDeleteModal(false)
                    setSelectMode(false)
                    setSelectedIds([])
                  } catch (error) {
                    console.error('Error deleting notes:', error)
                  } finally {
                    setDeleting(false)
                  }
                }}
                disabled={deleting || selectedIds.length === 0}
                className="bg-red-600 px-4 py-2 rounded disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Results Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#2c2c2c] rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-600">
              <h3 className="text-lg font-semibold text-white">
                Search Results for "{searchText}" ({filteredNotes.length} found)
              </h3>
              <button
                onClick={handleSearchToggle}
                className="text-gray-400 hover:text-white p-1"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Scrollable Results */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredNotes.map((bubble) => (
                <div
                  key={bubble.id}
                  className="bg-[#1e1e1e] rounded-lg p-4 hover:bg-[#252525] transition-colors cursor-pointer"
                  onClick={() => {
                    setShowSearchModal(false)
                    // Scroll to the note in the main view
                    const noteElement = document.querySelector(`[data-note-id="${bubble.id}"]`)
                    if (noteElement) {
                      noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      // Add a brief highlight effect
                      noteElement.classList.add('ring-2', 'ring-blue-500')
                      setTimeout(() => {
                        noteElement.classList.remove('ring-2', 'ring-blue-500')
                      }, 2000)
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-gray-400 text-sm">
                      {new Date(bubble.createdAt).toLocaleString()}
                    </div>
                    {bubble.isCountdown && (
                      <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs">
                        Countdown
                      </span>
                    )}
                  </div>
                  
                  <div className="text-white mb-2">
                    {bubble.description || '(No description)'}
                  </div>
                  
                  {bubble.contents.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {bubble.contents.map((content, idx) => (
                        <div key={idx} className="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300">
                          {content.type === 'image' ? '🖼️' : '📁'} {content.fileName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
