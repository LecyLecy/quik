'use client'

import { useState, useEffect, useCallback } from 'react'

interface CustomDatePickerProps {
  value: string // Format: "YYYY-MM-DD"
  onChange: (value: string) => void
  className?: string
}

export default function CustomDatePicker({ value, onChange, className = '' }: CustomDatePickerProps) {
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-')
      setYear(y || '')
      setMonth(m || '')
      setDay(d || '')
    }
  }, [value])

  // Update parent when date changes
  const updateDate = useCallback((newYear: string, newMonth: string, newDay: string) => {
    if (newYear && newMonth && newDay) {
      const dateString = `${newYear}-${newMonth}-${newDay}`
      onChange(dateString)
    }
  }, [onChange])

  const handleYearChange = useCallback((newYear: string) => {
    setYear(newYear)
    if (newYear && month && day) {
      updateDate(newYear, month, day)
    }
  }, [month, day, updateDate])

  const handleMonthChange = useCallback((newMonth: string) => {
    setMonth(newMonth)
    if (year && newMonth && day) {
      updateDate(year, newMonth, day)
    }
  }, [year, day, updateDate])

  const handleDayChange = useCallback((newDay: string) => {
    setDay(newDay)
    if (year && month && newDay) {
      updateDate(year, month, newDay)
    }
  }, [year, month, updateDate])

  // Generate year options (current year - 1 to current year + 10)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 12 }, (_, i) => 
    (currentYear - 1 + i).toString()
  )

  // Month options
  const monthOptions = [
    { value: '01', label: 'Jan' },
    { value: '02', label: 'Feb' },
    { value: '03', label: 'Mar' },
    { value: '04', label: 'Apr' },
    { value: '05', label: 'May' },
    { value: '06', label: 'Jun' },
    { value: '07', label: 'Jul' },
    { value: '08', label: 'Aug' },
    { value: '09', label: 'Sep' },
    { value: '10', label: 'Oct' },
    { value: '11', label: 'Nov' },
    { value: '12', label: 'Dec' },
  ]

  // Generate day options based on selected month/year
  const getDaysInMonth = useCallback((year: string, month: string) => {
    if (!year || !month) return 31
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
    return daysInMonth
  }, [])

  const dayOptions = Array.from(
    { length: getDaysInMonth(year, month) }, 
    (_, i) => (i + 1).toString().padStart(2, '0')
  )

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Month Selector */}
      <div className="relative">
        <select
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="bg-[#2a2a2a] text-white p-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none appearance-none cursor-pointer min-w-[70px] text-center text-sm"
        >
          <option value="" className="bg-[#2a2a2a] text-gray-400">Month</option>
          {monthOptions.map(monthOption => (
            <option key={monthOption.value} value={monthOption.value} className="bg-[#2a2a2a] text-white">
              {monthOption.label}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Day Selector */}
      <div className="relative">
        <select
          value={day}
          onChange={(e) => handleDayChange(e.target.value)}
          className="bg-[#2a2a2a] text-white p-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none appearance-none cursor-pointer min-w-[60px] text-center text-sm font-mono"
          disabled={!month}
        >
          <option value="" className="bg-[#2a2a2a] text-gray-400">Day</option>
          {dayOptions.map(dayOption => (
            <option key={dayOption} value={dayOption} className="bg-[#2a2a2a] text-white">
              {dayOption}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Year Selector */}
      <div className="relative">
        <select
          value={year}
          onChange={(e) => handleYearChange(e.target.value)}
          className="bg-[#2a2a2a] text-white p-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none appearance-none cursor-pointer min-w-[70px] text-center text-sm font-mono"
        >
          <option value="" className="bg-[#2a2a2a] text-gray-400">Year</option>
          {yearOptions.map(yearOption => (
            <option key={yearOption} value={yearOption} className="bg-[#2a2a2a] text-white">
              {yearOption}
            </option>
          ))}
        </select>
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Quick date buttons */}
      <div className="flex gap-1 ml-2">
        <button
          type="button"
          onClick={() => {
            const today = new Date()
            const todayYear = today.getFullYear().toString()
            const todayMonth = (today.getMonth() + 1).toString().padStart(2, '0')
            const todayDay = today.getDate().toString().padStart(2, '0')
            setYear(todayYear)
            setMonth(todayMonth)
            setDay(todayDay)
            updateDate(todayYear, todayMonth, todayDay)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
          title="Set to today"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            const tomorrowYear = tomorrow.getFullYear().toString()
            const tomorrowMonth = (tomorrow.getMonth() + 1).toString().padStart(2, '0')
            const tomorrowDay = tomorrow.getDate().toString().padStart(2, '0')
            setYear(tomorrowYear)
            setMonth(tomorrowMonth)
            setDay(tomorrowDay)
            updateDate(tomorrowYear, tomorrowMonth, tomorrowDay)
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
          title="Set to tomorrow"
        >
          Tomorrow
        </button>
      </div>
    </div>
  )
}
