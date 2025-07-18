'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useNotes } from '@/hooks/useNotes'
import { useDebounce } from '@/hooks/useDebounce'
import NoteItem from '@/components/NoteBubble'
import NoteInput from '@/components/NoteInput'
import Sidebar from '@/components/Sidebar'
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

  // ===== Search =====
  const [searchMode, setSearchMode] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [scrollPositionBeforeSearch, setScrollPositionBeforeSearch] = useState(0)

  // ===== Navigation =====
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<'notes' | 'sticker'>('notes')

  // ===== Sticker State =====
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [stickerPacks, setStickerPacks] = useState<Array<{ id: string; name: string; files: File[] }>>([])
  const [currentPackName, setCurrentPackName] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen) {
        const target = event.target as HTMLElement
        const sidebar = document.querySelector('[data-sidebar]')
        const hamburger = document.querySelector('[data-hamburger]')
        
        // Check if click is outside sidebar and hamburger button
        if (sidebar && hamburger && 
            !sidebar.contains(target) && 
            !hamburger.contains(target)) {
          setSidebarOpen(false)
        }
      }
    }

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sidebarOpen])

  // ===== Manual Refresh Handler =====
  const handleManualRefresh = useCallback(async () => {
    // Check if user is at bottom before refresh
    const isAtBottom = scrollContainerRef.current ? 
      (scrollContainerRef.current.scrollHeight - scrollContainerRef.current.scrollTop - scrollContainerRef.current.clientHeight < 50) : true
    
    setWasAtBottom(isAtBottom)
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }, [refetch])

  // ===== Multi Delete Handler =====
  const handleDeleteSelected = useCallback(async () => {
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
  }, [selectedIds, notes, refetch, setNotes])

  const handleDelete = useCallback(async () => {
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
  }, [pendingDelete, refetch, setNotes])

  const handleEditDone = useCallback(() => {
    setEditingNote(null)
    setEditingTimeNote(null)
    // No auto-refresh - changes should be handled optimistically by NoteInput
  }, [])

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
  const handleOptimisticAdd = useCallback((newNote: NoteBubble) => {
    setNotes((prev) => [...prev, newNote])
    // Auto-scroll to bottom for new messages
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      }
    }, 100)
  }, [])

  // ===== Optimistic Note Edit =====
  const handleOptimisticEdit = useCallback((editedNote: NoteBubble) => {
    setNotes((prev) => prev.map(note => 
      note.id === editedNote.id ? editedNote : note
    ))
  }, [])

  // ===== Note Saved Handler (no auto-refresh) =====
  const handleNoteSaved = useCallback(() => {
    // Note is already added optimistically, no need to refresh
  }, [])

  // ===== Search Filter =====
  const debouncedSearchText = useDebounce(searchText, 300)
  const filteredNotes = useMemo(() => {
    if (!searchText.trim()) return notes // Use immediate search text for instant results
    
    return notes.filter(note => 
      note.description?.toLowerCase().includes(searchText.toLowerCase()) ||
      note.contents.some(content => 
        content.fileName?.toLowerCase().includes(searchText.toLowerCase())
      )
    )
  }, [notes, searchText]) // Use immediate search text

  // Show search modal when there are many results
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
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-400 text-black px-1 rounded">{part}</mark> : 
        part
    )
  }, [])

  // ===== Note Reordering Handlers =====
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
      }
    }, 150)
  }, [notes, setNotes])

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
      }
    }, 150)
  }, [notes, setNotes])
  
  const scrollToBottom = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
    }
  }, [])

  // ===== Search Close Handler =====
  const handleSearchClose = useCallback(() => {
    setSearchMode(false)
    setSearchText('')
    setShowSearchModal(false)
    
    // Restore scroll position after DOM updates
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          // Check if we were at the bottom before search
          const wasAtBottom = scrollPositionBeforeSearch >= (scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight - 50)
          
          if (wasAtBottom) {
            // If user was at bottom, go to bottom
            scrollToBottom()
          } else {
            // Otherwise try to restore previous position, but default to bottom if that fails
            scrollContainerRef.current.scrollTop = scrollPositionBeforeSearch
            // If the restored position doesn't look right, go to bottom
            setTimeout(() => {
              if (scrollContainerRef.current && scrollContainerRef.current.scrollTop < 100) {
                scrollToBottom()
              }
            }, 50)
          }
        }
      })
    })
  }, [scrollPositionBeforeSearch, scrollToBottom])

  // ===== Bubble Select Handler =====
  const handleBubbleLongPress = useCallback((id: string) => {
    if (!selectMode) {
      if (editingNote) setEditingNote(null)
      setSelectMode(true)
      setSelectedIds([id])
    }
  }, [selectMode, editingNote])
  
  const handleBubbleSelectToggle = useCallback((id: string) => {
    if (!selectMode) return
    if (editingNote) setEditingNote(null)
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((sid) => sid !== id)
        : [...prev, id]
    )
  }, [selectMode, editingNote])

  const handleCancelSelectMode = useCallback(() => {
    setSelectMode(false)
    setSelectedIds([])
  }, [])

  // ===== UI =====
  return (
    <main className="flex flex-col h-screen bg-black text-white relative overflow-hidden">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-black border-b border-gray-800 px-3 sm:px-6 lg:px-8 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Burger Menu Icon */}
          <button
            data-hamburger
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white transition-all duration-300 p-1"
            title={sidebarOpen ? "Close menu" : "Open menu"}
          >
            <svg 
              className={`w-5 h-5 transition-all duration-300 ${sidebarOpen ? 'rotate-180' : 'rotate-0'}`} 
              fill="none" 
              stroke="currentColor" 
              strokeWidth={2} 
              viewBox="0 0 24 24"
            >
              {sidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          
          <span>📒</span>
          <h1 className="text-xl font-semibold">
            {currentPage === 'notes' ? 'Notes' : 'Sticker'}
          </h1>
        </div>
        {!selectMode ? (
          <div className="flex items-center gap-2">
            {/* Search - Only show on notes page */}
            {currentPage === 'notes' && (
              <>
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
                      onClick={handleSearchClose}
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
                    className="text-gray-400 hover:bg-gray-400/10 p-2 rounded transition-colors"
                    title="Search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                )}

                {/* Refresh - Only show on notes page */}
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="text-sm text-green-400 hover:bg-green-400/10 p-2 rounded disabled:opacity-50 transition-colors"
                  title="Refresh"
                >
                  <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </>
            )}
          </div>
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

      {/* Main Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 flex flex-col gap-3 mx-auto w-full max-w-none sm:max-w-4xl lg:max-w-7xl xl:max-w-none hide-scrollbar"
      >
        {currentPage === 'sticker' ? (
          /* Sticker Page Content */
          <div className="flex flex-col items-center justify-center min-h-full py-8">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">WhatsApp Sticker</h2>
              
              {/* QR Code Section */}
              <div className="mb-6">
                <div className="bg-white rounded-lg p-4 flex items-center justify-center mb-4">
                  <div className="w-32 h-32 bg-gray-200 rounded border-2 border-dashed border-gray-400 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">QR Code</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm text-center">
                  Scan this QR code with your phone to add stickers to WhatsApp
                </p>
              </div>

              {/* Upload Section */}
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                <div className="mb-4">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-gray-300 mb-2">Drop images here or click to upload</p>
                <p className="text-gray-500 text-sm">PNG, JPG, GIF up to 10MB</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="sticker-upload"
                />
                <label
                  htmlFor="sticker-upload"
                  className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer transition-colors"
                >
                  Choose Files
                </label>
              </div>

              {/* Instructions */}
              <div className="mt-6 text-gray-400 text-sm">
                <p className="mb-2">How to use:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Upload your images</li>
                  <li>Scan the QR code with your phone</li>
                  <li>Add stickers to WhatsApp</li>
                </ol>
              </div>
            </div>
          </div>
        ) : (
          /* Notes Page Content */
          <>
            {loading ? (
              <p className="text-gray-400">Loading notes...</p>
            ) : filteredNotes.length === 0 ? (
              <p className="text-gray-500">{searchText ? 'No notes found.' : 'No notes yet.'}</p>
            ) : (
              filteredNotes.map((bubble, index) => {
            const selected = selectMode && selectedIds.includes(bubble.id)
            const originalIndex = notes.findIndex(n => n.id === bubble.id)
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
                  onMoveUp={!selectMode && !searchText ? handleMoveUp : undefined}
                  onMoveDown={!selectMode && !searchText ? handleMoveDown : undefined}
                  isFirst={originalIndex === 0}
                  isLast={originalIndex === notes.length - 1}
                  isEditing={editingNote?.id === bubble.id || editingTimeNote?.id === bubble.id}
                  selectMode={selectMode}
                  selected={selected}
                  searchText={searchText}
                  highlightSearchText={highlightSearchText}
                />
              </div>
            )
          })
        )}
          </>
        )}
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed z-30 bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700 transition top-14 right-3 sm:right-6 lg:right-8"
          aria-label="Scroll to bottom"
          title="Scroll to bottom"
        >
          ↓
        </button>
      )}

      {/* Input area wrapper - Only show on notes page */}
      {currentPage === 'notes' && (
        <div ref={inputWrapperRef} className="mx-auto w-full max-w-none sm:max-w-4xl lg:max-w-7xl xl:max-w-none">
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
      )}

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
                onClick={handleSearchClose}
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
            
            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-600 text-center text-gray-400 text-sm">
              Click on any note to view it in the main list
            </div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </main>
  )
}
