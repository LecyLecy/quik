'use client'

import { useState, useRef, useCallback } from 'react'
import Header from '@/components/Header'
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection'
import { useRealWhatsApp } from '@/hooks/useRealWhatsApp'

interface InputContentPageProps {
  onMenuToggle: () => void
  sidebarOpen: boolean
  uploadedFiles: File[]
  onFileUpload: (files: File[]) => void
  onEditMode: () => void
  onClearFiles: () => void
  onWhatsAppUnlink: () => void
}

export default function InputContentPage({ 
  onMenuToggle, 
  sidebarOpen,
  uploadedFiles, 
  onFileUpload, 
  onEditMode, 
  onClearFiles,
  onWhatsAppUnlink
}: InputContentPageProps) {
  const { connection, unlinkWhatsApp } = useWhatsAppConnection()
  const { status: realWhatsAppStatus, sendSticker, disconnectWhatsApp } = useRealWhatsApp()
  const [isDragging, setIsDragging] = useState(false)
  const [showUnlinkModal, setShowUnlinkModal] = useState(false)
  const [isSendingSticker, setIsSendingSticker] = useState(false)
  const [sendStatus, setSendStatus] = useState<{ message: string; isError: boolean } | null>(null)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
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

  const handleSendSticker = async () => {
    if (!uploadedFiles[0] || !realWhatsAppStatus.isReady) return

    setIsSendingSticker(true)
    setSendStatus(null)

    try {
      // Convert file to base64
      const file = uploadedFiles[0]
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string
        
        const result = await sendSticker(base64Data)
        
        if (result.success) {
          setSendStatus({ message: 'Sticker sent successfully! 🎉', isError: false })
        } else {
          setSendStatus({ message: result.error || 'Failed to send sticker', isError: true })
        }
        
        setIsSendingSticker(false)
        
        // Clear status after 3 seconds
        setTimeout(() => setSendStatus(null), 3000)
      }
      
      reader.readAsDataURL(file)
    } catch (_error) {
      setSendStatus({ message: 'Failed to send sticker', isError: true })
      setIsSendingSticker(false)
      setTimeout(() => setSendStatus(null), 3000)
    }
  }

  const handleClearFiles = useCallback(() => {
    onClearFiles()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onClearFiles])

  const handleConfirmUnlink = useCallback(async () => {
    try {
      setIsDisconnecting(true)
      
      // Disconnect from real WhatsApp (this will logout properly)
      await disconnectWhatsApp()
      
      // Also clear the demo connection state for compatibility
      unlinkWhatsApp()
      
      setShowUnlinkModal(false)
      onWhatsAppUnlink() // Navigate back to QR code page
    } catch (error) {
      console.error('Failed to disconnect WhatsApp:', error)
      // Still proceed with demo unlink
      unlinkWhatsApp()
      setShowUnlinkModal(false)
      onWhatsAppUnlink()
    } finally {
      setIsDisconnecting(false)
    }
  }, [disconnectWhatsApp, unlinkWhatsApp, onWhatsAppUnlink])

  const handleCancelUnlink = useCallback(() => {
    setShowUnlinkModal(false)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <Header 
        emoji="🎨"
        title="Sticker"
        onMenuToggle={onMenuToggle}
        sidebarOpen={sidebarOpen}
        rightContent={
          (connection.isLinked || realWhatsAppStatus.isReady) && (
            <div className="flex items-center gap-3">
              {/* WhatsApp Connection Status */}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-300">
                  Connected to {realWhatsAppStatus.isReady ? (realWhatsAppStatus.phoneNumber || 'WhatsApp') : (connection.phoneNumber || 'WhatsApp')}
                </span>
              </div>
            </div>
          )
        }
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6 bg-black flex items-center justify-center">
          <div className="max-w-md w-full">
            {uploadedFiles.length > 0 ? (
              // WhatsApp Sticker Preview
              <div className="bg-[#1e1e1e] rounded-lg p-6 text-center">
                <h2 className="text-xl font-bold text-white mb-6">WhatsApp Sticker</h2>
                
                {/* Image Preview with overlay buttons */}
                <div className="relative mb-4">
                  <div 
                    className={`border-2 border-dashed rounded-lg p-6 text-center bg-gray-700/20 min-h-[200px] flex items-center justify-center transition-colors ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {uploadedFiles[0].type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(uploadedFiles[0])}
                        alt={uploadedFiles[0].name}
                        className="max-w-full max-h-[160px] object-contain mx-auto"
                      />
                    ) : (
                      <div className="relative">
                        <video
                          src={URL.createObjectURL(uploadedFiles[0])}
                          className="max-w-full max-h-[160px] object-contain mx-auto"
                          muted
                        />
                        {/* Play icon overlay for video */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/50 rounded-full p-3">
                            <svg 
                              className="w-8 h-8 text-white" 
                              fill="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Red X button on top-right inside the box */}
                  <button
                    onClick={handleClearFiles}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                  >
                    ×
                  </button>
                  
                  {/* Replace button on bottom-right inside the box */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors shadow-lg"
                  >
                    Replace
                  </button>
                  
                  {/* Filename at bottom left */}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {uploadedFiles[0].name}
                  </div>
                </div>
                
                {/* Send Status */}
                {sendStatus && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${
                    sendStatus.isError 
                      ? 'bg-red-900/50 border border-red-500 text-red-200' 
                      : 'bg-green-900/50 border border-green-500 text-green-200'
                  }`}>
                    {sendStatus.message}
                  </div>
                )}
                
                {/* Send Sticker Button */}
                {realWhatsAppStatus.isReady ? (
                  <button
                    onClick={handleSendSticker}
                    disabled={isSendingSticker}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-medium transition-colors mb-4 flex items-center justify-center gap-2"
                  >
                    {isSendingSticker ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        📱 Send to WhatsApp
                      </>
                    )}
                  </button>
                ) : (
                  <div className="w-full bg-gray-700 text-gray-400 py-3 px-6 rounded-lg font-medium mb-4 text-center text-sm">
                    WhatsApp not connected
                  </div>
                )}
                
                {/* Edit button */}
                <button
                  onClick={handleEditClick}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white py-3 px-6 rounded-lg font-medium transition-colors mb-4"
                >
                  Edit
                </button>
                
                {/* Unlink WhatsApp button */}
                <button
                  onClick={() => setShowUnlinkModal(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Unlink WhatsApp
                </button>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              // Upload Area
              <div className="bg-[#1e1e1e] rounded-lg p-8 text-center">
                <h2 className="text-xl font-bold text-white mb-6">WhatsApp Sticker</h2>
                
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
                  <p className="text-lg mb-2 text-white">Drag and drop files here</p>
                  <p className="text-gray-400 mb-4">or</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors mb-4"
                  >
                    Browse Files
                  </button>
                  <p className="text-sm text-gray-400">
                    Supported formats: Images (PNG, JPG, GIF) and Videos (MP4, MOV, AVI)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
                
                {/* Edit button - disabled/dark when no image */}
                <button
                  disabled
                  className="w-full bg-gray-800 text-gray-500 py-3 px-6 rounded-lg font-medium cursor-not-allowed mb-4 mt-4"
                >
                  Edit
                </button>
                
                {/* Unlink WhatsApp button */}
                <button
                  onClick={() => setShowUnlinkModal(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                >
                  Unlink WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Unlink Confirmation Modal */}
      {showUnlinkModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Unlink WhatsApp?
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to unlink your WhatsApp account? This will properly logout from WhatsApp Web and remove your device from the linked devices list.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelUnlink}
                disabled={isDisconnecting}
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUnlink}
                disabled={isDisconnecting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDisconnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Logging out...
                  </>
                ) : (
                  'Unlink'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
