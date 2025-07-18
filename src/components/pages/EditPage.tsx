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
  
  // Video duration controls
  const [videoDuration, setVideoDuration] = useState(3.0)
  const [videoTotalDuration, setVideoTotalDuration] = useState(0)
  const [videoStartTime, setVideoStartTime] = useState(0)
  const [videoEndTime, setVideoEndTime] = useState(3.0)
  
  // Video Timeline Drag States
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false)
  const [dragType, setDragType] = useState<'start' | 'end' | 'bar' | null>(null)
  const [shouldUpdateVideo, setShouldUpdateVideo] = useState(true)
  
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

  // Video event handlers
  const handleVideoLoadedData = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement
    const duration = video.duration
    setVideoTotalDuration(duration)
    
    const defaultEnd = Math.min(3.0, duration)
    setVideoEndTime(defaultEnd)
    setVideoDuration(defaultEnd)
  }, [])

  const handleVideoTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement
    
    if (isDraggingTimeline || !shouldUpdateVideo) return
    
    if (video.currentTime >= videoEndTime) {
      video.currentTime = videoStartTime
    }
    
    if (video.currentTime < videoStartTime) {
      video.currentTime = videoStartTime
    }
  }, [videoStartTime, videoEndTime, isDraggingTimeline, shouldUpdateVideo])

  const handleVideoPlay = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement
    
    if (video.currentTime < videoStartTime || video.currentTime >= videoEndTime) {
      video.currentTime = videoStartTime
    }
  }, [videoStartTime, videoEndTime])

  // Timeline drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent, type: 'start' | 'end' | 'bar') => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDraggingTimeline(true)
    setDragType(type)
    setShouldUpdateVideo(false)
    
    const startX = e.clientX
    let startValue = 0
    
    if (type === 'start') {
      startValue = videoStartTime
    } else if (type === 'end') {
      startValue = videoEndTime
    } else if (type === 'bar') {
      startValue = videoStartTime
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const timelineElement = document.querySelector('.timeline-track')
      const timelineWidth = timelineElement ? timelineElement.clientWidth : 300
      const deltaTime = (deltaX / timelineWidth) * videoTotalDuration
      
      if (type === 'start') {
        const newStartTime = Math.max(0, Math.min(videoEndTime - 0.1, startValue + deltaTime))
        const newDuration = videoEndTime - newStartTime
        
        if (newDuration >= 0.1 && newDuration <= 4.9) {
          setVideoStartTime(newStartTime)
          setVideoDuration(newDuration)
        }
      } else if (type === 'end') {
        const newEndTime = Math.max(videoStartTime + 0.1, Math.min(videoTotalDuration, startValue + deltaTime))
        const newDuration = newEndTime - videoStartTime
        
        if (newDuration >= 0.1 && newDuration <= 4.9) {
          setVideoEndTime(newEndTime)
          setVideoDuration(newDuration)
        }
      } else if (type === 'bar') {
        const newStartTime = Math.max(0, Math.min(videoTotalDuration - videoDuration, startValue + deltaTime))
        const newEndTime = newStartTime + videoDuration
        
        if (newEndTime <= videoTotalDuration) {
          setVideoStartTime(newStartTime)
          setVideoEndTime(newEndTime)
        }
      }
    }
    
    const handleMouseUp = () => {
      setIsDraggingTimeline(false)
      setDragType(null)
      setShouldUpdateVideo(true)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      const videoElements = document.querySelectorAll('video')
      videoElements.forEach(video => {
        if (video.src && video.src.includes('blob:')) {
          video.currentTime = videoStartTime
        }
      })
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [videoStartTime, videoEndTime, videoTotalDuration, videoDuration])

  // Save and cancel handlers
  const handleSaveChanges = useCallback(() => {
    console.log('Saving changes:', { rotation, scale, position, videoDuration, videoStartTime, videoEndTime })
    setShowPreview(true)
  }, [rotation, scale, position, videoDuration, videoStartTime, videoEndTime])

  const handleCancelEdit = useCallback(() => {
    setRotation(0)
    setScale(100)
    setPosition({ x: 0, y: 0 })
    setVideoDuration(3.0)
    setVideoStartTime(0)
    setVideoEndTime(3.0)
    setShowPreview(false)
    onExitEdit()
  }, [onExitEdit])

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
      
      // Create MediaItem
      const mediaItem = {
        id: Math.random().toString(36).substring(2),
        type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
        url: urlData.publicUrl,
        storagePath: fileName,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        createdAt: new Date().toISOString(),
        editData: {
          rotation,
          scale,
          position,
          videoDuration,
          videoStartTime,
          videoEndTime
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
  }, [uploadedFiles, rotation, scale, position, videoDuration, videoStartTime, videoEndTime, onExitEdit])

  const handleBackToEdit = useCallback(() => {
    setShowPreview(false)
  }, [])

  // Auto-play video with looping
  useEffect(() => {
    if (uploadedFiles.length > 0 && uploadedFiles[0].type.startsWith('video/')) {
      const videoElements = document.querySelectorAll('video')
      videoElements.forEach(video => {
        if (video.src && video.src.includes('blob:')) {
          video.currentTime = videoStartTime
          video.play().catch(console.error)
        }
      })
    }
  }, [uploadedFiles, videoStartTime])

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
            onLoadedData={interactive ? handleVideoLoadedData : undefined}
            onTimeUpdate={interactive ? handleVideoTimeUpdate : undefined}
            onPlay={interactive ? handleVideoPlay : undefined}
            autoPlay={!interactive}
            loop={!interactive}
          />
        </div>
      )
    }
  }, [uploadedFiles, rotation, scale, position, handleContentMouseDown, handleVideoLoadedData, handleVideoTimeUpdate, handleVideoPlay])

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

              {/* Video Duration Controls - Only show for video files */}
              {uploadedFiles.length > 0 && uploadedFiles[0].type.startsWith('video/') && (
                <div className="space-y-3">
                  <div className="border-t border-gray-600 pt-3">
                    <h3 className="text-gray-300 text-sm font-medium mb-3">Video Duration</h3>
                    
                    {/* Duration: X.Xs */}
                    <div className="mb-3">
                      <span className="text-gray-300 text-sm">Duration: {videoDuration.toFixed(1)}s</span>
                    </div>

                    {/* Timeline with draggable yellow bar */}
                    <div className="relative select-none">
                      {/* Timeline track */}
                      <div className="timeline-track w-full h-2 bg-gray-600 rounded-full relative">
                        {/* Yellow selection bar */}
                        <div 
                          className={`absolute h-2 bg-yellow-400 rounded-full shadow-md transition-opacity ${
                            isDraggingTimeline ? 'opacity-80' : 'opacity-100'
                          } ${
                            dragType === 'bar' ? 'cursor-grabbing' : 'cursor-grab'
                          }`}
                          style={{
                            left: `${(videoStartTime / videoTotalDuration) * 100}%`,
                            width: `${(videoDuration / videoTotalDuration) * 100}%`
                          }}
                          onMouseDown={(e) => handleDragStart(e, 'bar')}
                        >
                          {/* Left handle */}
                          <div 
                            className="absolute w-4 h-4 bg-yellow-400 rounded-full -left-2 -top-1 cursor-ew-resize border-2 border-white hover:scale-110 transition-transform shadow-lg z-10"
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              handleDragStart(e, 'start')
                            }}
                          />
                          {/* Right handle */}
                          <div 
                            className="absolute w-4 h-4 bg-yellow-400 rounded-full -right-2 -top-1 cursor-ew-resize border-2 border-white hover:scale-110 transition-transform shadow-lg z-10"
                            onMouseDown={(e) => {
                              e.stopPropagation()
                              handleDragStart(e, 'end')
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Timeline labels */}
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0s</span>
                        <span>{videoTotalDuration.toFixed(1)}s</span>
                      </div>
                    </div>

                    {/* Start and End time display */}
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>Start: {videoStartTime.toFixed(1)}s</span>
                      <span>End: {videoEndTime.toFixed(1)}s</span>
                    </div>
                  </div>
                </div>
              )}
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
