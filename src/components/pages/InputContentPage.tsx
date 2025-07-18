'use client'

import { useState, useRef, useCallback } from 'react'

interface InputContentPageProps {
  onMenuToggle: () => void
  uploadedFiles: File[]
  onFileUpload: (files: File[]) => void
  onEditMode: () => void
  onBackToNotes: () => void
}

export default function InputContentPage({ 
  onMenuToggle, 
  uploadedFiles, 
  onFileUpload, 
  onEditMode, 
  onBackToNotes 
}: InputContentPageProps) {
  const [stickerPacks, setStickerPacks] = useState<Array<{ id: string; name: string; files: File[] }>>([])
  const [currentPackName, setCurrentPackName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return
    
    const fileArray = Array.from(files).filter(file => 
      file.type.startsWith('image/') || 
      file.type.startsWith('video/') || 
      file.type === 'video/mp4'
    )
    
    if (fileArray.length > 0) {
      onFileUpload(fileArray)
    }
  }, [onFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    handleFileUpload(files)
  }, [handleFileUpload])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    handleFileUpload(files)
  }, [handleFileUpload])

  const handleEditClick = useCallback(() => {
    if (uploadedFiles.length > 0) {
      onEditMode()
    }
  }, [uploadedFiles, onEditMode])

  const handleClearFiles = useCallback(() => {
    onBackToNotes()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onBackToNotes])

  const handleSendToWhatsApp = useCallback(() => {
    // TODO: Implement WhatsApp sending logic
    console.log('Sending to WhatsApp:', uploadedFiles)
    alert('Sending to WhatsApp!')
  }, [uploadedFiles])

  const handleUnlinkWhatsApp = useCallback(() => {
    // TODO: Implement WhatsApp unlinking logic
    console.log('Unlinking WhatsApp')
    alert('WhatsApp unlinked!')
  }, [])

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onMenuToggle}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">Upload Content</h1>
          </div>
          <button
            onClick={onBackToNotes}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Notes
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6">
          {/* Upload Area */}
          <div className="max-w-2xl mx-auto">
            {/* File Upload Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Upload Files</h2>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-lg mb-2">Drag and drop files here</p>
                <p className="text-gray-400 mb-4">or</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Browse Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Supported formats: Images (PNG, JPG, GIF) and Videos (MP4, MOV, AVI)
              </p>
            </div>

            {/* Uploaded Files Preview */}
            {uploadedFiles.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Uploaded Files ({uploadedFiles.length})</h2>
                  <button
                    onClick={handleClearFiles}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Clear All
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg overflow-hidden">
                      <div className="aspect-video bg-gray-700 flex items-center justify-center">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        ) : file.type === 'video/mp4' ? (
                          <div className="relative w-full h-full bg-[#2a2a2a] flex items-center justify-center">
                            <video 
                              src={URL.createObjectURL(file)}
                              className="w-full h-full object-contain"
                              style={{ maxWidth: '100%', maxHeight: '192px' }}
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-400">
                            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-400">
                          {file.type} • {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-4">
                <button
                  onClick={handleEditClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Edit Content
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleSendToWhatsApp}
                    disabled={uploadedFiles.length === 0}
                    className={`py-3 px-6 rounded-lg font-medium transition-colors ${
                      uploadedFiles.length === 0
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    Send to WhatsApp
                  </button>
                  
                  <button
                    onClick={handleUnlinkWhatsApp}
                    className="py-3 px-6 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    Unlink WhatsApp
                  </button>
                </div>
              </div>
            )}

            {/* Instructions */}
            {uploadedFiles.length === 0 && (
              <div className="text-center text-gray-400 mt-8">
                <h3 className="text-lg font-medium mb-2">Get Started</h3>
                <p className="mb-4">
                  Upload images or videos to create WhatsApp stickers.
                </p>
                <ul className="text-sm space-y-1">
                  <li>• Drag and drop files or click to browse</li>
                  <li>• Supported: PNG, JPG, GIF, MP4, MOV, AVI</li>
                  <li>• Edit your content before sending</li>
                  <li>• Send directly to WhatsApp</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
