# 📱 FileVault — Mobile File Upload & Display App

A mobile-first React + TypeScript web application for uploading, organizing, and previewing files of any type. Built with Vite, styled with vanilla CSS using glassmorphism and dark-mode aesthetics, and persisted with IndexedDB.

---

## 🚀 Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI framework with hooks |
| **TypeScript** | Strict type safety |
| **Vite** | Fast dev server & bundler |
| **Vanilla CSS** | Custom styling, glassmorphism, animations |
| **IndexedDB** | Browser-native persistent file storage |
| **Lucide React** | Icon set |

---

## 📁 Project Structure

```
react/
├── index.html                  # App entry, SEO meta, PWA meta tags
├── src/
│   ├── main.tsx                # React DOM root mount
│   ├── App.tsx                 # Root component, global state, routing logic
│   ├── App.css                 # All component styles, animations, layout
│   ├── index.css               # CSS variables, theme tokens, global resets
│   ├── types/
│   │   └── file.ts             # Shared TypeScript type definitions
│   ├── utils/
│   │   ├── fileUtils.ts        # File helpers: categories, formatters, parsers
│   │   └── storage.ts          # IndexedDB CRUD wrapper
│   └── components/
│       ├── MobileFrame.tsx     # Phone frame shell with status bar
│       ├── UploadZone.tsx      # Drag-and-drop uploader with progress
│       ├── FileCard.tsx        # Single file card (grid + list modes)
│       ├── FilePreview.tsx     # Full-screen file viewer
│       ├── SearchBar.tsx       # Search input, category pills, filters
│       └── StorageBar.tsx      # Color-coded storage usage bar
```

---

## 🧩 Component Breakdown

### `App.tsx` — Root Component
The central hub. Owns all application state and wires components together.

**State managed:**
- `files` — full list of all `UploadedFile` objects loaded from IndexedDB
- `filterState` — search query, category, tag, sort, favorites, trash flags
- `viewMode` — `'grid'` or `'list'`
- `previewFile` — the currently open file in the preview sheet
- `showUpload` — controls visibility of the upload modal
- `isDarkTheme` / `isFrameEnabled` — UI display preferences

**Key logic:**
- `applyFilters()` — pure function that filters + sorts the file list based on `FilterState`
- `handleFilesUploaded()` — merges new files into state and saves each to IndexedDB
- `handleDeleteFile()` — moves to trash on first delete; permanently removes on second
- `handleToggleFavorite()` — toggles `favorite` flag and syncs to IndexedDB
- `handleAddTag()` — toggles a tag on/off for a file
- **One-time migration:** On first load, checks `localStorage` for `filevault_samples_cleared_v1`. If absent, clears IndexedDB and sets the flag. Future loads go straight to reading IndexedDB.

---

### `types/file.ts` — Type Definitions
All shared TypeScript types in one place.

```ts
type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'code' | 'spreadsheet' | 'archive' | 'other'
type FileTag     = 'Work' | 'Personal' | 'Important' | 'Project' | 'Draft' | 'Media'

interface UploadedFile {
  id, name, size, type, category, url,
  uploadDate, favorite, tags, inTrash?,
  dimensions?, duration?, textContent?, parsedCsv?, jsonContent?
}

interface FilterState {
  searchQuery, category, tag,
  favoritesOnly, inTrash, sortBy, sortOrder
}
```

---

### `utils/storage.ts` — IndexedDB Wrapper
Provides async CRUD operations over a local IndexedDB database so files persist across page reloads.

| Function | Description |
|---|---|
| `saveFileToStorage(file)` | Upserts a file record (uses `put`) |
| `getAllFilesFromStorage()` | Returns all stored file records |
| `deleteFileFromStorage(id)` | Permanently removes a single record |
| `clearAllFilesFromStorage()` | Wipes the entire object store |

- Database name: `MobileFileVaultDB`
- Object store: `uploaded_files`, keyed by `id`
- Falls back silently if IndexedDB is unavailable

---

### `utils/fileUtils.ts` — File Utilities

| Function | Description |
|---|---|
| `getFileCategory(file)` | Detects category from MIME type and extension |
| `formatBytes(bytes)` | Human-readable size string (e.g. `2.4 MB`) |
| `formatDate(isoString)` | Locale-aware readable date string |
| `parseCSV(text)` | Basic CSV parser → `string[][]` (handles quoted fields) |
| `fileToDataURL(file)` | Reads a `File` as a base64 data URL |
| `fileToText(file)` | Reads a `File` as plain text |

---

### `components/UploadZone.tsx` — File Uploader
Bottom sheet modal triggered by the FAB button.

**Features:**
- **Drag-and-drop** support (`onDragOver`, `onDrop`)
- **File picker** via hidden `<input type="file" multiple>`
- **Quick type buttons** — Photos, Videos, Audio, Docs (pre-sets `accept` attribute)
- **Per-file progress bars** with simulated progress animation
- **50 MB size limit** enforced per file
- **Auto-processing pipeline:**
  1. Images/audio/video → read as Data URL
  2. Text/code/spreadsheet → read as text, then base64 encoded
  3. CSV files → also parsed into `string[][]` for table preview
  4. JSON files → also `JSON.parse`d for structured preview
- Calls `onFilesUploaded` callback with array of `UploadedFile` objects
- Auto-closes after all files finish

---

### `components/FileCard.tsx` — File Card
Renders a single file in either **grid** or **list** mode.

**Grid mode:**
- Thumbnail preview for images; emoji icon for other types
- Color-coded background per file category
- ❤️ favorite badge overlay (top-right)
- Hover overlay with quick actions: favorite, download, delete

**List mode:**
- Small square thumbnail + file name, size, date
- Inline tag chips
- Favorite toggle and delete buttons

---

### `components/FilePreview.tsx` — Full-Screen File Viewer
A bottom sheet that slides up when a file card is tapped.

**Preview modes by category:**

| Category | Preview |
|---|---|
| `image` | `<img>` with zoom controls (25% steps) |
| `video` | Native HTML5 `<video>` with controls |
| `audio` | Animated pulsing rings + native `<audio>` player |
| `spreadsheet` | Scrollable sticky-header `<table>` from parsed CSV |
| `code` / `document` | Monospace `<pre>` block; JSON rendered in cyan |
| Other | Download prompt |

**Additional features:**
- **File info panel** (toggle) — size, type, date, dimensions, duration
- **Keyboard shortcuts** — `Esc` to close, `←`/`→` to navigate, `F` to favorite
- **Sibling navigation** — cycles through files of the same category
- **Tag picker popup** — toggle any `FileTag` directly from the preview
- **Download** generates an `<a download>` click
- **Delete** moves to trash and closes preview

---

### `components/SearchBar.tsx` — Search & Filter Bar

**Controls:**
- 🔍 Text search — matches file name, category, or tags
- **Category pills** — `All | Images | Videos | Audio | Docs | Code | Sheets | Archives`
- **Advanced panel** (toggled by sliders icon):
  - ⭐ Favorites only toggle
  - 🗑️ Trash view toggle
  - Sort by: Date / Name / Size / Type (with Asc/Desc toggle)
  - Tag filter chips — `Work | Personal | Important | Project | Draft | Media`
- Results count display

---

### `components/MobileFrame.tsx` — Phone Shell
Wraps the app in a realistic smartphone frame for desktop preview.

- Renders a device with Dynamic Island notch, camera lens, speaker, status bar (live clock, signal/wifi/battery icons), and home indicator bar
- Can be toggled off via the header button for a full-screen layout
- "Full Screen" pill button shown below the frame

---

### `components/StorageBar.tsx` — Storage Usage Bar
Segmented horizontal bar showing disk usage broken down by file category.

- Each category gets a distinct color segment proportional to its byte usage
- Legend shows top 4 categories with sizes
- Displays total used vs. simulated 500 MB quota

---

## 🎨 Styling Architecture

### `index.css` — Design Tokens
CSS custom properties define the entire theme:

```css
--bg-main, --bg-surface, --bg-card      /* backgrounds */
--accent-primary (#6366f1)              /* indigo */
--accent-secondary (#06b6d4)            /* cyan */
--text-primary, --text-secondary, --text-muted
--radius-sm / md / lg / xl / full
--shadow-sm / md / glow
```

A `.light-theme` class on `<html>` overrides all dark-mode variables.

### `App.css` — Component Styles
Organized by section:

| Section | Key Classes |
|---|---|
| Phone Frame | `.mobile-phone-device`, `.phone-notch`, `.phone-status-bar` |
| Header | `.app-header`, `.icon-btn`, `.view-toggle` |
| Search | `.search-input-wrap`, `.category-pill`, `.advanced-filters-panel` |
| File Grid/List | `.file-grid`, `.file-list`, `.file-card`, `.file-list-item` |
| Upload Zone | `.drop-zone`, `.progress-bar-track`, `.quick-action-btn` |
| File Preview | `.preview-overlay`, `.preview-sheet`, `.preview-image`, `.preview-table` |
| Buttons & States | `.btn-primary`, `.fab-upload-btn`, `.empty-state`, `.loading-spinner` |

### Animations
| Name | Used On |
|---|---|
| `pulseGlow` | Drop zone border when active |
| `floatAnimation` | FAB button, empty state emoji |
| `slideUpModal` | Upload sheet and preview sheet entrance |
| `fadeIn` | File card entrance in grid |
| `spin` | Loading spinner |

---

## 🔄 Data Flow

```
User uploads file
      │
      ▼
UploadZone.tsx
  ├─ Reads File via FileReader (DataURL / text)
  ├─ Detects category via getFileCategory()
  ├─ Parses CSV / JSON if applicable
  └─ Calls onFilesUploaded(UploadedFile[])
          │
          ▼
App.tsx — handleFilesUploaded()
  ├─ Merges into files[] state (useState)
  └─ Saves each to IndexedDB via saveFileToStorage()
          │
          ▼
applyFilters(files, filterState)   ← useMemo, recalculates on filter change
          │
          ▼
FileCard rendered (grid or list)
  └─ User taps → FilePreview opens
          │
          ▼
Actions: favorite / tag / delete / download
  └─ Update React state + sync to IndexedDB
```

---

## ⚡ Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
# → App available at http://localhost:5173/
```

---

## 🌐 SEO & PWA Metadata

Defined in `index.html`:

```html
<title>FileVault – Mobile File Manager</title>
<meta name="description" content="Upload, organize and preview any file type from your mobile device." />
<meta name="theme-color" content="#0b0f19" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```
