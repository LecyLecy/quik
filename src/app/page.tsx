'use client'

import { useState } from 'react'
import NotesPage from '@/components/pages/NotesPage'
import InputContentPage from '@/components/pages/InputContentPage'
import EditPage from '@/components/pages/EditPage'
import RealWhatsAppLinkPage from '@/components/pages/RealWhatsAppLinkPage'
import Sidebar from '@/components/Sidebar'
import { useWhatsAppConnection } from '@/hooks/useWhatsAppConnection'
import { useRealWhatsApp } from '@/hooks/useRealWhatsApp'

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<'notes' | 'sticker' | 'edit'>('notes')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const { connection, refreshConnection } = useWhatsAppConnection()
  const { status: realWhatsAppStatus } = useRealWhatsApp()

  // Debug connection state changes (remove this later)
  // console.log('App page render - WhatsApp connection:', connection)

  const handlePageChange = (page: 'notes' | 'sticker') => {
    setCurrentPage(page)
    setSidebarOpen(false)
  }

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(files)
    setCurrentPage('sticker')
  }

  const handleEditMode = () => {
    setCurrentPage('edit')
  }

  const handleExitEdit = () => {
    setCurrentPage('sticker')
  }

  const handleClearFiles = () => {
    setUploadedFiles([])
  }

  const handleWhatsAppLinked = () => {
    // Force refresh of connection state
    console.log('WhatsApp linked, refreshing connection state...')
    refreshConnection()
    // Also force a re-render by updating current page
    setCurrentPage('sticker')
  }

  const handleWhatsAppUnlink = () => {
    console.log('WhatsApp unlinked, clearing state...')
    // Force refresh to pick up the cleared localStorage
    refreshConnection()
    // The InputContentPage should handle the actual unlinking via its unlink function
  }

  return (
    <main className="bg-[#1a1a1a] min-h-screen text-white relative overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
      
      {currentPage === 'notes' && (
        <NotesPage 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
      )}
      
      {currentPage === 'sticker' && (
        <>
          {(() => {
            // Use real WhatsApp connection status instead of demo
            return !realWhatsAppStatus.isReady ? (
              <RealWhatsAppLinkPage 
                onLinked={handleWhatsAppLinked}
                onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                sidebarOpen={sidebarOpen}
              />
            ) : (
              <InputContentPage 
                onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
                sidebarOpen={sidebarOpen}
                uploadedFiles={uploadedFiles}
                onFileUpload={handleFileUpload}
                onEditMode={handleEditMode}
                onClearFiles={handleClearFiles}
                onWhatsAppUnlink={handleWhatsAppUnlink}
              />
            )
          })()}
        </>
      )}
      
      {currentPage === 'edit' && (
        <EditPage 
          uploadedFiles={uploadedFiles}
          onExitEdit={handleExitEdit}
        />
      )}
    </main>
  )
}
