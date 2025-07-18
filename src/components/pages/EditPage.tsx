'use client'

import { useState, useCallback, useEffect } from 'react'
import Header from '@/components/Header'

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
  const [videoCurrentTime, setVideoCurrentTime] = useState(0)
  const [videoTotalDuration, setVideoTotalDuration] = useState(0)
  const [videoStartTime, setVideoStartTime] = useState(0)
  const [videoEndTime, setVideoEndTime] = useState(3.0)
  
  // Video Timeline Drag States
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false)
  const [dragType, setDragType] = useState<'start' | 'end' | 'bar' | null>(null)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartValue, setDragStartValue] = useState(0)
  const [dragStartTime, setDragStartTime] = useState(0)
  const [shouldUpdateVideo, setShouldUpdateVideo] = useState(true)

  // Reset all edit parameters
  const resetEditParameters = useCallback(() => {
    setRotation(0)
    setScale(100)
    setPosition({ x: 0, y: 0 })
    setVideoDuration(3.0)
    setVideoStartTime(0)
    setVideoEndTime(3.0)
  }, [])

  // Handle content dragging
  const handleContentMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDraggingContent(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
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
    setRotation(prev => (prev + 90) % 360)
  }, [])

  // Video handlers
  const handleVideoLoadedData = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement
    const duration = video.duration
    setVideoTotalDuration(duration)
    
    // Set initial end time based on available duration
    const defaultEnd = Math.min(3.0, duration)
    setVideoEndTime(defaultEnd)
    setVideoDuration(defaultEnd)
    
    console.log('Video loaded, duration:', duration)
  }, [])

  const handleDurationChange = useCallback((newDuration: number) => {
    // Ensure duration is within bounds
    const clampedDuration = Math.max(0.1, Math.min(4.9, newDuration))
    setVideoDuration(clampedDuration)
    
    // Adjust end time if needed
    const maxEndTime = Math.min(videoStartTime + clampedDuration, videoTotalDuration)
    setVideoEndTime(maxEndTime)
    
    console.log('Duration changed to:', clampedDuration)
  }, [videoStartTime, videoTotalDuration])

  const handleStartTimeChange = useCallback((newStartTime: number) => {
    const clampedStartTime = Math.max(0, Math.min(videoTotalDuration - 0.1, newStartTime))
    setVideoStartTime(clampedStartTime)
    
    // Adjust end time to maintain duration
    const newEndTime = Math.min(clampedStartTime + videoDuration, videoTotalDuration)
    setVideoEndTime(newEndTime)
    
    console.log('Start time changed to:', clampedStartTime)
  }, [videoDuration, videoTotalDuration])

  const handleEndTimeChange = useCallback((newEndTime: number) => {
    const clampedEndTime = Math.max(videoStartTime + 0.1, Math.min(videoTotalDuration, newEndTime))
    setVideoEndTime(clampedEndTime)
    
    // Update duration based on new end time
    const newDuration = clampedEndTime - videoStartTime
    setVideoDuration(newDuration)
    
    console.log('End time changed to:', clampedEndTime)
  }, [videoStartTime, videoTotalDuration])

  // Handle video time updates for looping
  const handleVideoTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement
    
    // Don't update video time if user is dragging slider
    if (isDraggingTimeline || !shouldUpdateVideo) return
    
    // If we're in edit mode and video time exceeds end time, loop back to start
    if (video.currentTime >= videoEndTime) {
      video.currentTime = videoStartTime
    }
    
    // Also ensure video doesn't go before start time
    if (video.currentTime < videoStartTime) {
      video.currentTime = videoStartTime
    }
  }, [videoStartTime, videoEndTime, isDraggingTimeline, shouldUpdateVideo])

  // Handle video play event to ensure it starts at the correct time
  const handleVideoPlay = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement
    
    // When video plays in edit mode, ensure it starts at the start time
    if (video.currentTime < videoStartTime || video.currentTime >= videoEndTime) {
      video.currentTime = videoStartTime
    }
  }, [videoStartTime, videoEndTime])

  // Video Timeline Drag Handlers
  const handleDragStart = useCallback((e: React.MouseEvent, type: 'start' | 'end' | 'bar') => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Drag started:', type)
    
    setIsDraggingTimeline(true)
    setDragType(type)
    setShouldUpdateVideo(false) // Stop video updates during drag
    
    const startX = e.clientX
    let startValue = 0
    
    if (type === 'start') {
      startValue = videoStartTime
    } else if (type === 'end') {
      startValue = videoEndTime
    } else if (type === 'bar') {
      startValue = videoStartTime
    }
    
    // Handle mouse move
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const timelineElement = document.querySelector('.timeline-track')
      const timelineWidth = timelineElement ? timelineElement.clientWidth : 300
      const deltaTime = (deltaX / timelineWidth) * videoTotalDuration
      
      console.log('Dragging:', type, deltaX, deltaTime)
      
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
      console.log('Drag ended')
      setIsDraggingTimeline(false)
      setDragType(null)
      setShouldUpdateVideo(true) // Resume video updates after drag
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      // Update video position after drag ends
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

  // Reset video time when start time changes
  useEffect(() => {
    if (uploadedFiles.length > 0 && uploadedFiles[0].type.startsWith('video/')) {
      const videoElements = document.querySelectorAll('video')
      videoElements.forEach(video => {
        if (video.src && video.src.includes('blob:')) {
          video.currentTime = videoStartTime
        }
      })
    }
  }, [videoStartTime, uploadedFiles])

  const handleSaveChanges = useCallback(() => {
    // TODO: Apply all edits and save
    console.log('Saving changes:', { rotation, scale, position, videoDuration, videoStartTime, videoEndTime })
    alert('Changes saved successfully!')
    onExitEdit()
  }, [rotation, scale, position, videoDuration, videoStartTime, videoEndTime, onExitEdit])

  const handleCancelEdit = useCallback(() => {
    resetEditParameters()
    onExitEdit()
  }, [resetEditParameters, onExitEdit])

  if (uploadedFiles.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-gray-900 text-white">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">No Content to Edit</h2>
            <p className="text-gray-400 mb-6">Please upload some content first.</p>
            <button
              onClick={onExitEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Go to Upload
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <Header 
        emoji="✏️"
        title="Edit"
        onMenuToggle={() => {}} // Not used in EditPage
        sidebarOpen={false} // Not used in EditPage
        showBackButton={true}
        onBackClick={onExitEdit}
        rightContent={
          <div className="flex gap-2">
            <button
              onClick={handleCancelEdit}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveChanges}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>
        }
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex bg-black">
          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center bg-[#1a1a1a] relative">
            <div className="relative">
              {/* Blue box outline - 512x512 */}
              <div className="w-[512px] h-[512px] border-2 border-dashed border-blue-500 relative">
                {/* Content inside the blue box */}
                <div
                  className="absolute cursor-move"
                  style={{
                    left: `calc(50% + ${position.x}px)`,
                    top: `calc(50% + ${position.y}px)`,
                    transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale / 100})`,
                    transformOrigin: 'center'
                  }}
                  onMouseDown={handleContentMouseDown}
                  onMouseMove={handleContentMouseMove}
                  onMouseUp={handleContentMouseUp}
                >
                  {uploadedFiles[0].type.startsWith('image/') ? (
                    <img
                      src={URL.createObjectURL(uploadedFiles[0])}
                      alt="Sticker preview"
                      className="block"
                      style={{ width: '256px', height: '256px', objectFit: 'contain' }}
                    />
                  ) : (
                    <video 
                      src={URL.createObjectURL(uploadedFiles[0])}
                      className="block"
                      style={{ width: '256px', height: '256px', objectFit: 'contain' }}
                      muted
                      onLoadedData={handleVideoLoadedData}
                      onTimeUpdate={handleVideoTimeUpdate}
                      onPlay={handleVideoPlay}
                    />
                  )}
                </div>
              </div>
              
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

          {/* Controls Panel */}
          <div className="w-80 bg-black border-l border-gray-800 p-6 overflow-y-auto">
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
            <div className="space-y-3 mt-8">
              <button
                onClick={handleSaveChanges}
                className="w-full py-3 px-4 rounded-lg font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="w-full py-3 px-4 rounded-lg font-medium bg-gray-600 hover:bg-gray-700 text-white transition-colors"
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
