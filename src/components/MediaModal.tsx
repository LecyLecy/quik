'use client'

import BaseModal from '@/components/BaseModal'

interface MediaModalProps {
  mediaUrl: string
  type: 'image' | 'video' | 'gif'
  onClose: () => void
}

export default function MediaModal({ mediaUrl, type, onClose }: MediaModalProps) {
  return (
    <BaseModal isOpen={true} onClose={onClose}>
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
    </BaseModal>
  )
}
