'use client'

import BaseModal from '@/components/BaseModal'

interface MediaModalProps {
  mediaUrl: string
  type: 'image' | 'video' | 'gif'
  onClose: () => void
}

export default function MediaModal({ mediaUrl, type, onClose }: MediaModalProps) {
  return (
    <BaseModal isOpen={true} onClose={onClose} showBackButton={false}>
      <div className="bg-[#1e1e1e] rounded-xl shadow-2xl border border-gray-700 max-w-fit max-h-[90vh] overflow-hidden">
        {/* Header with close button */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-colors flex items-center justify-center"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="text-white text-sm font-medium">
              {type === 'video' ? 'Video Preview' : type === 'gif' ? 'GIF Preview' : 'Image Preview'}
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {(type === 'image' || type === 'gif') && (
            <img
              src={mediaUrl}
              alt="media preview"
              className="max-w-full max-h-[70vh] rounded object-contain"
            />
          )}

          {type === 'video' && (
            <video
              src={mediaUrl}
              controls
              autoPlay
              className="max-w-full max-h-[70vh] rounded"
            />
          )}
        </div>
      </div>
    </BaseModal>
  )
}
