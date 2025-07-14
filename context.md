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

---

# Current Progress

**Features/Components Implemented:**

- [X] Next.js app routing (App Router)
- [X] Supabase integration (auth + storage)
- [X] Typescript models (`NoteBubble`, `MediaItem`)
- [X] Text note with clickable links (using `react-linkify`)
- [X] Image, video, GIF, document upload with preview & modal
- [X] Countdown note with datetime input and countdown timer
- [X] Gallery modal for viewing all media if note has >4 contents
- [X] Full media delete (updates UI & Supabase storage)
- [X] Grid UI layout, mobile/desktop responsive
- [X] Multi-select bubble (select, unselect, bulk delete, modal confirm)
- [X] Scroll-to-bottom button & sticky header
- [X] Download confirmation modal with file name input/validation
- [X] All UI logic for disabling/enabling actions as needed

**Integrations:**

- Supabase (Database & Storage: `notes-media` bucket)
- `react-linkify` for auto-linking URLs in note descriptions

---

# Pending Tasks

- [ ] allow paste & drag and drop content
- [ ] i want to make file preview (when on bubble) i can see its name, file type, whats inside it, or atleast the top of the document or maybe blurry like on whatsapp, but i still need to click it and use other document opener app to view the whole document
- [ ] make it responsive for all 3 devices desktop (laptop), mobile (poco f3), tab (xiaomi pad 6)

---

# Technical Details

**Tech Stack:**

- Next.js (App Router, Typescript)
- React (functional components, hooks)
- Supabase (Postgres DB, Storage)
- Tailwind CSS for UI
- `react-linkify` for URL parsing
- (Optionally) Electron for desktop app shell (planned)
- 

**Context for GitHub Copilot:**
This is a mobile-first notes/chat app with rich media support, built with Next.js + Supabase.
UI must be robust for both desktop and mobile, all actions safe, async, and reflect instantly in UI.
All logic should be written clean, in Typescript, with reactivity for notes state.
Copilot should help with robust hooks, UI/UX flows, and edge-case handling!

for output, i want to to ask me for more detail if you are unsure, make sure i agree on what you are about to do, make sure what im thinking is the same as you, just ask me for anything like screenshot, file, etc or ask me like "do you want it to be like this or this"
