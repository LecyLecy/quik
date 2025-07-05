---
## 🧠 Quik Project Developer Context

### Key Concepts
- Quik is a personal note/chat-style productivity app with image/video/document support.
- It uses:
  - **Next.js + TypeScript**
  - **Firebase (Firestore, Storage, Auth [Anonymous])**
- All note “bubbles” are synced in real-time with timestamp, files, and user control tools (edit, delete, etc.)

### Structure Overview
- `lib/firebase/` → Firebase config and SDK setup
- `src/app/` → App routes and UI pages (Next.js App Router)
- `components/` → UI components like Bubble, InputBox, Toolbar
- `hooks/` → Custom hooks for auth, sync, drag, edit
- `types/` → TypeScript interfaces (Note, MediaItem, etc.)

### Firebase
- Anonymous Auth is used for identifying a user across 3 personal devices.
- Firestore for notes, countdowns, folders.
- Storage for uploaded media (image/video/docs).

### Modal Gallery UX
- Clicking bubble with multiple media opens modal.
- Modal supports swipe left/right, full preview (including document viewer), and batch delete via checkboxes.
---
