'use client'

import { useState, useEffect } from 'react'

export interface WhatsAppConnection {
  isLinked: boolean
  phoneNumber: string | null
  connectionId: string | null
  deviceName: string | null
}

export function useWhatsAppConnection() {
  const [connection, setConnection] = useState<WhatsAppConnection>({
    isLinked: false,
    phoneNumber: null,
    connectionId: null,
    deviceName: null
  })

  // Check connection status on mount and when localStorage might change
  useEffect(() => {
    checkConnectionStatus()
    
    // Listen for storage changes (when localStorage is updated)
    const handleStorageChange = () => {
      console.log('Storage event detected, rechecking connection...')
      checkConnectionStatus()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const checkConnectionStatus = () => {
    try {
      const isLinked = localStorage.getItem('whatsapp_linked') === 'true'
      const phoneNumber = localStorage.getItem('whatsapp_phone')
      const connectionId = localStorage.getItem('whatsapp_connection_id')
      const deviceName = localStorage.getItem('whatsapp_device_name') || 'Phone'

      setConnection({
        isLinked,
        phoneNumber,
        connectionId,
        deviceName
      })
    } catch (error) {
      console.error('Error checking WhatsApp connection:', error)
      setConnection({
        isLinked: false,
        phoneNumber: null,
        connectionId: null,
        deviceName: null
      })
    }
  }

  const linkWhatsApp = (phoneNumber: string, connectionId: string, deviceName?: string) => {
    try {
      localStorage.setItem('whatsapp_linked', 'true')
      localStorage.setItem('whatsapp_phone', phoneNumber)
      localStorage.setItem('whatsapp_connection_id', connectionId)
      if (deviceName) {
        localStorage.setItem('whatsapp_device_name', deviceName)
      }

      setConnection({
        isLinked: true,
        phoneNumber,
        connectionId,
        deviceName: deviceName || 'Phone'
      })

      return true
    } catch (error) {
      console.error('Error linking WhatsApp:', error)
      return false
    }
  }

  const unlinkWhatsApp = () => {
    try {
      console.log('Unlinking WhatsApp...')
      
      // Clear all WhatsApp related data
      localStorage.removeItem('whatsapp_linked')
      localStorage.removeItem('whatsapp_phone')
      localStorage.removeItem('whatsapp_connection_id')
      localStorage.removeItem('whatsapp_device_name')

      setConnection({
        isLinked: false,
        phoneNumber: null,
        connectionId: null,
        deviceName: null
      })

      // Trigger storage event manually for immediate state update
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'whatsapp_linked',
        newValue: null,
        oldValue: 'true'
      }))

      console.log('WhatsApp unlinked successfully')
      return true
    } catch (error) {
      console.error('Error unlinking WhatsApp:', error)
      return false
    }
  }

  const refreshConnection = () => {
    checkConnectionStatus()
  }

  return {
    connection,
    linkWhatsApp,
    unlinkWhatsApp,
    refreshConnection,
    checkConnectionStatus
  }
}
