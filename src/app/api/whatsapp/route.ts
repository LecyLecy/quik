import { NextRequest, NextResponse } from 'next/server'

// This will be our WhatsApp client instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let whatsappClient: any = null
let isClientReady = false
let qrCodeData = ''
let phoneNumber = ''

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action')

  switch (action) {
    case 'status':
      return NextResponse.json({ 
        isReady: isClientReady,
        hasQR: !!qrCodeData,
        phoneNumber: phoneNumber
      })
    
    case 'qr':
      return NextResponse.json({ qrCode: qrCodeData })
    
    case 'init':
      return initializeWhatsApp()
    
    case 'disconnect':
      return disconnectWhatsApp()
    
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, media } = await request.json()

    if (action === 'send-sticker') {
      return await sendStickerToSelf(media)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

async function initializeWhatsApp() {
  try {
    // Dynamic import to avoid SSR issues
    const { Client, LocalAuth } = await import('whatsapp-web.js')
    
    // Clean up any existing client first
    if (whatsappClient) {
      try {
        await whatsappClient.destroy()
      } catch (error) {
        console.log('Warning: Error destroying existing client:', error)
      }
      whatsappClient = null
    }

    // Reset state
    isClientReady = false
    qrCodeData = ''
    phoneNumber = ''

    // Automatically clear all previous sessions before starting
    try {
      const fs = await import('fs')
      const path = await import('path')
      const currentDir = path.resolve('.')
      
      // Find all whatsapp-session directories and clean them
      const files = fs.readdirSync(currentDir)
      const sessionDirs = files.filter(file => file.startsWith('whatsapp-session'))
      
      for (const sessionDir of sessionDirs) {
        const sessionPath = path.resolve(currentDir, sessionDir)
        if (fs.existsSync(sessionPath)) {
          await fs.promises.rm(sessionPath, { recursive: true, force: true })
          console.log(`Auto-cleared session directory: ${sessionDir}`)
        }
      }
      
      if (sessionDirs.length > 0) {
        console.log(`Auto-cleared ${sessionDirs.length} session directories before starting`)
      }
    } catch (cleanupError) {
      console.log('Warning: Could not auto-clear session files:', cleanupError)
      // Continue with initialization even if cleanup fails
    }

    // Create new client with better error handling
    const sessionId = `quik-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    whatsappClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: `./whatsapp-session-${sessionId}`,
        clientId: sessionId
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      }
    })

    whatsappClient.on('qr', (qr: string) => {
      qrCodeData = qr
      isClientReady = false
      console.log('QR Code received:', qr)
    })

    whatsappClient.on('ready', () => {
      isClientReady = true
      qrCodeData = ''
      console.log('WhatsApp client is ready!')
      
      // Get phone number when ready
      try {
        const info = whatsappClient.info
        if (info && info.wid && info.wid.user) {
          phoneNumber = `+${info.wid.user}`
          console.log('Connected phone number:', phoneNumber)
        }
      } catch (error) {
        console.log('Could not get phone number:', error)
      }
    })

    whatsappClient.on('authenticated', () => {
      console.log('WhatsApp client authenticated')
    })

    whatsappClient.on('auth_failure', (msg: string) => {
      console.error('Authentication failed:', msg)
      isClientReady = false
    })

    whatsappClient.on('disconnected', (reason: string) => {
      console.log('WhatsApp client disconnected:', reason)
      isClientReady = false
      qrCodeData = ''
      phoneNumber = ''
    })

    whatsappClient.on('logout', () => {
      console.log('WhatsApp client logged out')
      isClientReady = false
      qrCodeData = ''
      phoneNumber = ''
    })

    // Add timeout for initialization
    const initTimeout = setTimeout(() => {
      if (!isClientReady && !qrCodeData) {
        console.log('WhatsApp initialization timeout')
        if (whatsappClient) {
          whatsappClient.destroy().catch(console.error)
        }
      }
    }, 30000) // 30 second timeout

    whatsappClient.on('qr', (_qr: string) => {
      clearTimeout(initTimeout)
    })

    whatsappClient.on('ready', () => {
      clearTimeout(initTimeout)
    })

    await whatsappClient.initialize()

    return NextResponse.json({ 
      success: true, 
      message: 'WhatsApp initialization started' 
    })
  } catch (error) {
    console.error('Failed to initialize WhatsApp:', error)
    return NextResponse.json({ 
      error: 'Failed to initialize WhatsApp' 
    }, { status: 500 })
  }
}

async function disconnectWhatsApp() {
  try {
    if (whatsappClient) {
      // First try to logout from WhatsApp Web properly
      try {
        await whatsappClient.logout()
        console.log('WhatsApp client logged out')
        // Wait a bit for logout to complete
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (logoutError) {
        console.log('Warning: Could not logout properly:', logoutError)
        // Continue with destroy even if logout fails
      }
      
      // Then destroy the client
      await whatsappClient.destroy()
      whatsappClient = null
    }
    isClientReady = false
    qrCodeData = ''
    phoneNumber = ''
    
    // Clean up session files
    try {
      const fs = await import('fs')
      const path = await import('path')
      const currentDir = path.resolve('.')
      
      // Find all whatsapp-session directories and clean them
      const files = fs.readdirSync(currentDir)
      const sessionDirs = files.filter(file => file.startsWith('whatsapp-session'))
      
      for (const sessionDir of sessionDirs) {
        const sessionPath = path.resolve(currentDir, sessionDir)
        if (fs.existsSync(sessionPath)) {
          await fs.promises.rm(sessionPath, { recursive: true, force: true })
          console.log(`Session directory cleaned: ${sessionDir}`)
        }
      }
    } catch (cleanupError) {
      console.log('Warning: Could not clean up session files:', cleanupError)
      // Don't fail the disconnect if cleanup fails
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'WhatsApp disconnected and session cleaned' 
    })
  } catch (error) {
    console.error('Error disconnecting WhatsApp:', error)
    return NextResponse.json({ 
      error: 'Failed to disconnect WhatsApp' 
    }, { status: 500 })
  }
}

async function sendStickerToSelf(mediaData: string) {
  try {
    if (!whatsappClient || !isClientReady) {
      return NextResponse.json({ 
        error: 'WhatsApp is not connected' 
      }, { status: 400 })
    }

    // Get your own number
    const clientInfo = await whatsappClient.info
    const myNumber = clientInfo.wid._serialized
    
    // Convert base64 to MessageMedia
    const { MessageMedia } = await import('whatsapp-web.js')
    const media = new MessageMedia('image/webp', mediaData.split(',')[1], 'sticker.webp')
    
    // Send sticker to yourself
    await whatsappClient.sendMessage(myNumber, media, { sendMediaAsSticker: true })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sticker sent successfully!' 
    })
  } catch (error) {
    console.error('Failed to send sticker:', error)
    return NextResponse.json({ 
      error: 'Failed to send sticker' 
    }, { status: 500 })
  }
}
