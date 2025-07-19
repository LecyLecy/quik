'use client'

import { memo } from 'react'

interface DocumentPreviewProps {
  fileName?: string
  fileSize?: number
  className?: string
  compact?: boolean
  onClick?: () => void
  isDownloading?: boolean
  downloadProgress?: number
}

const DocumentPreview = memo(function DocumentPreview({ 
  fileName = 'Document', 
  fileSize, 
  className = '', 
  compact = false,
  onClick,
  isDownloading = false,
  downloadProgress = 0
}: DocumentPreviewProps) {
  const getFileExtension = () => {
    const ext = fileName.split('.').pop()?.toLowerCase() || 'file'
    return ext.length > 4 ? ext.slice(0, 4) : ext
  }

  const formatFileSize = (size?: number) => {
    if (!size) return ''
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const truncateFileName = (name: string, maxLength: number) => {
    if (name.length <= maxLength) return name
    const ext = name.split('.').pop()
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'))
    const truncatedName = nameWithoutExt.substring(0, maxLength - ext!.length - 4)
    return `${truncatedName}...${ext}`
  }

  // For bubble (compact=true): larger text, more space
  // For gallery modal (compact=false): smaller text, less space
  const maxFileNameLength = compact ? 20 : 25
  const displayFileName = truncateFileName(fileName, maxFileNameLength)

  return (
    <div 
      className={`relative flex flex-col justify-center items-center h-full w-full min-h-[120px] aspect-square text-white ${onClick ? 'cursor-pointer hover:bg-gray-800/50 transition-colors' : ''} ${className}`}
      onClick={onClick}
    >
      {/* Download Progress Overlay */}
      {isDownloading && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10 rounded">
          <div className="relative w-16 h-16 mb-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-600"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-500"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${downloadProgress}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-white">{downloadProgress}%</span>
            </div>
          </div>
          <span className="text-xs text-gray-300">Downloading...</span>
        </div>
      )}

      {/* Document Icon */}
      <div className={`${compact ? 'text-4xl mb-1' : 'text-3xl mb-1'} opacity-80`}>
        📄
      </div>
      
      {/* File Extension Badge */}
      <div className={`${compact ? 'mb-1' : 'mb-1'}`}>
        <span className={`inline-block bg-blue-600 text-white font-semibold rounded px-2 py-1 uppercase ${compact ? 'text-xs' : 'text-[9px]'}`}>
          {getFileExtension()}
        </span>
      </div>
      
      {/* File Name */}
      <p className={`text-center px-1 ${compact ? 'text-xs mb-1 h-8' : 'text-[10px] mb-0.5 h-6'} leading-tight flex items-center justify-center`}>
        {displayFileName}
      </p>
      
      {/* File Size */}
      {fileSize && (
        <p className={`text-gray-300 ${compact ? 'text-xs' : 'text-[9px]'}`}>
          {formatFileSize(fileSize)}
        </p>
      )}
    </div>
  )
})

export default DocumentPreview
