import { useState, useEffect } from 'react'

interface WhatsAppStatus {
  isReady: boolean
  hasQR: boolean
  qrCode: string | null
  isConnecting: boolean
  error: string | null
  phoneNumber: string | null
}

export const useRealWhatsApp = () => {
  const [status, setStatus] = useState<WhatsAppStatus>({
    isReady: false,
    hasQR: false,
    qrCode: null,
    isConnecting: false,
    error: null,
    phoneNumber: null
  })

  // Poll for WhatsApp status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/whatsapp?action=status')
        const data = await response.json()
        
        setStatus(prev => ({
          ...prev,
          isReady: data.isReady,
          hasQR: data.hasQR,
          error: null
        }))

        // If there's a QR code available, fetch it
        if (data.hasQR && !status.qrCode) {
          const qrResponse = await fetch('/api/whatsapp?action=qr')
          const qrData = await qrResponse.json()
          
          setStatus(prev => ({
            ...prev,
            qrCode: qrData.qrCode
          }))
        }

        // If ready, clear QR code
        if (data.isReady) {
          setStatus(prev => ({
            ...prev,
            qrCode: null,
            hasQR: false,
            isConnecting: false
          }))
        }
      } catch (_error) {
        setStatus(prev => ({
          ...prev,
          error: 'Failed to check WhatsApp status'
        }))
      }
    }

    // Check status immediately
    checkStatus()

    // Then check every 2 seconds
    const interval = setInterval(checkStatus, 2000)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [status.qrCode])

  const initializeWhatsApp = async () => {
    setStatus(prev => ({ ...prev, isConnecting: true, error: null }))
    
    try {
      const response = await fetch('/api/whatsapp?action=init')
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to initialize WhatsApp')
      }
      
      // Set a timeout to show error if no QR code appears
      setTimeout(() => {
        setStatus(prev => {
          if (prev.isConnecting && !prev.hasQR && !prev.isReady) {
            return {
              ...prev,
              isConnecting: false,
              error: 'Connection timeout. Try clearing session and reconnecting.'
            }
          }
          return prev
        })
      }, 30000) // 30 second timeout
      
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Failed to initialize WhatsApp'
      }))
    }
  }

  const disconnectWhatsApp = async () => {
    try {
      setStatus(prev => ({
        ...prev,
        error: null
      }))
      
      const response = await fetch('/api/whatsapp?action=disconnect')
      const data = await response.json()
      
      if (data.success) {
        setStatus({
          isReady: false,
          hasQR: false,
          qrCode: null,
          isConnecting: false,
          error: null,
          phoneNumber: null
        })
      } else {
        setStatus(prev => ({
          ...prev,
          error: data.error || 'Failed to disconnect'
        }))
      }
    } catch (_error) {
      setStatus(prev => ({
        ...prev,
        error: 'Failed to disconnect WhatsApp'
      }))
    }
  }

  const sendSticker = async (mediaData: string) => {
    try {
      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'send-sticker',
          media: mediaData
        })
      })

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to send sticker')
      }

      return { success: true, message: data.message }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send sticker' 
      }
    }
  }

  return {
    status,
    initializeWhatsApp,
    disconnectWhatsApp,
    sendSticker
  }
}
