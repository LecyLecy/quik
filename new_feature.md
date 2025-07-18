# New Features Spec: WhatsApp Sticker Integration

## Technical Architecture

### Backend Server (Express.js)

- **Port**: 3001 (separate from Next.js on 3000)
- **WhatsApp Integration**: Using `whatsapp-web.js` library
- **Session Management**: Persistent session storage using JSON file or SQLite
- **Media Processing**: Sharp for images, FFmpeg for video/GIF processing
- **API Endpoints**:
  - `GET /api/whatsapp/status` - Check WhatsApp connection status
  - `GET /api/whatsapp/qr` - Get QR code for authentication
  - `POST /api/whatsapp/logout` - Logout/unlink WhatsApp session
  - `POST /api/whatsapp/send-sticker` - Send processed sticker to WhatsApp

### Frontend Architecture

- **State Management**: React Context for WhatsApp connection status
- **Navigation**: Sidebar-based navigation with animated burger menu
- **File Processing**: Client-side preview with server-side conversion
- **Real-time Updates**: Polling for QR code and connection status

---

## Burger Menu (Sidebar Navigation)

### Design Specifications:

- **Position**: Fixed overlay that slides from left
- **Width**: 280px on desktop, 85% screen width on mobile
- **Height**: Full viewport height minus header (64px)
- **Background**: `bg-[#1e1e1e]` with `border-r border-gray-700`
- **Backdrop**: `bg-black/50 backdrop-blur-sm` overlay
- **Animation**:
  - Slide duration: 300ms ease-in-out
  - Burger icon rotation: 180° transform to X
  - Staggered menu item fade-in (50ms delay each)

### Menu Items:

```tsx
const menuItems = [
  { id: 'notes', label: 'Your Notes', icon: '📝', active: true },
  { id: 'sticker', label: 'Sticker', icon: '🎨', active: false },
  // Future: Settings, About, etc.
]
```

### Burger Icon States:

- **Closed**: `☰` (3 horizontal lines)
- **Open**: `✕` (X icon) with smooth rotation animation
- **Color**: `text-white` with `hover:text-gray-300`

---

## Sticker Page

### Layout Structure:

```tsx
<div className="flex-1 flex flex-col items-center justify-center p-6">
  {/* Connection Status Card */}
  {!isConnected && <QRCodeCard />}
  
  {/* File Upload Area */}
  {isConnected && <FileUploadArea />}
  
  {/* Unlink Button */}
  {isConnected && <UnlinkButton />}
</div>
```

### QR Code Card:

- **Size**: 400x400px max, responsive
- **Loading State**: Skeleton loader with "Generating QR Code..." text
- **QR Display**: Centered QR code with "Scan with WhatsApp" instruction
- **Refresh**: Auto-refresh every 45 seconds
- **Error State**: "Failed to generate QR code" with retry button

### File Upload Area (Connected State):

- **Drag & Drop Zone**:
  - Size: 600x400px (desktop), full width minus padding (mobile)
  - Border: `border-2 border-dashed border-gray-600`
  - Hover: `border-blue-500 bg-blue-500/10`
  - Background: `bg-[#2c2c2c]`
- **Accepted Files**: Display file type icons and size limits
- **Upload Progress**: Linear progress bar with percentage
- **File Preview**: Replaces upload area when file is selected

### File Preview Box:

- **Container**: Same size as upload area
- **Content**: Centered media with `object-contain`
- **Controls**:
  - Top-right X button: Remove file
  - Bottom-right Edit button: Enter edit mode
- **File Info**: Filename, size, type at bottom

---

## Edit Mode

---



### Canvas Layout:

```tsx
<div className="edit-mode-container">
  <div className="preview-section">
    <div className="sticker-preview-box"> {/* 512x512 */}
      <div className="media-container">
        {/* Draggable & Resizable Media */}
      </div>
      <div className="crop-handles"> {/* 8 resize handles */}
    </div>
  </div>
  
  <div className="controls-section">
    {/* Video trim controls */}
    {/* Action buttons */}
  </div>
</div>
```

### Design Specifications:

- **Preview Box**: 512x512px with `border-2 border-gray-600`
- **Resize Handles**: 8 handles (corners + midpoints)
  - Size: 12x12px
  - Color: `bg-blue-500 border-2 border-white`
  - Hover: `bg-blue-400 scale-110`
- **Drag Area**: Cursor changes to move when over content
- **Video Trim Bar**:
  - Length: 400px
  - Track: `bg-gray-700 h-2 rounded`
  - Thumb: `bg-blue-500 w-4 h-4 rounded-full`
  - Time display: Current time / total time

### Video Processing:

- **Max Duration**: 5 seconds
- **Default Selection**: First 3 seconds
- **Live Preview**: Loop only selected segment
- **Frame Rate**: Maintain original up to 30fps
- **Quality**: Auto-optimize for WhatsApp sticker limits

### Action Buttons:

- **Cancel**: Return to file preview without saving changes
- **Send**: Open confirmation modal with final preview

---

## Send Confirmation Modal

### Modal Structure:

```tsx
<BaseModal isOpen={showSendModal} onClose={handleCancelSend}>
  <div className="send-modal-content">
    <h3>Send Sticker Preview</h3>
    <div className="final-preview-box"> {/* 512x512 */}
      {/* Final processed sticker */}
    </div>
    <div className="file-info">
      <p>Size: {fileSize}</p>
      <p>Format: WebP {isAnimated ? '(Animated)' : ''}</p>
    </div>
    <div className="modal-actions">
      <button className="cancel-btn">Cancel</button>
      <button className="send-btn">Send to WhatsApp</button>
    </div>
  </div>
</BaseModal>
```

### Processing Pipeline:

1. **Crop/Resize**: Apply user transformations
2. **Convert to WebP**: Static images → WebP, Videos/GIFs → Animated WebP
3. **Optimize**: Compress to meet WhatsApp limits (<1MB, ≤100 frames)
4. **Validate**: Check dimensions (512x512), file size, duration
5. **Send**: Upload to backend → Send via WhatsApp API

---

## State Management

### WhatsApp Context:

```tsx
interface WhatsAppContextType {
  isConnected: boolean;
  qrCode: string | null;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendSticker: (file: File, options: StickerOptions) => Promise<void>;
}
```

### File Processing State:

```tsx
interface FileState {
  file: File | null;
  preview: string | null;
  dimensions: { width: number; height: number };
  duration?: number; // for videos
  isProcessing: boolean;
  editMode: boolean;
  cropData: CropData;
}
```

---

## Error Handling & Edge Cases

### Connection Issues:

- **QR Expired**: Auto-refresh QR code
- **WhatsApp Disconnected**: Show reconnect prompt
- **Network Error**: Retry mechanism with exponential backoff

### File Processing:

- **Unsupported Format**: Show error with supported formats
- **File Too Large**: Auto-compress or show size limit error
- **Processing Failed**: Clear file and show error message

### Send Failures:

- **WhatsApp API Error**: Show specific error message
- **Network Timeout**: Retry mechanism
- **Session Expired**: Redirect to QR code page

---

## Performance Optimizations

### Media Processing:

- **Client-side Preview**: Immediate visual feedback
- **Server-side Conversion**: Heavy processing on backend
- **Lazy Loading**: Load QR code and status on demand
- **Caching**: Cache QR codes and session data

### UI Responsiveness:

- **Smooth Animations**: Hardware-accelerated transforms
- **Progressive Loading**: Show content as it loads
- **Optimistic Updates**: Immediate UI feedback
- **Memory Management**: Cleanup file previews and canvases

---

## Future Enhancements

### Additional Features:

- **Sticker Packs**: Create and manage sticker collections
- **Templates**: Pre-made sticker templates
- **Text Overlays**: Add text to stickers
- **Filters**: Apply visual effects
- **Batch Processing**: Process multiple stickers at once

### Multi-platform Support:

- **Telegram Stickers**: Extend to Telegram API
- **Discord Emojis**: Support Discord emoji upload
- **Export Options**: Save stickers locally

---

## Implementation Plan

### Phase 1: Core Infrastructure

1. **Backend Setup**: Express server with whatsapp-web.js
2. **Frontend Navigation**: Burger menu and sidebar
3. **Basic Sticker Page**: QR code display and file upload

### Phase 2: Media Processing

1. **File Upload**: Drag & drop with preview
2. **Edit Mode**: Crop, resize, and video trim
3. **Conversion Pipeline**: WebP processing

### Phase 3: WhatsApp Integration

1. **Session Management**: QR authentication
2. **Sticker Sending**: API integration
3. **Error Handling**: Robust error states

### Phase 4: Polish & Optimization

1. **Performance**: Optimize media processing
2. **UX Improvements**: Smooth animations and feedback
3. **Testing**: Edge cases and error scenarios

---

## Questions for Implementation

1. **Backend Architecture**: Should I create the Express server in a separate directory (`/server`) or integrate it into the Next.js project?
2. **Media Processing**: Do you prefer client-side processing with libraries like `fabric.js` for canvas manipulation, or should all heavy processing be done on the server?
3. **File Storage**: Should uploaded files be temporarily stored on the server, or processed directly in memory?
4. **Real-time Updates**: Should I use WebSockets for real-time QR code updates, or is polling sufficient?
5. **Design Consistency**: Should the sticker page components follow the same dark theme (`bg-[#1e1e1e]`) as the existing note components?

Let me know your preferences for these decisions, and I'll start implementing the features accordingly!
