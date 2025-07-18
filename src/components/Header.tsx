interface HeaderProps {
  emoji: string
  title: string
  onMenuToggle: () => void
  sidebarOpen: boolean
  rightContent?: React.ReactNode
  showBackButton?: boolean
  onBackClick?: () => void
}

export default function Header({ 
  emoji, 
  title, 
  onMenuToggle, 
  sidebarOpen, 
  rightContent,
  showBackButton = false,
  onBackClick
}: HeaderProps) {
  return (
    <div className="flex-shrink-0 bg-black border-b border-gray-800 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && onBackClick ? (
            <button
              onClick={onBackClick}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={onMenuToggle}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {!sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </button>
          )}
          
          <span>{emoji}</span>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        
        {rightContent && (
          <div className="flex items-center gap-2">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  )
}
