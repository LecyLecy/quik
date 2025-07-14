import { useState, useEffect } from 'react'

export function useWindowWidth() {
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )

  useEffect(() => {
    if (typeof window === 'undefined') return

    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      // Debounce resize events
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setWindowWidth(window.innerWidth)
      }, 100)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])

  const isMobile = windowWidth <= 768
  const isTablet = windowWidth > 768 && windowWidth <= 1024
  const isDesktop = windowWidth > 1024

  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktop,
  }
}
