'use client'

interface DocumentPreviewProps {
  fileName?: string
  fileSize?: number
  className?: string
  compact?: boolean
}

export default function DocumentPreview({ 
  fileName = 'Document', 
  fileSize, 
  className = '', 
  compact = false 
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
    <div className={`flex flex-col justify-center items-center h-full w-full text-white ${className}`}>
      {/* Document Icon */}
      <div className={`${compact ? 'text-5xl mb-2' : 'text-3xl mb-1'} opacity-80`}>
        📄
      </div>
      
      {/* File Extension Badge */}
      <div className={`${compact ? 'mb-2' : 'mb-1'}`}>
        <span className={`inline-block bg-blue-600 text-white font-semibold rounded px-2 py-1 uppercase ${compact ? 'text-xs' : 'text-[9px]'}`}>
          {getFileExtension()}
        </span>
      </div>
      
      {/* File Name */}
      <p className={`text-center px-1 ${compact ? 'text-sm mb-1' : 'text-[10px] mb-0.5'} leading-tight`}>
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
}
