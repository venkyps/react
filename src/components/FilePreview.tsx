import React, { useState, useRef, useEffect } from 'react';
import {
  X, Download, Heart, Tag, Trash2, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, RotateCcw, Info
} from 'lucide-react';
import type { UploadedFile, FileTag } from '../types/file';
import { formatBytes, formatDate } from '../utils/fileUtils';

interface FilePreviewProps {
  file: UploadedFile;
  allFiles: UploadedFile[];
  onClose: () => void;
  onNavigate: (file: UploadedFile) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTag: (id: string, tag: FileTag) => void;
}

const AVAILABLE_TAGS: FileTag[] = ['Work', 'Personal', 'Important', 'Project', 'Draft', 'Media'];

const categoryEmoji: Record<string, string> = {
  image: '🖼️', video: '🎬', audio: '🎵', document: '📄',
  code: '💻', spreadsheet: '📊', archive: '🗜️', other: '📦',
};

export const FilePreview: React.FC<FilePreviewProps> = ({
  file, allFiles, onClose, onNavigate, onToggleFavorite, onDelete, onAddTag,
}) => {
  const [zoom, setZoom] = useState(1);
  const [showInfo, setShowInfo] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Find adjacent files in same category
  const siblingFiles = allFiles.filter(f => f.category === file.category && !f.inTrash);
  const currentIndex = siblingFiles.findIndex(f => f.id === file.id);
  const prevFile = currentIndex > 0 ? siblingFiles[currentIndex - 1] : null;
  const nextFile = currentIndex < siblingFiles.length - 1 ? siblingFiles[currentIndex + 1] : null;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && prevFile) onNavigate(prevFile);
      if (e.key === 'ArrowRight' && nextFile) onNavigate(nextFile);
      if (e.key === 'f') onToggleFavorite(file.id);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [file, prevFile, nextFile, onClose, onNavigate, onToggleFavorite]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.click();
  };

  const renderContent = () => {
    switch (file.category) {
      case 'image':
        return (
          <div className="preview-image-wrapper">
            <img
              src={file.url}
              alt={file.name}
              className="preview-image"
              style={{ transform: `scale(${zoom})` }}
              draggable={false}
            />
          </div>
        );

      case 'video':
        return (
          <div className="preview-video-wrapper">
            <video
              ref={videoRef}
              src={file.url}
              controls
              className="preview-video"
            >
              Your browser does not support video preview.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="preview-audio-wrapper">
            <div className="audio-art">
              <div className="audio-waveform-rings">
                {[120, 90, 60, 36].map((size, i) => (
                  <div key={i} className="audio-ring" style={{ width: size, height: size, animationDelay: `${i * 0.15}s` }} />
                ))}
                <span className="audio-emoji">🎵</span>
              </div>
              <p className="audio-filename">{file.name}</p>
              {file.duration && <p className="audio-duration">{Math.floor(file.duration / 60)}:{String(file.duration % 60).padStart(2, '0')}</p>}
            </div>
            <audio ref={audioRef} src={file.url} controls className="preview-audio-player" />
          </div>
        );

      case 'spreadsheet':
        return file.parsedCsv && file.parsedCsv.length > 0 ? (
          <div className="preview-table-wrapper">
            <table className="preview-table">
              <thead>
                <tr>
                  {file.parsedCsv[0].map((col, i) => (
                    <th key={i}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {file.parsedCsv.slice(1).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : renderCodeFallback();

      case 'code':
      case 'document':
      default:
        return renderCodeFallback();
    }
  };

  const renderCodeFallback = () => {
    if (!file.textContent) {
      return (
        <div className="preview-no-content">
          <div className="no-content-emoji">{categoryEmoji[file.category] || '📦'}</div>
          <p className="no-content-name">{file.name}</p>
          <p className="no-content-type">Binary or unsupported preview</p>
          <button className="btn-primary" onClick={handleDownload}>Download to view</button>
        </div>
      );
    }

    // JSON pretty view
    if (file.jsonContent) {
      return (
        <div className="preview-code-wrapper">
          <pre className="preview-code json-code">
            {JSON.stringify(file.jsonContent, null, 2)}
          </pre>
        </div>
      );
    }

    return (
      <div className="preview-code-wrapper">
        <pre className="preview-code">{file.textContent}</pre>
      </div>
    );
  };

  return (
    <div className="preview-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="preview-sheet" style={{ animation: 'slideUpModal 0.3s ease' }}>
        {/* Top bar */}
        <div className="preview-topbar">
          <button className="icon-btn-sm" onClick={onClose} aria-label="Close preview">
            <X size={18} />
          </button>
          <div className="preview-topbar-title">
            <span className="preview-category-badge">{categoryEmoji[file.category]}</span>
            <span className="preview-filename-short" title={file.name}>
              {file.name.length > 22 ? `${file.name.slice(0, 19)}…${file.name.slice(file.name.lastIndexOf('.'))}` : file.name}
            </span>
          </div>
          <div className="preview-topbar-actions">
            {file.category === 'image' && (
              <>
                <button className="icon-btn-sm" onClick={() => setZoom(z => Math.min(z + 0.25, 3))} aria-label="Zoom in">
                  <ZoomIn size={16} />
                </button>
                <button className="icon-btn-sm" onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} aria-label="Zoom out">
                  <ZoomOut size={16} />
                </button>
                {zoom !== 1 && (
                  <button className="icon-btn-sm" onClick={() => setZoom(1)} aria-label="Reset zoom">
                    <RotateCcw size={15} />
                  </button>
                )}
              </>
            )}
            <button className="icon-btn-sm" onClick={() => setShowInfo(v => !v)} aria-label="Toggle file info">
              <Info size={16} />
            </button>
          </div>
        </div>

        {/* File Info Panel */}
        {showInfo && (
          <div className="preview-info-panel">
            <div className="info-row"><span>Size</span><span>{formatBytes(file.size)}</span></div>
            <div className="info-row"><span>Type</span><span>{file.type || 'Unknown'}</span></div>
            <div className="info-row"><span>Added</span><span>{formatDate(file.uploadDate)}</span></div>
            {file.dimensions && (
              <div className="info-row"><span>Dimensions</span><span>{file.dimensions.width} × {file.dimensions.height}</span></div>
            )}
            {file.duration && (
              <div className="info-row"><span>Duration</span><span>{Math.floor(file.duration / 60)}:{String(file.duration % 60).padStart(2, '0')}</span></div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="preview-content">
          {renderContent()}
        </div>

        {/* Navigation */}
        {(prevFile || nextFile) && (
          <div className="preview-nav-arrows">
            <button
              className={`preview-nav-btn ${!prevFile ? 'disabled' : ''}`}
              disabled={!prevFile}
              onClick={() => prevFile && onNavigate(prevFile)}
              aria-label="Previous file"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="preview-nav-counter">{currentIndex + 1} / {siblingFiles.length}</span>
            <button
              className={`preview-nav-btn ${!nextFile ? 'disabled' : ''}`}
              disabled={!nextFile}
              onClick={() => nextFile && onNavigate(nextFile)}
              aria-label="Next file"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className="preview-actions-bar">
          <button
            className={`preview-action-btn ${file.favorite ? 'favorite-active' : ''}`}
            onClick={() => onToggleFavorite(file.id)}
            aria-label="Toggle favorite"
          >
            <Heart size={20} fill={file.favorite ? 'currentColor' : 'none'} />
            <span>{file.favorite ? 'Saved' : 'Save'}</span>
          </button>

          <button className="preview-action-btn" onClick={handleDownload} aria-label="Download">
            <Download size={20} />
            <span>Download</span>
          </button>

          <div className="preview-action-btn-wrap">
            <button
              className="preview-action-btn"
              onClick={() => setShowTagPicker(v => !v)}
              aria-label="Add tag"
            >
              <Tag size={20} />
              <span>Tag</span>
            </button>
            {showTagPicker && (
              <div className="tag-picker-popup">
                {AVAILABLE_TAGS.map(tag => (
                  <button
                    key={tag}
                    className={`tag-pick-btn ${file.tags.includes(tag) ? 'active' : ''}`}
                    onClick={() => { onAddTag(file.id, tag); }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="preview-action-btn danger"
            onClick={() => { onDelete(file.id); onClose(); }}
            aria-label="Delete file"
          >
            <Trash2 size={20} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
