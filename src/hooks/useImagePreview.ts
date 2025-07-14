// src/hooks/useImagePreview.ts
import { useState } from 'react'

export function useImagePreview() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const open = (url: string) => setImageUrl(url)
  const close = () => setImageUrl(null)

  return {
    imageUrl,
    open,
    close,
    isOpen: !!imageUrl,
  }
}
