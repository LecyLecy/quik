'use client'

import { useEffect, ReactNode } from 'react'

interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  showBackButton?: boolean
  backButtonText?: string
}

export default function BaseModal({ 
  isOpen, 
  onClose, 
  children, 
  className = '',
  showBackButton = true,
  backButtonText = 'Back'
}: BaseModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const handleBodyScroll = () => {
      document.body.style.overflow = 'hidden'
    }

    window.addEventListener('keydown', handleEscape)
    handleBodyScroll()

    return () => {
      window.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 ${className}`}
      onClick={onClose}
    >
      {showBackButton && (
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-white text-sm bg-gray-800 px-3 py-1 rounded hover:bg-gray-700 transition-colors"
        >
          {backButtonText}
        </button>
      )}
      
      <div
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
