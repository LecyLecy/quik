'use client'

import { useState, useCallback, useEffect } from 'react'
import Header from '@/components/Header'
import { supabase } from '@/lib/supabase/client'
import { saveNoteBubble } from '@/hooks/useSaveNote'

interface EditPageProps {
  uploadedFiles: File[]
  onExitEdit: () => void
}

export default function EditPage({ uploadedFiles, onExitEdit }: EditPageProps) {
  // Edit parameters
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(100)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDraggingContent, setIsDraggingContent] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  
  // ============================================================================
  // 🎬 VIDEO DURATION TRIMMER - STATE VARIABLES
  // ============================================================================
  // New simplified approach with two sliders
  const [videoDuration, setVideoDuration] = useState(3.0)        // How long the sticker should be (0.1s - 4.9s or video end)
  const [videoStartPoint, setVideoStartPoint] = useState(0)      // Where in the video to start (0s to video end)
  const [videoTotalDuration, setVideoTotalDuration] = useState(0) // Total video duration from metadata
  // ============================================================================
  
  // Preview state
  const [showPreview, setShowPreview] = useState(false)

  // Handle global mouse events for content dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingContent) return
      e.preventDefault()
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }

    const handleGlobalMouseUp = () => {
      setIsDraggingContent(false)
    }

    if (isDraggingContent) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDraggingContent, dragStart])

  // Handle content dragging
  const handleContentMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsDraggingContent(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }, [position])

  const handleContentMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingContent) return
    e.preventDefault()
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }, [isDraggingContent, dragStart])

  const handleContentMouseUp = useCallback(() => {
    setIsDraggingContent(false)
  }, [])

  // Handle rotation
  const handleRotateClick = useCallback(() => {
    const newRotation = (rotation + 90) % 360
    setRotation(newRotation)
  }, [rotation])

  // ============================================================================
  // 🎬 VIDEO DURATION TRIMMER - EVENT HANDLERS
  // ============================================================================
  
  /**
   * 📹 Video Loaded Data Handler - Set total duration and initialize defaults
   */
  const handleVideoLoadedData = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement
    const duration = video.duration
    console.log('Video loaded, duration:', duration)
    setVideoTotalDuration(duration)
    
    // Only set default values on first load, don't override user adjustments
    // The initial state is already set in useState declarations
  }, [])

  /**
   * ⏰ Preview Video Time Update Handler - Loop video within selected range for preview
   */
  const handlePreviewVideoTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement
    const actualEndTime = Math.min(videoStartPoint + videoDuration, videoTotalDuration)
    
    // If video goes beyond our selection, loop back to start point
    if (video.currentTime >= actualEndTime) {
      video.currentTime = videoStartPoint
    }
    
    // If video is before our start point, jump to start point
    if (video.currentTime < videoStartPoint) {
      video.currentTime = videoStartPoint
    }
  }, [videoStartPoint, videoDuration, videoTotalDuration])

  /**
   * ⏰ Video Time Update Handler - Loop video within selected range
   */
  const handleVideoTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement
    const actualEndTime = Math.min(videoStartPoint + videoDuration, videoTotalDuration)
    
    // If video goes beyond our selection, loop back to start point
    if (video.currentTime >= actualEndTime) {
      video.currentTime = videoStartPoint
    }
    
    // If video is before our start point, jump to start point
    if (video.currentTime < videoStartPoint) {
      video.currentTime = videoStartPoint
    }
  }, [videoStartPoint, videoDuration, videoTotalDuration])

  /**
   * ▶️ Video Play Handler - Ensure video starts at correct position
   */
  const handleVideoPlay = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement
    const actualEndTime = Math.min(videoStartPoint + videoDuration, videoTotalDuration)
    
    // If current time is outside our selection, reset to start point
    if (video.currentTime < videoStartPoint || video.currentTime >= actualEndTime) {
      video.currentTime = videoStartPoint
    }
  }, [videoStartPoint, videoDuration, videoTotalDuration])

  // ============================================================================
  
  // ============================================================================

  // ============================================================================

  // ============================================================================
  // 🎬 VIDEO DURATION TRIMMER - SAVE & CANCEL HANDLERS
  // ============================================================================
  
  /**
   * 💾 Save Changes Handler
   * Saves all edit parameters including video duration settings
   */
  const handleSaveChanges = useCallback(() => {
    const actualEndTime = Math.min(videoStartPoint + videoDuration, videoTotalDuration)
    console.log('Saving changes:', { 
      rotation, 
      scale, 
      position, 
      videoDuration, 
      videoStartPoint, 
      videoEndPoint: actualEndTime 
    })
    setShowPreview(true)
  }, [rotation, scale, position, videoDuration, videoStartPoint, videoTotalDuration])

  /**
   * ❌ Cancel Edit Handler  
   * Reset all parameters to default values
   */
  const handleCancelEdit = useCallback(() => {
    setRotation(0)
    setScale(100)
    setPosition({ x: 0, y: 0 })
    // Reset duration trimmer to default values
    setVideoDuration(3.0)
    setVideoStartPoint(0)
    setShowPreview(false)
    onExitEdit()
  }, [onExitEdit])
  
  // ============================================================================

  /**
   * 📤 Confirm Send Handler
   * Upload file ke Supabase dan create note dengan edit data termasuk duration trimmer settings
   * EditData yang disimpan: rotation, scale, position, videoDuration, videoStartTime, videoEndTime
   */
  const handleConfirmSend = useCallback(async () => {
    try {
      // Convert the File to a proper MediaItem by uploading to Supabase
      const file = uploadedFiles[0]
      const fileExtension = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExtension}`
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('notes-media')
        .upload(fileName, file)
      
      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Failed to upload file. Please try again.')
        return
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('notes-media')
        .getPublicUrl(fileName)
      
      // Create MediaItem with edit data including duration trimmer settings
      const actualEndTime = Math.min(videoStartPoint + videoDuration, videoTotalDuration)
      const mediaItem = {
        id: Math.random().toString(36).substring(2),
        type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
        url: urlData.publicUrl,
        storagePath: fileName,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        createdAt: new Date().toISOString(),
        // 🎬 DURATION TRIMMER DATA - Save all settings for future reference
        editData: {
          rotation,
          scale,
          position,
          videoDuration,      // Selected duration (0.1s - 4.9s)
          videoStartPoint,    // Start point in video 
          videoEndPoint: actualEndTime // Calculated end point
        }
      }
      
      // Create the note
      const newNote = {
        id: Math.random().toString(36).substring(2),
        description: `Sticker created on ${new Date().toLocaleDateString()}`,
        contents: [mediaItem],
        createdAt: new Date().toISOString(),
        order: Date.now(),
        isCountdown: false,
        countdownDate: undefined
      }
      
      // Save to database
      await saveNoteBubble(newNote)
      
      alert('Sticker sent successfully!')
      onExitEdit()
    } catch (error) {
      console.error('Error sending sticker:', error)
      alert('Failed to send sticker. Please try again.')
    }
  }, [uploadedFiles, rotation, scale, position, videoDuration, videoStartPoint, videoTotalDuration, onExitEdit])

  const handleBackToEdit = useCallback(() => {
    setShowPreview(false)
  }, [])

  // ============================================================================
  // 🎬 VIDEO DURATION TRIMMER - AUTO-PLAY EFFECT
  // ============================================================================
  
  /**
   * ▶️ Auto-play Video Effect
   * Automatically set video to start point and play when component mounts or parameters change
   */
  useEffect(() => {
    if (uploadedFiles.length > 0 && uploadedFiles[0].type.startsWith('video/')) {
      const videoElements = document.querySelectorAll('video')
      videoElements.forEach(video => {
        if (video.src && video.src.includes('blob:')) {
          video.currentTime = videoStartPoint // Set to start point
          video.play().catch(console.error)
        }
      })
    }
  }, [uploadedFiles, videoStartPoint, videoDuration]) // Re-run when start point OR duration changes
  
  /**
   * 🎬 Auto-play on Edit Mode Entry
   * Start video playing when entering edit mode (including returning from send)
   */
  useEffect(() => {
    // Small delay to ensure video elements are rendered
    const timer = setTimeout(() => {
      if (uploadedFiles.length > 0 && uploadedFiles[0].type.startsWith('video/')) {
        const videoElements = document.querySelectorAll('video')
        videoElements.forEach(video => {
          if (video.src && video.src.includes('blob:')) {
            video.currentTime = videoStartPoint
            video.play().catch(console.error)
          }
        })
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, []) // Run once when component mounts (entering edit mode)
  
  /**
   * 🎬 Auto-play when returning from Preview
   * Start video playing when going back from preview mode to edit mode
   */
  useEffect(() => {
    // Only trigger when showPreview becomes false (returning from preview)
    if (!showPreview && uploadedFiles.length > 0 && uploadedFiles[0].type.startsWith('video/')) {
      const timer = setTimeout(() => {
        const videoElements = document.querySelectorAll('video')
        videoElements.forEach(video => {
          if (video.src && video.src.includes('blob:')) {
            video.currentTime = videoStartPoint
            video.play().catch(console.error)
          }
        })
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [showPreview, uploadedFiles, videoStartPoint]) // Trigger when showPreview changes
  
  /**
   * 🎬 Auto-play Preview at Start Point
   * Start preview video at selected start point when entering preview mode
   */
  useEffect(() => {
    // When entering preview mode, set video to start point
    if (showPreview && uploadedFiles.length > 0 && uploadedFiles[0].type.startsWith('video/')) {
      const timer = setTimeout(() => {
        const videoElements = document.querySelectorAll('video')
        videoElements.forEach(video => {
          if (video.src && video.src.includes('blob:')) {
            video.currentTime = videoStartPoint
            video.play().catch(console.error)
          }
        })
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [showPreview, videoStartPoint, uploadedFiles]) // Trigger when entering preview mode
  
  // ============================================================================

  // Render content helper
  const renderContent = useCallback((interactive: boolean = true) => {
    if (uploadedFiles.length === 0) return null
    
    const file = uploadedFiles[0]
    const commonStyle = {
      transform: `rotate(${rotation}deg) scale(${scale / 100})`,
      left: `calc(50% + ${position.x}px)`,
      top: `calc(50% + ${position.y}px)`,
      transformOrigin: 'center',
      translate: '-50% -50%'
    }

    if (file.type.startsWith('image/')) {
      return (
        <img 
          src={URL.createObjectURL(file)}
          alt="Sticker content"
          className={`absolute select-none ${interactive ? 'cursor-move' : 'pointer-events-none'}`}
          style={commonStyle}
          onMouseDown={interactive ? handleContentMouseDown : undefined}
          draggable={false}
        />
      )
    } else {
      return (
        <div 
          className={`absolute select-none ${interactive ? 'cursor-move' : 'pointer-events-none'}`}
          style={commonStyle}
          onMouseDown={interactive ? handleContentMouseDown : undefined}
        >
          <video 
            src={URL.createObjectURL(file)}
            className="block"
            style={{ width: '256px', height: '256px', objectFit: 'contain' }}
            muted
            // 🎬 DURATION TRIMMER - Video Event Handlers
            onLoadedData={interactive ? handleVideoLoadedData : undefined}     // Set total duration dan default selection
            onTimeUpdate={interactive ? handleVideoTimeUpdate : handlePreviewVideoTimeUpdate}     // Loop video dalam selection range
            onPlay={interactive ? handleVideoPlay : undefined}                 // Ensure correct start position
            autoPlay={!interactive}  // Auto-play untuk preview mode
            loop={!interactive}      // Loop untuk preview mode
          />
        </div>
      )
    }
  }, [uploadedFiles, rotation, scale, position, handleContentMouseDown, handleVideoLoadedData, handleVideoTimeUpdate, handleVideoPlay, handlePreviewVideoTimeUpdate])

  if (uploadedFiles.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-black text-white">
        <Header 
          emoji="✏️"
          title="Edit Sticker"
          showBackButton={true}
          onBackClick={onExitEdit}
          onMenuToggle={() => {}}
          sidebarOpen={false}
        />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">No file to edit</p>
        </div>
      </div>
    )
  }

  // Show preview mode
  if (showPreview) {
    return (
      <>
        {/* Main edit page content */}
        <div className="flex flex-col h-screen bg-black text-white">
          <Header 
            emoji="✏️"
            title="Edit Sticker"
            showBackButton={true}
            onBackClick={onExitEdit}
            onMenuToggle={() => {}}
            sidebarOpen={false}
          />

          <div className="flex-1 overflow-y-auto p-6 bg-black">
            <div className="max-w-md mx-auto">
              <div className="bg-[#1e1e1e] rounded-lg p-6">
                {/* Edit Preview Container - 512x512 with crop */}
                <div className="relative bg-[#2a2a2a] rounded-lg overflow-hidden flex items-center justify-center" style={{ width: '384px', height: '384px', margin: '0 auto' }}>
                  {/* 512x512 Crop Box */}
                  <div 
                    className="relative border-2 border-blue-400 border-dashed bg-transparent overflow-hidden cursor-move"
                    style={{ width: '256px', height: '256px' }}
                  >
                    {/* Content that can be dragged */}
                    {uploadedFiles[0].type.startsWith('image/') ? (
                      <img 
                        src={URL.createObjectURL(uploadedFiles[0])}
                        alt="Current sticker"
                        className="absolute cursor-move select-none"
                        style={{ 
                          transform: `rotate(${rotation}deg) scale(${scale / 100})`,
                          left: `calc(50% + ${position.x}px)`,
                          top: `calc(50% + ${position.y}px)`,
                          transformOrigin: 'center',
                          translate: '-50% -50%'
                        }}
                        draggable={false}
                      />
                    ) : (
                      <div 
                        className="absolute cursor-move select-none"
                        style={{ 
                          transform: `rotate(${rotation}deg) scale(${scale / 100})`,
                          left: `calc(50% + ${position.x}px)`,
                          top: `calc(50% + ${position.y}px)`,
                          transformOrigin: 'center',
                          translate: '-50% -50%'
                        }}
                      >
                        <video 
                          src={URL.createObjectURL(uploadedFiles[0])}
                          className="block"
                          style={{ width: '256px', height: '256px', objectFit: 'contain' }}
                          muted
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Modal - Blurred Overlay */}
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] rounded-lg p-6 max-w-sm w-full mx-4 border border-gray-700">
            <h2 className="text-lg font-semibold mb-4 text-center text-white">Final Sticker Preview</h2>
            
            {/* Final Sticker Preview - 512x512 */}
            <div 
              className="relative rounded-lg overflow-hidden flex items-center justify-center mb-6 border-2 border-dashed border-gray-500" 
              style={{ 
                width: '256px', 
                height: '256px', 
                margin: '0 auto',
                backgroundImage: `
                  linear-gradient(45deg, #666 25%, transparent 25%),
                  linear-gradient(-45deg, #666 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #666 75%),
                  linear-gradient(-45deg, transparent 75%, #666 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
              }}
            >
              {/* Cropped content preview - only show what's inside the crop area */}
              <div 
                className="relative overflow-hidden"
                style={{ width: '256px', height: '256px' }}
              >
                {renderContent(false)}
              </div>
              
              {/* Size indicator */}
              <div className="absolute bottom-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                512x512
              </div>
            </div>

            <div className="text-center text-gray-400 text-sm mb-6">
              Checkered areas show transparent background • Only content is visible
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleConfirmSend}
                className="w-full py-3 px-4 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                📤 Send Sticker
              </button>
              <button
                onClick={handleBackToEdit}
                className="w-full py-2 px-4 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      <Header 
        emoji="✏️"
        title="Edit Sticker"
        showBackButton={true}
        onBackClick={onExitEdit}
        onMenuToggle={() => {}}
        sidebarOpen={false}
      />

      <div className="flex-1 overflow-y-auto p-6 bg-black">
        <div className="max-w-md mx-auto">
          <div className="bg-[#1e1e1e] rounded-lg p-6">
            {/* Edit Preview Container - 512x512 with crop */}
            <div className="relative bg-[#2a2a2a] rounded-lg overflow-hidden flex items-center justify-center" style={{ width: '384px', height: '384px', margin: '0 auto' }}>
              {/* 512x512 Crop Box */}
              <div 
                className="relative border-2 border-blue-400 border-dashed bg-transparent overflow-hidden cursor-move"
                style={{ width: '256px', height: '256px' }}
                onMouseMove={handleContentMouseMove}
                onMouseUp={handleContentMouseUp}
                onMouseLeave={handleContentMouseUp}
              >
                {/* Content that can be dragged */}
                {renderContent(true)}
                
                {/* Crop Box Info */}
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded pointer-events-none">
                  512x512
                </div>
              </div>
              
              {/* Instructions */}
              <div className="absolute bottom-2 left-2 right-2 text-center text-gray-400 text-xs">
                Drag to position • Only content inside the blue box will be sent
              </div>
            </div>

            {/* Edit Options */}
            <div className="space-y-4 mt-6">
              <div className="flex justify-center">
                <button 
                  onClick={handleRotateClick}
                  className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-lg font-medium transition-colors"
                >
                  🔄 Rotate
                </button>
              </div>

              {/* Scale Slider */}
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">
                    Size: {scale}%
                  </label>
                  <input 
                    type="range" 
                    min="25" 
                    max="200" 
                    value={scale}
                    onChange={(e) => setScale(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Small</span>
                    <span>Large</span>
                  </div>
                </div>
              </div>

              {/* ================================================================ */}
              {/* 🎬 VIDEO DURATION TRIMMER - TWO SLIDER APPROACH */}
              {/* ================================================================ */}
              {/* Video Duration Controls - Only show for video files */}
              {uploadedFiles.length > 0 && uploadedFiles[0].type.startsWith('video/') && (
                <div className="space-y-4">
                  <div className="border-t border-gray-600 pt-4">
                    <h3 className="text-gray-300 text-sm font-medium mb-4">Video Duration Settings</h3>
                    
                    {/* 📊 Current Settings Display */}
                    <div className="bg-gray-800/50 rounded-lg p-3 mb-4 text-xs">
                      <div className="grid grid-cols-2 gap-2 text-gray-300">
                        <div>Duration: <span className="text-white font-medium">{videoDuration.toFixed(1)}s</span></div>
                        <div>Start Point: <span className="text-white font-medium">{videoStartPoint.toFixed(1)}s</span></div>
                        <div>End Point: <span className="text-white font-medium">{Math.min(videoStartPoint + videoDuration, videoTotalDuration).toFixed(1)}s</span></div>
                        <div>Video Length: <span className="text-white font-medium">{(videoTotalDuration || 0).toFixed(1)}s</span></div>
                      </div>
                    </div>

                    {/* 🎚️ Duration Slider */}
                    <div className="space-y-2 mb-4">
                      <label className="block text-gray-300 text-sm">
                        Sticker Duration: {videoDuration.toFixed(1)}s
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max={Math.min(4.9, videoTotalDuration || 4.9)}
                        step="0.1"
                        value={videoDuration}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          setVideoDuration(newValue);
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0.1s</span>
                        <span>{Math.min(4.9, videoTotalDuration || 4.9).toFixed(1)}s</span>
                      </div>
                    </div>

                    {/* 🎚️ Start Point Slider */}
                    <div className="space-y-2">
                      <label className="block text-gray-300 text-sm">
                        Start Point: {videoStartPoint.toFixed(1)}s
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, (videoTotalDuration || 10) - 0.1)}
                        step="0.1"
                        value={videoStartPoint}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          setVideoStartPoint(newValue);
                        }}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0s</span>
                        <span>{(videoTotalDuration || 10).toFixed(1)}s</span>
                      </div>
                    </div>

                    {/* 📋 Preview Info */}
                    <div className="mt-3 p-2 bg-blue-900/20 rounded text-xs text-blue-300">
                      💡 Your sticker will play from {videoStartPoint.toFixed(1)}s to {Math.min(videoStartPoint + videoDuration, videoTotalDuration).toFixed(1)}s
                    </div>
                  </div>
                </div>
              )}
              {/* ================================================================ */}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mt-6">
              <button
                onClick={handleSaveChanges}
                className="w-full py-3 px-4 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                Send
              </button>
              <button
                onClick={handleCancelEdit}
                className="w-full py-2 px-4 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
