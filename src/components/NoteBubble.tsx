'use client'

import { useState, useEffect, memo, useCallback, useMemo } from 'react'
import type { NoteBubble as NoteBubbleType, MediaItem } from '@/types/note'
import MediaModal from '@/components/MediaModal'
import GalleryModal from '@/components/GalleryModal'
import DownloadAndDeleteConfirmationModal from '@/components/DownloadAndDeleteConfirmationModal'
import DocumentPreview from '@/components/DocumentPreview'
import { useWindowWidth } from '@/hooks/useWindowWidth'
import { useDeviceType, isMobileOrTablet } from '@/hooks/useDeviceType'
import { useDocumentHandler } from '@/hooks/useDocumentHandler'
import Linkify from 'react-linkify'
import { supabase } from '@/lib/supabase/client'
import { updateNoteBubble } from '@/hooks/useSaveNote'

interface NoteBubbleProps {
  bubble: NoteBubbleType
  onRequestDelete?: (bubble: NoteBubbleType) => void
  onRequestEdit?: (bubble: NoteBubbleType) => void
  onRequestEditTime?: (bubble: NoteBubbleType) => void
  onOptimisticEdit?: (bubble: NoteBubbleType) => void
  onMoveUp?: (bubble: NoteBubbleType) => void
  onMoveDown?: (bubble: NoteBubbleType) => void
  isFirst?: boolean
  isLast?: boolean
  isEditing?: boolean
  selectMode?: boolean
  selected?: boolean
  searchText?: string
  highlightSearchText?: (text: string, searchTerm: string) => React.ReactNode
}

function formatCountdown(targetDate: Date) {
  const now = new Date()
  const diffMs = targetDate.getTime() - now.getTime()

  if (diffMs <= 0) return '0:0 minutes'

  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffDay >= 365) {
    const years = Math.floor(diffDay / 365)
    return `${years} year${years === 1 ? '' : 's'}`
  } else if (diffDay >= 30) {
    const months = Math.floor(diffDay / 30)
    return `${months} month${months === 1 ? '' : 's'}`
  } else if (diffDay >= 7) {
    const weeks = Math.floor(diffDay / 7)
    return `${weeks} week${weeks === 1 ? '' : 's'}`
  } else if (diffDay >= 1) {
    return `${diffDay} day${diffDay === 1 ? '' : 's'}`
  } else if (diffHour >= 1) {
    const h = diffHour
    const m = diffMin % 60
    return `${h}:${m} hours`
  } else {
    const m = diffMin
    const s = diffSec % 60
    return `${m}:${s} minutes`
  }
}

const NoteBubble = memo(function NoteBubble({ 
  bubble, 
  onRequestDelete, 
  onRequestEdit, 
  onRequestEditTime,
  onOptimisticEdit,
  onMoveUp,
  onMoveDown,
  isFirst = false,
  isLast = false,
  isEditing, 
  selectMode = false, 
  selected = false,
  searchText,
  highlightSearchText
}: NoteBubbleProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [countdownText, setCountdownText] = useState('')
  const [copyFeedback, setCopyFeedback] = useState('')
  
  // Keep existing state for now, gradually migrate
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'video' | 'gif' | null>(null)
  const [showGallery, setShowGallery] = useState(false)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [downloadTarget, setDownloadTarget] = useState<MediaItem | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null)
  
  // Use window width hook
  const { isMobile, isTablet } = useWindowWidth()
  
  // Use device type and document handler hooks
  const deviceType = useDeviceType()
  const { downloadProgress, openDocumentInBrowser, openDocumentViewer } = useDocumentHandler()

  // Memoize expensive calculations
  const gridCols = useMemo(() => isMobile ? 2 : isTablet ? 3 : 4, [isMobile, isTablet])
  
  const calculatePreviewLimit = useCallback(() => {
    const totalItems = bubble.contents.length
    
    // If we have very few items, show all
    if (totalItems <= gridCols) {
      return totalItems
    }
    
    // Calculate maximum items we can show in 2 rows
    const maxItemsIn2Rows = gridCols * 2
    
    // If total items fit exactly in 1-2 rows, show all
    if (totalItems <= maxItemsIn2Rows) {
      return totalItems
    }
    
    // If we have more than 2 rows worth, show full 2 rows
    // The "+X" overlay will appear over the last visible item
    return maxItemsIn2Rows
  }, [bubble.contents.length, gridCols])

  const previewLimit = useMemo(() => calculatePreviewLimit(), [calculatePreviewLimit])
  const visibleItems = useMemo(() => bubble.contents.slice(0, previewLimit), [bubble.contents, previewLimit])
  const extraCount = useMemo(() => bubble.contents.length - visibleItems.length, [bubble.contents.length, visibleItems.length])

  const { shouldTruncate, displayText } = useMemo(() => {
    const truncate = bubble.description && bubble.description.length > 200
    const text = isExpanded || !truncate
      ? bubble.description
      : bubble.description?.slice(0, 200) + '...'
    return { shouldTruncate: truncate, displayText: text }
  }, [bubble.description, isExpanded])

  // Optimized event listeners
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewUrl(null)
        setPreviewType(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    if (bubble.isCountdown && bubble.countdownDate) {
      const updateCountdown = () => {
        const targetDate = new Date(bubble.countdownDate!)
        setCountdownText(formatCountdown(targetDate))
      }

      updateCountdown()
      const interval = setInterval(updateCountdown, 1000)
      return () => clearInterval(interval)
    }
  }, [bubble.isCountdown, bubble.countdownDate])

  const handleMediaClick = useCallback((item: MediaItem) => {
    if (item.type === 'image' || item.type === 'gif' || item.type === 'video') {
      setPreviewUrl(item.url)
      setPreviewType(item.type)
    } else if (item.type === 'document') {
      // Handle document click based on device type
      if (isMobileOrTablet(deviceType)) {
        // Mobile/Tablet: Download with progress, then open viewer
        openDocumentViewer(item.url, item.fileName || 'document')
      } else {
        // Desktop: Open directly in browser
        openDocumentInBrowser(item.url)
      }
    }
  }, [deviceType, openDocumentViewer, openDocumentInBrowser])

  // Handler hapus konten (bubble dan storage) - optimized with optimistic updates
  const handleDeleteContent = useCallback(async (item: MediaItem) => {
    try {
      const newContents = bubble.contents.filter(i => i.id !== item.id)
      
      // Optimistic update - update UI immediately
      const updatedBubble = { ...bubble, contents: newContents }
      onOptimisticEdit?.(updatedBubble)
      
      // Then update database and storage
      await Promise.all([
        supabase.storage.from('notes-media').remove([item.storagePath]),
        updateNoteBubble(bubble.id, bubble.description || '', newContents)
      ])
    } catch (error) {
      console.error('Error deleting content:', error)
      // Could revert optimistic update here if needed
    }
  }, [bubble, onOptimisticEdit])

  // Optimize copy functionality
  const handleCopy = useCallback(async () => {
    if (!bubble.description) return
    
    try {
      await navigator.clipboard.writeText(bubble.description)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = bubble.description
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
    
    // Create feedback message
    const truncatedDesc = bubble.description.length > 30 
      ? bubble.description.substring(0, 30) + '...' 
      : bubble.description
    
    setCopyFeedback(`"${truncatedDesc}" copied`)
    
    // Clear feedback after 2 seconds
    setTimeout(() => setCopyFeedback(''), 2000)
  }, [bubble.description])

  // Check if bubble contains documents
  const hasDocuments = useMemo(() => 
    bubble.contents.some(item => item.type === 'document'), 
    [bubble.contents]
  )

  return (
    <>
<div
  className={`
    rounded-xl p-3 sm:p-4 mb-3 shadow-sm 
    inline-block max-w-full overflow-hidden
    sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl
    relative transition-all duration-200 
    ${hasDocuments ? 'min-w-[300px] sm:min-w-[350px]' : 'min-w-0'}
    ${isEditing ? 'bg-[#004d40] border border-teal-400' : 'bg-[#1e1e1e]'} text-white
    ${selectMode && selected ? 'outline outline-2 outline-green-500' : ''}
  `}
>

        {/* Description with clickable links */}
        {bubble.description && (
          <div className="mb-2 whitespace-pre-wrap break-words">
            <Linkify
              componentDecorator={(decoratedHref, decoratedText, key) => (
                <a
                  href={decoratedHref}
                  key={key}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 underline"
                >
                  {decoratedText}
                </a>
              )}
            >
              {searchText && searchText.trim() && highlightSearchText ? 
                highlightSearchText(displayText || '', searchText.trim()) : 
                displayText}
            </Linkify>
            {shouldTruncate && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-400 hover:underline mt-1 block"
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}

        {/* Copy feedback */}
        {copyFeedback && (
          <div className="mb-2 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
            {copyFeedback}
          </div>
        )}

        {/* Countdown bubble */}
        {bubble.isCountdown && bubble.countdownDate && (
          <div className="text-center my-4">
            <div className="text-3xl font-bold">{countdownText}</div>
            <div className="text-xs text-gray-400 mt-1">
              {(() => {
                const d = new Date(bubble.countdownDate)
                const timeStr = d.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
                const dayStr = d.toLocaleDateString('id-ID', { weekday: 'long' })
                const dateStr = d.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                })
                return `${timeStr} - ${dayStr} - ${dateStr}`
              })()}
            </div>
          </div>
        )}

        {/* Media contents */}
        {!bubble.isCountdown && bubble.contents.length > 0 && (
          <div className={`grid gap-1 sm:gap-2 mt-3 ${
            // Dynamic grid columns based on actual content count
            bubble.contents.length === 1 
              ? 'grid-cols-1 max-w-fit'
              : isMobile 
                ? 'grid-cols-2' 
                : isTablet 
                  ? 'grid-cols-3' 
                  : 'grid-cols-4'
          }`}>
            {visibleItems.map((item, index) => {
              const isLastVisible = index === visibleItems.length - 1 && extraCount > 0
              const isVideo = item.type === 'video'
              const isGif = item.type === 'gif'

              const handleThisMediaClick = isLastVisible
                ? () => setShowGallery(true)
                : () => handleMediaClick(item)

              return (
                <div
                  key={item.id}
                  onClick={handleThisMediaClick}
                  className="relative bg-[#2c2c2c] rounded cursor-pointer overflow-hidden aspect-square hover:scale-105 transition-transform duration-150 max-h-[200px]"
                >
                  {/* Icon download & delete untuk multi konten */}
                  {bubble.contents.length > 1 && !isLastVisible && (
                    <div className="absolute top-1 right-1 z-20 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDownloadTarget(item)
                          setDownloadModalOpen(true)
                        }}
                        className="w-6 h-6 flex items-center justify-center bg-green-600 hover:bg-green-500 rounded text-white transition-colors"
                        title="Download"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(item)
                          setDeleteModalOpen(true)
                        }}
                        className="w-6 h-6 flex items-center justify-center bg-red-600 hover:bg-red-500 rounded text-white transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {isLastVisible && (
                    <div className="absolute inset-0 bg-black/60 text-white text-xl font-bold flex items-center justify-center z-20">
                      +{extraCount}
                    </div>
                  )}

                  {/* FILE TYPE BADGE */}
                  <span className="absolute top-1 left-2 z-20 text-xs text-gray-400 lowercase bg-black/60 px-2 py-0.5 rounded select-none">
                    {(() => {
                      const ext = item.fileName?.split('.').pop() || item.type
                      return ext
                    })()}
                  </span>

                  {isVideo && (
                    <>
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                        controls={false}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMediaClick(item)
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 sm:h-10 sm:w-10 text-white opacity-75"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-6.518-3.75A1 1 0 007 8.25v7.5a1 1 0 001.234.97l6.518-1.98a1 1 0 00.75-.97v-3.6a1 1 0 00-.25-.992z" />
                        </svg>
                      </div>
                    </>
                  )}

                  {isGif && (
                    <img
                      src={item.url}
                      alt={item.fileName}
                      className="w-full h-full object-contain"
                    />
                  )}

                  {!isVideo && !isGif && item.type === 'image' && (
                    <img
                      src={item.url}
                      alt={item.fileName}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {item.type === 'document' && (
                    <DocumentPreview 
                      fileName={item.fileName} 
                      fileSize={item.fileSize}
                      compact={true}
                      isDownloading={downloadProgress.isDownloading && downloadProgress.fileName === item.fileName}
                      downloadProgress={downloadProgress.progress}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Timestamp + Actions */}
<div className="flex items-center justify-between mt-2">
  {/* Selection checkbox - only shown in select mode */}
  {selectMode && (
    <div className="flex items-center">
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-2
        ${selected ? 'bg-green-500 border-green-500' : 'border-gray-400 bg-gray-800'}`}>
        {selected && (
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
    </div>
  )}
  
  {/* Timestamp + Actions */}
  <div className="flex-1 flex justify-end items-center gap-2 text-xs text-gray-400">
    <span>
      {(() => {
        const date = new Date(bubble.createdAt)
        const day = date.getDate().toString().padStart(2, '0')
        const month = date.toLocaleString('en-US', { month: 'short' })
        const year = date.getFullYear().toString().slice(-2)
        const time = date.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        })
        return `${day} ${month} ${year} ${time}`
      })()}
    </span>
    {/* Download untuk bubble satu konten */}
    {bubble.contents.length === 1 && (
      <button
        onClick={() => {
          setDownloadTarget(bubble.contents[0])
          setDownloadModalOpen(true)
        }}
        className="w-6 h-6 flex items-center justify-center bg-green-600 hover:bg-green-500 rounded text-white transition-colors cursor-pointer"
        disabled={selectMode}
        title="Download"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
        </svg>
      </button>
    )}
    {/* Edit Time untuk countdown bubble */}
    {bubble.isCountdown && !isEditing && (
      <button
        onClick={() => onRequestEditTime && onRequestEditTime(bubble)}
        disabled={!onRequestEditTime || selectMode}
        className="w-6 h-6 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded text-white disabled:opacity-50 transition-colors cursor-pointer"
        title="Edit Time"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    )}
    {/* Edit button hanya untuk non-countdown bubble */}
    {!bubble.isCountdown && !isEditing && (
      <button
        onClick={() => onRequestEdit && onRequestEdit(bubble)}
        disabled={!onRequestEdit || selectMode}
        className="w-6 h-6 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded text-white disabled:opacity-50 transition-colors cursor-pointer"
        title="Edit"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    )}

    {/* Copy description button */}
    {bubble.description && !selectMode && (
      <button
        onClick={handleCopy}
        className="w-6 h-6 flex items-center justify-center bg-gray-600 hover:bg-gray-500 rounded text-white transition-colors cursor-pointer"
        title="Copy description"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    )}
    
    {/* Reorder buttons */}
    {!selectMode && (
      <>
        <button
          onClick={() => onMoveUp && onMoveUp(bubble)}
          disabled={isFirst || !onMoveUp}
          className="w-6 h-6 flex items-center justify-center bg-purple-600 hover:bg-purple-500 rounded text-white disabled:opacity-30 transition-colors cursor-pointer"
          title="Move up"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={() => onMoveDown && onMoveDown(bubble)}
          disabled={isLast || !onMoveDown}
          className="w-6 h-6 flex items-center justify-center bg-purple-600 hover:bg-purple-500 rounded text-white disabled:opacity-30 transition-colors cursor-pointer"
          title="Move down"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </>
    )}
    
    <button
      onClick={() => onRequestDelete && onRequestDelete(bubble)}
      disabled={!onRequestDelete || selectMode}
      className="w-6 h-6 flex items-center justify-center bg-red-600 hover:bg-red-500 rounded text-white disabled:opacity-50 transition-colors cursor-pointer"
      title="Delete"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>
</div>

      </div>

      {/* Preview modals */}
      {previewUrl && previewType && (
        <MediaModal
          mediaUrl={previewUrl}
          type={previewType}
          onClose={() => {
            setPreviewUrl(null)
            setPreviewType(null)
          }}
        />
      )}

      {/* Gallery modal */}
      {showGallery && (
        <GalleryModal
          open={showGallery}
          items={bubble.contents}
          description={bubble.description || ''}
          onClose={() => setShowGallery(false)}
          onItemClick={(item) => {
            setShowGallery(false)
            handleMediaClick(item)
          }}
          onRequestDownload={(item) => {
            setShowGallery(false)
            setDownloadTarget(item)
            setDownloadModalOpen(true)
          }}
          onRequestDelete={(item) => {
            setShowGallery(false)
            setDeleteTarget(item)
            setDeleteModalOpen(true)
          }}
          downloadProgress={downloadProgress}
        />
      )}

      {/* Download Confirmation modal */}
      {downloadModalOpen && downloadTarget && (
        <DownloadAndDeleteConfirmationModal
          open={downloadModalOpen}
          content={downloadTarget}
          bubbleDescription={bubble.description || ''}
          onClose={() => {
            setDownloadModalOpen(false)
            setDownloadTarget(null)
          }}
          onAction={async (fileName) => {
            setDownloadModalOpen(false)
            setDownloadTarget(null)
            try {
              const response = await fetch(downloadTarget.url)
              const blob = await response.blob()
              const url = window.URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = (fileName as string) || downloadTarget.fileName || 'download'
              document.body.appendChild(a)
              a.click()
              setTimeout(() => {
                window.URL.revokeObjectURL(url)
                a.remove()
              }, 200)
            } catch {
              alert('Failed to download file!')
            }
          }}
          actionLabel="Download"
          showInput={true}
        />
      )}

      {/* Delete Confirmation modal */}
      {deleteModalOpen && deleteTarget && (
        <DownloadAndDeleteConfirmationModal
          open={deleteModalOpen}
          content={deleteTarget}
          bubbleDescription={bubble.description || ''}
          onClose={() => {
            setDeleteModalOpen(false)
            setDeleteTarget(null)
          }}
          onAction={async () => {
            setDeleteModalOpen(false)
            setDeleteTarget(null)
            await handleDeleteContent(deleteTarget)
          }}
          actionLabel="Delete"
          showInput={false}
        />
      )}
    </>
  )
})

export default NoteBubble
