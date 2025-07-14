'use client'

import BaseModal from '@/components/BaseModal'
import type { MediaItem } from '@/types/note'
import DocumentPreview from '@/components/DocumentPreview'

interface GalleryModalProps {
  open: boolean
  items: MediaItem[]
  description: string
  onClose: () => void
  onItemClick: (item: MediaItem) => void
  onRequestDownload?: (item: MediaItem) => void
  onRequestDelete?: (item: MediaItem) => void
}

export default function GalleryModal({
  open,
  items,
  description,
  onClose,
  onItemClick,
  onRequestDownload,
  onRequestDelete,
}: GalleryModalProps) {
  return (
    <BaseModal isOpen={open} onClose={onClose} showBackButton={false}>
      <div
        className="bg-[#1e1e1e] rounded-xl max-w-[90vw] sm:max-w-[600px] w-full"
        style={{ maxHeight: 640, minHeight: 350, position: 'relative' }}
      >
        {/* Header: Back + Description */}
        <div
          className="sticky top-0 left-0 w-full flex items-center px-4 gap-2 z-10 bg-[#1e1e1e]"
          style={{ minHeight: 48 }}
        >
          <button
            onClick={onClose}
            className="text-white text-base bg-gray-800 px-4 py-1 rounded"
          >
            Back
          </button>
          <span
            className="text-white text-base font-medium truncate"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
            }}
            title={description}
          >
            {description}
          </span>
        </div>
        {/* Grid Gallery, scrollable */}
        <div
          className="p-4 pt-0"
          style={{
            height: 500,
            overflowY: 'auto'
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => {
              const ext = item.fileName?.split('.').pop() || item.type

              return (
                <div
                  key={item.id}
                  className="relative bg-[#2c2c2c] rounded overflow-hidden cursor-pointer w-40 h-40 sm:w-52 sm:h-52 flex items-center justify-center group"
                  onClick={() => onItemClick(item)}
                  title={item.fileName}
                >
                  {/* FILE TYPE */}
                  <span className="absolute top-1 left-2 z-20 text-xs text-gray-400 lowercase bg-black/60 px-2 py-0.5 rounded select-none">
                    {ext}
                  </span>

                  {/* Download & Delete icon */}
                  <div className="absolute top-1 right-1 z-20 flex gap-2">
                    {onRequestDownload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRequestDownload(item)
                        }}
                        className="text-green-400 bg-black/60 rounded-full p-1 hover:bg-black/90"
                        title="Download"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                        </svg>
                      </button>
                    )}
                    {/* Delete hanya muncul jika items.length > 1 */}
                    {onRequestDelete && items.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onRequestDelete(item)
                        }}
                        className="text-red-500 bg-black/60 rounded-full p-1 hover:bg-black/90"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* PREVIEW */}
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.fileName} className="object-cover w-full h-full" />
                  ) : item.type === 'gif' ? (
                    <img src={item.url} alt={item.fileName} className="object-contain w-full h-full" />
                  ) : item.type === 'video' ? (
                    <>
                      <video
                        src={item.url}
                        className="w-full h-full object-cover rounded"
                        muted
                        preload="metadata"
                        controls={false}
                        style={{ pointerEvents: 'none' }}
                        poster={undefined}
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
                  ) : (
                    <DocumentPreview 
                      fileName={item.fileName} 
                      fileSize={item.fileSize}
                      compact={false}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </BaseModal>
  )
}
