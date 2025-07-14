// src/components/ImageModal.tsx
'use client'

import { useEffect } from 'react'

interface Props {
  imageUrl: string
  onClose: () => void
}

export default function ImageModal({ imageUrl, onClose }: Props) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 left-4 text-white text-sm bg-gray-800 px-3 py-1 rounded"
      >
        Back
      </button>

      <img
        src={imageUrl}
        alt="Preview"
        className="max-w-full max-h-full rounded-lg shadow-lg"
      />
    </div>
  )
}
