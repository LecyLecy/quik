'use client'

import { useState, useEffect } from 'react'
import type { NoteBubble as NoteBubbleType, MediaItem } from '@/types/note'
import ImageModal from '@/components/ImageModal'
import MediaModal from '@/components/MediaModal'
import GalleryModal from '@/components/GalleryModal'
import DownloadAndDeleteConfirmationModal from '@/components/DownloadAndDeleteConfirmationModal'
import Linkify from 'react-linkify'
import { supabase } from '@/lib/supabase/client'
import { updateNoteBubble } from '@/hooks/useSaveNote'

interface NoteBubbleProps {
  bubble: NoteBubbleType
  onRequestDelete?: (bubble: NoteBubbleType) => void
  onRequestEdit?: (bubble: NoteBubbleType) => void
  isEditing?: boolean
  selectMode?: boolean
  selected?: boolean
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

export default function NoteBubble({ bubble, onRequestDelete, onRequestEdit, isEditing, selectMode = false, selected = false }: NoteBubbleProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'video' | 'gif' | null>(null)
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )
  const [isExpanded, setIsExpanded] = useState(false)
  const [countdownText, setCountdownText] = useState('')
  const [showGallery, setShowGallery] = useState(false)

  // Download & Delete modal state
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [downloadTarget, setDownloadTarget] = useState<MediaItem | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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

  const isMobile = windowWidth <= 768
  const previewLimit = isMobile ? 4 : 6

  const visibleItems = bubble.contents.slice(0, previewLimit)
  const extraCount = bubble.contents.length - visibleItems.length

  const shouldTruncate = bubble.description && bubble.description.length > 200
  const displayText =
    isExpanded || !shouldTruncate
      ? bubble.description
      : bubble.description?.slice(0, 200) + '...'

  const handleMediaClick = (item: MediaItem) => {
    if (item.type === 'image' || item.type === 'gif' || item.type === 'video') {
      setPreviewUrl(item.url)
      setPreviewType(item.type)
    }
    // Add document preview logic here if needed
  }

  // Handler hapus konten (bubble dan storage)
  const handleDeleteContent = async (item: MediaItem) => {
    await supabase.storage.from('notes-media').remove([item.storagePath])
    const newContents = bubble.contents.filter(i => i.id !== item.id)
    await updateNoteBubble(bubble.id, bubble.description || '', newContents)
    if (typeof window !== "undefined") window.location.reload()
  }

  return (
    <>
<div
  className={`
    rounded-xl p-4 mb-3 shadow-sm w-fit 
    max-w-[90vw] sm:max-w-[600px] 
    relative transition-all duration-200 
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
              {displayText}
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
          <div className={`grid gap-3 mt-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-3'}`}>
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
                  className="relative bg-[#2c2c2c] rounded cursor-pointer overflow-hidden w-40 h-40 sm:w-52 sm:h-52 hover:scale-105 transition-transform duration-150"
                >
                  {/* Icon download & delete untuk multi konten */}
                  {bubble.contents.length > 1 && !isLastVisible && (
                    <div className="absolute top-1 right-1 z-20 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDownloadTarget(item)
                          setDownloadModalOpen(true)
                        }}
                        className="text-green-400 bg-black/60 rounded-full p-1 hover:bg-black/90"
                        title="Download"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(item)
                          setDeleteModalOpen(true)
                        }}
                        className="text-red-500 bg-black/60 rounded-full p-1 hover:bg-black/90 ml-1"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
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
                          className="h-10 w-10 text-white opacity-75"
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
                    <div className="flex flex-col justify-center items-center h-full w-full text-white text-xs">
                      <div className="text-4xl mb-1">📄</div>
                      <p className="truncate w-full">{item.fileName}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Timestamp + Actions */}
<div className="flex items-center justify-between mt-2">
  {/* Checkbox centang */}
  {selectMode ? (
    <span
      className={`
        w-6 h-6 flex items-center justify-center 
        rounded bg-gray-800 border-2 border-gray-600
        ${selected ? 'border-green-500 bg-green-700 text-white' : ''}
        mr-2
      `}
    >
      {selected && (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </span>
  ) : (
    <span className="w-6 h-6 mr-2" />
  )}

  {/* Timestamp + Actions */}
  <div className="flex-1 flex justify-end items-center gap-2 text-xs text-gray-400">
    <span>
      {new Date(bubble.createdAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      })}
    </span>
    {/* Download untuk bubble satu konten */}
    {bubble.contents.length === 1 && (
      <button
        onClick={() => {
          setDownloadTarget(bubble.contents[0])
          setDownloadModalOpen(true)
        }}
        className="text-green-400 hover:underline text-xs"
        disabled={selectMode}
      >
        Download
      </button>
    )}
    {!isEditing && (
      <button
        onClick={() => onRequestEdit && onRequestEdit(bubble)}
        disabled={!onRequestEdit || selectMode}
        className="text-blue-400 hover:underline text-xs disabled:opacity-50"
      >
        Edit
      </button>
    )}
    <button
      onClick={() => onRequestDelete && onRequestDelete(bubble)}
      disabled={!onRequestDelete || selectMode}
      className="text-red-400 hover:underline text-xs disabled:opacity-50"
    >
      Delete
    </button>
  </div>
</div>

      </div>

      {/* Preview modals */}
      {previewUrl && previewType === 'image' && (
        <ImageModal imageUrl={previewUrl} onClose={() => setPreviewUrl(null)} />
      )}

      {previewUrl && (previewType === 'video' || previewType === 'gif') && (
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
            } catch (err) {
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
}
