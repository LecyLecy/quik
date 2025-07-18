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
      <div className="bg-[#1e1e1e] rounded-xl shadow-2xl border border-gray-700 mx-auto max-w-fit min-w-[300px] max-w-[95vw] sm:max-w-[85vw] lg:max-w-[800px]">
        {/* Header: Back + Description */}
        <div className="flex items-center px-4 py-3 gap-3 border-b border-gray-700 bg-[#1e1e1e] rounded-t-xl">
          <button
            onClick={onClose}
            className="text-white bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-colors flex items-center justify-center"
            title="Back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span
            className="text-white text-base font-medium truncate flex-1"
            title={description}
          >
            {description}
          </span>
        </div>
        
        {/* Content: Grid Gallery */}
        <div className="p-4">
          <div className={`grid gap-3 ${
            items.length === 1 ? 'grid-cols-1' : 
            items.length === 2 ? 'grid-cols-2' : 
            items.length <= 4 ? 'grid-cols-2' : 
            'grid-cols-2 sm:grid-cols-3'
          }`}>
            {items.map((item) => {
              const ext = item.fileName?.split('.').pop() || item.type

              return (
                <div
                  key={item.id}
                  className="relative bg-[#2c2c2c] rounded overflow-hidden cursor-pointer aspect-square flex items-center justify-center group"
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
                        className="w-6 h-6 flex items-center justify-center bg-green-600 hover:bg-green-500 rounded text-white transition-colors"
                        title="Download"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
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
                        className="w-6 h-6 flex items-center justify-center bg-red-600 hover:bg-red-500 rounded text-white transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
