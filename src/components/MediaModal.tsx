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
      <button
        onClick={onClose}
        className="absolute top-4 left-4 text-white text-sm bg-gray-800 px-3 py-1 rounded"
      >
        Back
      </button>

      <div
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {(type === 'image' || type === 'gif') && (
          <img
            src={mediaUrl}
            alt="media preview"
            className="max-w-full max-h-full rounded"
          />
        )}

        {type === 'video' && (
          <video
            src={mediaUrl}
            controls
            autoPlay
            className="max-w-full max-h-full rounded"
          />
        )}
      </div>
    </div>
  )
}
