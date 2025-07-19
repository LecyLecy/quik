'use client'

import { useState, useCallback } from 'react'

interface DownloadProgress {
  isDownloading: boolean
  progress: number
  fileName: string
}

export const useDocumentHandler = () => {
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    isDownloading: false,
    progress: 0,
    fileName: ''
  })

  const downloadDocument = useCallback(async (url: string, fileName: string) => {
    try {
      setDownloadProgress({
        isDownloading: true,
        progress: 0,
        fileName
      })

      const response = await fetch(url)
      if (!response.ok) throw new Error('Download failed')

      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0

      const reader = response.body?.getReader()
      if (!reader) throw new Error('Reader not available')

      const chunks: Uint8Array[] = []
      let received = 0

      // Read the stream
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        chunks.push(value)
        received += value.length

        if (total > 0) {
          const progress = Math.round((received / total) * 100)
          setDownloadProgress(prev => ({
            ...prev,
            progress
          }))
        }
      }

      // Create blob and download
      const blob = new Blob(chunks)
      const downloadUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(downloadUrl)

      // Reset progress after short delay
      setTimeout(() => {
        setDownloadProgress({
          isDownloading: false,
          progress: 0,
          fileName: ''
        })
      }, 1000)

      return true
    } catch (error) {
      console.error('Download failed:', error)
      setDownloadProgress({
        isDownloading: false,
        progress: 0,
        fileName: ''
      })
      return false
    }
  }, [])

  const openDocumentInBrowser = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])

  const openDocumentViewer = useCallback(async (url: string, fileName: string) => {
    // For mobile/tablet: first download, then try to open
    const downloadSuccess = await downloadDocument(url, fileName)
    
    if (downloadSuccess) {
      // Try to open in document viewer app after download
      // This will prompt user to choose an app on mobile
      try {
        window.open(url, '_blank')
      } catch (error) {
        console.log('Could not open document viewer:', error)
      }
    }
  }, [downloadDocument])

  return {
    downloadProgress,
    downloadDocument,
    openDocumentInBrowser,
    openDocumentViewer
  }
}
