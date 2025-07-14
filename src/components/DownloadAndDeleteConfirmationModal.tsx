'use client'

import { useState, useEffect, useRef } from 'react'
import type { MediaItem } from '@/types/note'

interface ConfirmationModalProps {
  open: boolean
  content: MediaItem
  bubbleDescription: string
  onClose: () => void
  onAction: (fileName?: string) => void
  actionLabel: string
  showInput?: boolean
}

const fileNameRegex = /^[a-zA-Z0-9_\-]+$/

export default function ConfirmationModal({
  open,
  content,
  bubbleDescription,
  onClose,
  onAction,
  actionLabel,
  showInput = false,
}: ConfirmationModalProps) {
  const [fileName, setFileName] = useState('')
  const [touched, setTouched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const ext = content.fileName?.split('.').pop() || content.type
  const defaultBaseName = content.fileName
    ? content.fileName.replace(/\.[^/.]+$/, '')
    : 'download'

  const isValid =
    !showInput ||
    fileName === '' ||
    (fileNameRegex.test(fileName) &&
      !fileName.startsWith('-') &&
      !fileName.startsWith('_'))
  const showError = touched && !isValid

  useEffect(() => {
    if (open) {
      setFileName('')
      setTouched(false)
      if (showInput) setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open, showInput])

  if (!open) return null

  function renderPreview() {
    if (content.type === 'image') {
      return (
        <img
          src={content.url}
          alt={content.fileName}
          className="w-36 h-36 object-cover rounded mx-auto"
        />
      )
    }
    if (content.type === 'gif') {
      return (
        <img
          src={content.url}
          alt={content.fileName}
          className="w-36 h-36 object-contain rounded mx-auto"
        />
      )
    }
    if (content.type === 'video') {
      return (
        <div className="w-36 h-36 rounded bg-black mx-auto relative flex items-center justify-center">
          <video
            src={content.url}
            className="w-full h-full object-cover rounded"
            muted
            preload="metadata"
            controls={false}
            style={{ pointerEvents: 'none' }}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-white opacity-80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-6.518-3.75A1 1 0 007 8.25v7.5a1 1 0 001.234.97l6.518-1.98a1 1 0 00.75-.97v-3.6a1 1 0 00-.25-.992z" />
            </svg>
          </div>
        </div>
      )
    }
    // Document
    return (
      <div className="w-36 h-36 bg-[#232323] rounded mx-auto flex flex-col justify-center items-center text-white text-xs">
        <div className="text-5xl mb-2">📄</div>
        <p className="truncate w-32">{content.fileName}</p>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1e1e1e] rounded-xl w-full max-w-xs sm:max-w-sm p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h2 className="text-lg font-semibold text-white mb-2 text-center">
          {actionLabel === 'Download'
            ? 'Download this content?'
            : 'Delete this content?'}
        </h2>
        {/* File type */}
        <div className="text-xs text-gray-400 text-center mb-1">
          file type:{' '}
          <span className="font-semibold text-white">{ext?.toLowerCase() || content.type}</span>
        </div>
        {/* Preview */}
        <div className="mb-3 flex justify-center">{renderPreview()}</div>
        {/* Deskripsi */}
        <div className="text-xs text-gray-300 text-center mb-3 flex items-center justify-center">
          <span className="mr-1">from:</span>
          <span
            className="italic truncate max-w-[200px] sm:max-w-[320px] text-gray-200"
            style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={bubbleDescription}
          >
            {bubbleDescription || '(No description)'}
          </span>
        </div>
        {/* Input area (download only) */}
        {showInput && (
          <>
            <label
              className="block text-gray-300 text-sm mb-1"
              htmlFor="filename-input"
            >
              Input file name
            </label>
            <input
              ref={inputRef}
              id="filename-input"
              className={`w-full px-3 py-2 rounded bg-[#232323] text-white mb-4 border ${
                showError ? 'border-red-500' : 'border-gray-700'
              } focus:outline-none`}
              placeholder={defaultBaseName}
              value={fileName}
              onChange={(e) => {
                setFileName(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))
                setTouched(true)
              }}
              maxLength={64}
            />
            {showError && (
              <div className="text-xs text-red-500 mb-2">
                Only letters, numbers, `_`, and `-` allowed. Cannot start with - or _.
              </div>
            )}
          </>
        )}
        {/* Action buttons */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-600 text-white"
          >
            Cancel
          </button>
          <button
            disabled={showInput && !isValid}
            onClick={() => {
              if (showInput) {
                const finalName =
                  fileName.trim() !== ''
                    ? fileName.trim() + (ext ? `.${ext}` : '')
                    : content.fileName
                onAction(finalName!)
              } else {
                onAction()
              }
            }}
            className={`px-4 py-2 rounded font-semibold ${
              actionLabel === 'Delete'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            } ${showInput && !isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
