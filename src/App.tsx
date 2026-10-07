import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Upload, Grid, List, Moon, Sun, Monitor,
  Trash2, RefreshCcw, Plus
} from 'lucide-react';
import type { UploadedFile, FilterState, FileTag } from './types/file';

import {
  saveFileToStorage, getAllFilesFromStorage,
  deleteFileFromStorage, clearAllFilesFromStorage
} from './utils/storage';
import { MobileFrame } from './components/MobileFrame';
import { UploadZone } from './components/UploadZone';
import { FileCard } from './components/FileCard';
import { FilePreview } from './components/FilePreview';
import { SearchBar } from './components/SearchBar';

import './App.css';

const INITIAL_FILTER: FilterState = {
  searchQuery: '',
  category: 'all',
  tag: 'all',
  favoritesOnly: false,
  inTrash: false,
  sortBy: 'date',
  sortOrder: 'desc',
};




function applyFilters(files: UploadedFile[], filter: FilterState): UploadedFile[] {
  let result = [...files];

  // Trash vs active
  result = result.filter(f => !!f.inTrash === filter.inTrash);

  // Favorites
  if (filter.favoritesOnly) {
    result = result.filter(f => f.favorite);
  }

  // Category
  if (filter.category !== 'all') {
    result = result.filter(f => f.category === filter.category);
  }

  // Tag
  if (filter.tag !== 'all') {
    result = result.filter(f => f.tags.includes(filter.tag as FileTag));
  }

  // Search
  if (filter.searchQuery.trim()) {
    const q = filter.searchQuery.toLowerCase();
    result = result.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      f.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Sort
  result.sort((a, b) => {
    let cmp = 0;
    if (filter.sortBy === 'date') cmp = new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime();
    else if (filter.sortBy === 'name') cmp = a.name.localeCompare(b.name);
    else if (filter.sortBy === 'size') cmp = a.size - b.size;
    else if (filter.sortBy === 'type') cmp = a.category.localeCompare(b.category);
    return filter.sortOrder === 'desc' ? -cmp : cmp;
  });

  return result;
}

export default function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [filterState, setFilterState] = useState<FilterState>(INITIAL_FILTER);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isFrameEnabled, setIsFrameEnabled] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from IndexedDB — one-time clear of old sample data
  useEffect(() => {
    const CLEARED_KEY = 'filevault_samples_cleared_v1';
    const alreadyCleared = localStorage.getItem(CLEARED_KEY);
    const load = () =>
      getAllFilesFromStorage().then(stored => {
        setFiles(stored);
        setIsLoaded(true);
      });
    if (!alreadyCleared) {
      clearAllFilesFromStorage().then(() => {
        localStorage.setItem(CLEARED_KEY, '1');
        load();
      });
    } else {
      load();
    }
  }, []);

  // Apply theme class
  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.add('light-theme');
    }
  }, [isDarkTheme]);

  const filteredFiles = useMemo(() => applyFilters(files, filterState), [files, filterState]);


  const handleFilesUploaded = useCallback((newFiles: UploadedFile[]) => {
    setFiles(prev => {
      const updated = [...newFiles, ...prev];
      newFiles.forEach(f => saveFileToStorage(f));
      return updated;
    });
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id !== id) return f;
        const updated = { ...f, favorite: !f.favorite };
        saveFileToStorage(updated);
        return updated;
      })
    );
  }, []);

  const handleDeleteFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (!file) return prev;
      // Move to trash if not already there, else permanently delete
      if (!file.inTrash) {
        const updated = prev.map(f => f.id === id ? { ...f, inTrash: true } : f);
        const trashed = updated.find(f => f.id === id)!;
        saveFileToStorage(trashed);
        return updated;
      } else {
        deleteFileFromStorage(id);
        return prev.filter(f => f.id !== id);
      }
    });
  }, []);

  const handleRestoreFile = useCallback((id: string) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id !== id) return f;
        const updated = { ...f, inTrash: false };
        saveFileToStorage(updated);
        return updated;
      })
    );
  }, []);

  const handleEmptyTrash = useCallback(async () => {
    const trashedIds = files.filter(f => f.inTrash).map(f => f.id);
    for (const id of trashedIds) await deleteFileFromStorage(id);
    setFiles(prev => prev.filter(f => !f.inTrash));
  }, [files]);

  const handleAddTag = useCallback((id: string, tag: FileTag) => {
    setFiles(prev =>
      prev.map(f => {
        if (f.id !== id) return f;
        const tags = f.tags.includes(tag)
          ? f.tags.filter(t => t !== tag)
          : [...f.tags, tag];
        const updated = { ...f, tags };
        saveFileToStorage(updated);
        return updated;
      })
    );
  }, []);

  const handleFilterChange = useCallback((partial: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...partial }));
  }, []);

  const appContent = (
    <div className="app-container" id="app-root">
      {/* Minimal Header */}
      <header className="app-header glass-panel">
        <div className="header-right" style={{ width: '100%', justifyContent: 'flex-end' }}>
          <button
            className="icon-btn"
            onClick={() => setIsDarkTheme(v => !v)}
            aria-label="Toggle theme"
            title="Toggle dark/light mode"
          >
            {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="icon-btn"
            onClick={() => setIsFrameEnabled(v => !v)}
            aria-label="Toggle mobile frame"
            title="Toggle phone frame"
          >
            {isFrameEnabled ? <Monitor size={18} /> : <Smartphone size={18} />}
          </button>
          <button
            className={`icon-btn view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <Grid size={16} />
          </button>
          <button
            className={`icon-btn view-toggle ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </header>

      {/* Search & Filters */}
      <SearchBar
        filterState={filterState}
        onChange={handleFilterChange}
        totalResults={filteredFiles.length}
      />

      {/* File Grid / List */}
      <main className="files-main" aria-label="Files list">
        {!isLoaded ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading vault…</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="empty-state">
            {filterState.inTrash ? (
              <>
                <div className="empty-emoji">🗑️</div>
                <p className="empty-title">Trash is empty</p>
                <p className="empty-sub">Deleted files appear here</p>
              </>
            ) : (
              <>
                <div className="empty-emoji floating-anim">📁</div>
                <p className="empty-title">No files yet</p>
                <p className="empty-sub">Tap the + button to upload your first file</p>
                <button className="btn-primary mt-4" onClick={() => setShowUpload(true)}>
                  <Upload size={16} />
                  <span>Upload Files</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {filterState.inTrash && (
              <div className="trash-banner">
                <Trash2 size={14} />
                <span>Files in trash will not count towards storage</span>
                <button className="trash-empty-btn" onClick={handleEmptyTrash}>Empty All</button>
              </div>
            )}
            <div className={viewMode === 'grid' ? 'file-grid' : 'file-list'}>
              {filteredFiles.map(file => (
                <div key={file.id} className="file-item-wrap">
                  <FileCard
                    file={file}
                    viewMode={viewMode}
                    onOpen={setPreviewFile}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDeleteFile}
                  />
                  {filterState.inTrash && (
                    <button
                      className="restore-btn"
                      onClick={() => handleRestoreFile(file.id)}
                      title="Restore from trash"
                    >
                      <RefreshCcw size={12} />
                      Restore
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* FAB Upload Button */}
      {!filterState.inTrash && (
        <button
          id="fab-upload-btn"
          className="fab-upload-btn"
          onClick={() => setShowUpload(true)}
          aria-label="Upload files"
        >
          <Plus size={26} />
        </button>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowUpload(false); }}>
          <div className="modal-sheet" style={{ animation: 'slideUpModal 0.3s ease' }}>
            <UploadZone
              onFilesUploaded={handleFilesUploaded}
              onClose={() => setShowUpload(false)}
            />
          </div>
        </div>
      )}

      {/* File Preview */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          allFiles={files}
          onClose={() => setPreviewFile(null)}
          onNavigate={setPreviewFile}
          onToggleFavorite={handleToggleFavorite}
          onDelete={(id) => { handleDeleteFile(id); setPreviewFile(null); }}
          onAddTag={handleAddTag}
        />
      )}
    </div>
  );

  return (
    <MobileFrame isFrameEnabled={isFrameEnabled} onToggleFrame={() => setIsFrameEnabled(v => !v)}>
      {appContent}
    </MobileFrame>
  );
}
