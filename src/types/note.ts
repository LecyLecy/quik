export type MediaType = 'image' | 'video' | 'document' | 'gif'

export interface MediaItem {
  id: string
  url: string
  storagePath: string
  type: MediaType
  fileName?: string
  fileSize?: number
  fileType?: string
  createdAt: string // ISO string
}

export interface NoteBubble {
  id: string
  description?: string
  contents: MediaItem[]
  createdAt: string // camelCase

  // 🆕 countdown support
  isCountdown?: boolean
  countdownDate?: string // ISO string format, ex: "2025-07-08T14:30:00.000Z"
}
