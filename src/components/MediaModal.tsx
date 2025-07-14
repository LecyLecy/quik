'use client'

import { useEffect } from 'react'

interface MediaModalProps {
  mediaUrl: string
  type: 'image' | 'video' | 'gif'
  onClose: () => void
}

export default function MediaModal({ mediaUrl, type, onClose }: MediaModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {type === 'image' && (
          <img
            src={mediaUrl}
            alt="media preview"
            className="max-w-full max-h-full rounded"
          />
        )}

        {(type === 'video' || type === 'gif') && (
          <video
            src={mediaUrl}
            controls
            autoPlay={type === 'gif'}
            loop={type === 'gif'}
            className="max-w-full max-h-full rounded"
          />
        )}

        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-75"
          aria-label="Close media preview"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
