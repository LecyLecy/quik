import { useState, useCallback } from 'react'
import type { MediaItem } from '@/types/note'

export function useModalState() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<'image' | 'video' | 'gif' | null>(null)
  const [showGallery, setShowGallery] = useState(false)
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [downloadTarget, setDownloadTarget] = useState<MediaItem | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null)

  const openMediaPreview = useCallback((item: MediaItem) => {
    if (item.type === 'image' || item.type === 'gif' || item.type === 'video') {
      setPreviewUrl(item.url)
      setPreviewType(item.type)
    }
  }, [])

  const closeMediaPreview = useCallback(() => {
    setPreviewUrl(null)
    setPreviewType(null)
  }, [])

  const openGallery = useCallback(() => {
    setShowGallery(true)
  }, [])

  const closeGallery = useCallback(() => {
    setShowGallery(false)
  }, [])

  const openDownloadModal = useCallback((item: MediaItem) => {
    setDownloadTarget(item)
    setDownloadModalOpen(true)
  }, [])

  const closeDownloadModal = useCallback(() => {
    setDownloadTarget(null)
    setDownloadModalOpen(false)
  }, [])

  const openDeleteModal = useCallback((item: MediaItem) => {
    setDeleteTarget(item)
    setDeleteModalOpen(true)
  }, [])

  const closeDeleteModal = useCallback(() => {
    setDeleteTarget(null)
    setDeleteModalOpen(false)
  }, [])

  return {
    // State
    previewUrl,
    previewType,
    showGallery,
    downloadModalOpen,
    downloadTarget,
    deleteModalOpen,
    deleteTarget,
    // Actions
    openMediaPreview,
    closeMediaPreview,
    openGallery,
    closeGallery,
    openDownloadModal,
    closeDownloadModal,
    openDeleteModal,
    closeDeleteModal,
  }
}
