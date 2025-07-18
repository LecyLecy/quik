'use client'

import { useState } from 'react'
import NotesPage from '@/components/pages/NotesPage'
import InputContentPage from '@/components/pages/InputContentPage'
import EditPage from '@/components/pages/EditPage'
import Sidebar from '@/components/Sidebar'

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<'notes' | 'sticker' | 'edit'>('notes')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

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
        <InputContentPage 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          uploadedFiles={uploadedFiles}
          onFileUpload={handleFileUpload}
          onEditMode={handleEditMode}
          onClearFiles={handleClearFiles}
        />
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
