'use client'

import { useState, useEffect, useCallback } from 'react'

interface CustomTimePickerProps {
  value: string // Format: "HH:MM"
  onChange: (value: string) => void
  className?: string
}

export default function CustomTimePicker({ value, onChange, className = '' }: CustomTimePickerProps) {
  const [hours, setHours] = useState('00')
  const [minutes, setMinutes] = useState('00')

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':')
      setHours(h || '00')
      setMinutes(m || '00')
    }
  }, [value])

  // Update parent when time changes
  const updateTime = useCallback((newHours: string, newMinutes: string) => {
    const timeString = `${newHours}:${newMinutes}`
    onChange(timeString)
  }, [onChange])

  const handleHourChange = useCallback((newHours: string) => {
    setHours(newHours)
    updateTime(newHours, minutes)
  }, [minutes, updateTime])

  const handleMinuteChange = useCallback((newMinutes: string) => {
    setMinutes(newMinutes)
    updateTime(hours, newMinutes)
  }, [hours, updateTime])

  // Generate hour options (00-23)
  const hourOptions = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  )

  // Generate minute options (00-59)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, '0')
  )

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Hour Selector */}
      <div className="relative">
        <select
          value={hours}
          onChange={(e) => handleHourChange(e.target.value)}
          className="bg-[#2a2a2a] text-white p-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none appearance-none cursor-pointer min-w-[60px] text-center text-sm font-mono"
        >
          {hourOptions.map(hour => (
            <option key={hour} value={hour} className="bg-[#2a2a2a] text-white">
              {hour}
            </option>
          ))}
        </select>
        {/* Custom arrow */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Separator */}
      <span className="text-white font-mono text-lg">:</span>

      {/* Minute Selector */}
      <div className="relative">
        <select
          value={minutes}
          onChange={(e) => handleMinuteChange(e.target.value)}
          className="bg-[#2a2a2a] text-white p-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none appearance-none cursor-pointer min-w-[60px] text-center text-sm font-mono"
        >
          {minuteOptions.map(minute => (
            <option key={minute} value={minute} className="bg-[#2a2a2a] text-white">
              {minute}
            </option>
          ))}
        </select>
        {/* Custom arrow */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Quick time buttons */}
      <div className="flex gap-1 ml-2">
        <button
          type="button"
          onClick={() => {
            const now = new Date()
            const currentHours = now.getHours().toString().padStart(2, '0')
            const currentMinutes = now.getMinutes().toString().padStart(2, '0')
            setHours(currentHours)
            setMinutes(currentMinutes)
            updateTime(currentHours, currentMinutes)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
          title="Set to current time"
        >
          Now
        </button>
        <button
          type="button"
          onClick={() => {
            setHours('00')
            setMinutes('00')
            updateTime('00', '00')
          }}
          className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition-colors"
          title="Reset to midnight"
        >
          00:00
        </button>
      </div>
    </div>
  )
}
