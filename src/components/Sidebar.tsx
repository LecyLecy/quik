'use client'

import { useState, useEffect } from 'react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  currentPage: 'notes' | 'sticker'
  onPageChange: (page: 'notes' | 'sticker') => void
}

export default function Sidebar({ isOpen, onClose, currentPage, onPageChange }: SidebarProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const menuItems = [
    { id: 'notes' as const, label: 'Notes', icon: '📝' },
    { id: 'sticker' as const, label: 'Sticker', icon: '🎨' }
  ]

  const handleItemClick = (pageId: 'notes' | 'sticker') => {
    onPageChange(pageId)
    onClose()
  }

  if (!mounted) return null

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-30 transition-opacity duration-300"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
        />
      )}

      {/* Sidebar */}
      <div 
        data-sidebar
        onClick={(e) => e.stopPropagation()}
        className={`
          fixed top-0 left-0 h-full w-280 sm:w-80 bg-black border-r border-gray-700 z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header Spacer - to avoid covering header */}
        <div className="h-16 bg-black"></div>
        
        {/* Menu Items */}
        <div className="p-4">
          {menuItems.map((item, index) => (
            <button
              key={item.id}
              onClick={(e) => {
                e.stopPropagation()
                handleItemClick(item.id)
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${currentPage === item.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }
                ${isOpen ? 'animate-fade-in' : ''}
              `}
              style={{ 
                animationDelay: isOpen ? `${index * 50}ms` : '0ms',
                animationFillMode: 'both'
              }}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
