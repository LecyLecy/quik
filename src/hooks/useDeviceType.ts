'use client'

import { useState, useEffect } from 'react'

type DeviceType = 'mobile' | 'tablet' | 'desktop'

export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')

  useEffect(() => {
    const checkDeviceType = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const width = window.innerWidth

      // Check for mobile devices
      if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
        if (width >= 768) {
          setDeviceType('tablet')
        } else {
          setDeviceType('mobile')
        }
      } else {
        // Desktop
        setDeviceType('desktop')
      }
    }

    // Check on mount
    checkDeviceType()

    // Check on resize
    window.addEventListener('resize', checkDeviceType)
    
    return () => {
      window.removeEventListener('resize', checkDeviceType)
    }
  }, [])

  return deviceType
}

export const isMobileOrTablet = (deviceType: DeviceType) => {
  return deviceType === 'mobile' || deviceType === 'tablet'
}
