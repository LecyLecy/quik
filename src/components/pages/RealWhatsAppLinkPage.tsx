'use client'

import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { useRealWhatsApp } from '@/hooks/useRealWhatsApp'
import Header from '@/components/Header'

interface RealWhatsAppLinkPageProps {
  onLinked: () => void
  onMenuToggle: () => void
  sidebarOpen: boolean
  onBack?: () => void
}

export default function RealWhatsAppLinkPage({ onLinked, onMenuToggle, sidebarOpen, onBack }: RealWhatsAppLinkPageProps) {
  const { status, initializeWhatsApp, disconnectWhatsApp } = useRealWhatsApp()
  const [qrCodeImage, setQrCodeImage] = useState<string>('')

  // Generate QR code image from string when available
  useEffect(() => {
    if (status.qrCode) {
      QRCode.toDataURL(status.qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(setQrCodeImage).catch(console.error)
    }
  }, [status.qrCode])

  // When WhatsApp becomes ready, call onLinked
  useEffect(() => {
    if (status.isReady) {
      onLinked()
    }
  }, [status.isReady, onLinked])

  const handleConnect = () => {
    initializeWhatsApp()
  }

  const handleDisconnect = () => {
    disconnectWhatsApp()
    setQrCodeImage('')
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <Header 
        emoji="📱"
        title="Connect WhatsApp"
        onMenuToggle={onMenuToggle}
        sidebarOpen={sidebarOpen}
        showBackButton={!!onBack}
        onBackClick={onBack}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-6 bg-black flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="bg-[#1e1e1e] rounded-lg p-6 text-center">
              {/* Header */}
              <div className="mb-8">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Connect to WhatsApp</h1>
                <p className="text-gray-400">
                  {status.isReady 
                    ? "Your WhatsApp is connected! You can now send stickers to yourself."
                    : "Scan the QR code with your WhatsApp to connect"
                  }
                </p>
              </div>

              {/* Status Display */}
              {status.error && (
                <div className="bg-red-900/50 border border-red-600 rounded-lg p-4 mb-6">
                  <p className="text-red-300 text-sm">{status.error}</p>
                </div>
              )}

              {/* QR Code Section */}
              {!status.isReady && (
                <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                  {status.isConnecting && !status.hasQR && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                      <p className="text-gray-400">Starting WhatsApp connection...</p>
                    </div>
                  )}

                  {status.hasQR && qrCodeImage && (
                    <div className="text-center">
                      <div className="bg-white p-4 rounded-xl border-2 border-gray-600 inline-block mb-4">
                        <img 
                          src={qrCodeImage} 
                          alt="WhatsApp QR Code" 
                          className="w-64 h-64"
                        />
                      </div>
                      <p className="text-sm text-gray-400 mb-4">
                        1. Open WhatsApp on your phone<br/>
                        2. Go to Settings → Linked Devices<br/>
                        3. Tap &quot;Link a Device&quot;<br/>
                        4. Scan this QR code
                      </p>
                      <div className="flex items-center justify-center gap-2 text-green-400">
                        <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Waiting for scan...</span>
                      </div>
                    </div>
                  )}

                  {!status.isConnecting && !status.hasQR && (
                    <div className="text-center py-8">
                      <button
                        onClick={handleConnect}
                        className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Start WhatsApp Connection
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Automatically clears previous sessions
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Connected State */}
              {status.isReady && (
                <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">WhatsApp Connected!</h3>
                    <p className="text-gray-400 text-sm mb-4">
                      You can now send stickers to yourself. Go back to create your first sticker!
                    </p>
                    <button
                      onClick={handleDisconnect}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      Disconnect WhatsApp
                    </button>
                  </div>
                </div>
              )}

              {/* Instructions */}
              {!status.isReady && (
                <div className="bg-blue-900/50 border border-blue-600 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-300 mb-2">How it works:</h3>
                  <ul className="text-blue-400 text-sm space-y-1 text-left">
                    <li>• This uses the official WhatsApp Web API</li>
                    <li>• Automatically clears previous sessions for fresh connections</li>
                    <li>• Your phone needs to be connected to the internet</li>
                    <li>• You can send stickers from this app to your own WhatsApp</li>
                    <li>• Perfect for testing your sticker creations!</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
