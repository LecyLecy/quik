# Project Overview

This is a **Next.js + Supabase notes/chat app** that lets users create, edit, and manage text notes, images, videos, GIFs, and documents.
The app supports rich media previews, countdown notes, fullscreen modal previews, and robust UI/UX for both mobile and desktop—similar to LINE/WhatsApp.

**Key Features:**

- Multi-type notes: text, image, GIF, video, document
- Countdown note with live countdown display
- Media upload with Supabase Storage (`notes-media` bucket)
- Grid preview (with gallery modal if >4 contents)
- Fullscreen modal for images/videos/GIFs
- Document/gif/video preview (with play icon overlay for video)
- Clickable links in notes (`react-linkify`)
- Safe update, delete (also deletes from Supabase Storage)
- Select-mode to bulk select & delete notes (multi-select UI)
- Optimistic UI: notes update immediately on add/edit/delete
- Responsive layout: grid adapts to mobile & desktop
- "Scroll to bottom" button, sticky header
- Disabled buttons & input validation (file naming, select mode)
- Prevents any actions on a bubble in select mode
- **Memory Leak Prevention**: Automatic cleanup of uploaded files that aren't saved (prevents storage bloat from page refreshes)

**Integrations:**

- Supabase (Database & Storage: `notes-media` bucket)
- `react-linkify` for auto-linking URLs in note descriptions

---

# Technical Details

**Tech Stack:**

- Next.js 15.3.5 (App Router, TypeScript)
- React (functional components, hooks)
- Supabase (Postgres DB, Storage)
- Tailwind CSS for UI
- `react-linkify` for URL parsing

**Project Structure:**
```
src/
  app/
    globals.css          # Global styles with Tailwind CSS integration
    layout.tsx           # Root layout component
    page.tsx             # Main page component
  components/
    NoteInput.tsx        # Main note input component with memory leak prevention
    NoteBubble.tsx       # Individual note display component
    DocumentPreview.tsx  # Document file preview
    MediaModal.tsx       # Fullscreen media viewer
    GalleryModal.tsx     # Image gallery for multiple images
    BaseModal.tsx        # Base modal component
    SwipeDeleteConfirmModal.tsx  # Confirmation for swipe delete
    DownloadAndDeleteConfirmationModal.tsx  # Download/delete confirmation
  hooks/
    useNotes.ts          # Notes data management
    useSaveNote.ts       # Note saving functionality
    useSwipeGesture.ts   # Swipe gesture handling
    useWindowWidth.ts    # Responsive width detection
  lib/
    supabase/
      client.ts          # Supabase client configuration
  types/
    note.ts              # TypeScript interfaces for notes and media
```

**Recent Implementations:**

1. **Memory Leak Fix (NoteInput.tsx):**
   - Added `tempUploads` state to track temporary file uploads
   - Cleanup effect that removes orphaned uploads on page load/unload
   - Automatic removal from tracking when files are manually deleted
   - Automatic cleanup when notes are successfully saved
   - localStorage fallback for persistence across page refreshes

**Current Issues Resolved:**
- ✅ Memory leak where uploaded files remained in Supabase storage after page refresh without saving
- ✅ Proper file cleanup on manual removal, successful save, and page navigation

**Context for GitHub Copilot:**
This is a mobile-first notes/chat app with rich media support, built with Next.js + Supabase.
UI must be robust for both desktop and mobile, all actions safe, async, and reflect instantly in UI.
All logic should be written clean, in TypeScript, with reactivity for notes state.
The NoteInput component now includes comprehensive memory leak prevention for uploaded files.

**Important Notes:**
- CSS uses `@import "tailwindcss";` in globals.css (Next.js specific syntax)
- All file uploads go to Supabase `notes-media` bucket
- Temporary uploads are tracked and cleaned up automatically
- Always maintain existing styling and only implement requested features

**Development Guidelines:**
- Ask for clarification when unsure about implementation details
- Confirm understanding before making changes
- Request screenshots or examples when needed
- Always preserve existing functionality unless explicitly asked to change
- Be extremely careful with CSS changes as they can break the dark theme styling
