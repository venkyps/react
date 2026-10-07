import React, { useState, useEffect } from 'react';
import {
  X, Download, Heart, Tag, Trash2,
  ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import type { UploadedFile, FileTag } from '../types/file';
import { formatBytes, formatDate } from '../utils/fileUtils';
import { extractReceiptData } from '../utils/receiptUtils';

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
  document: '📄',
  other: '📦',
};


export const FilePreview: React.FC<FilePreviewProps> = ({
  file, allFiles, onClose, onNavigate, onToggleFavorite, onDelete, onAddTag,
}) => {
  const [showInfo, setShowInfo] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [fileText, setFileText] = useState(file.textContent || '');
  const [extractedAmount, setExtractedAmount] = useState(file.extractedAmount || '');
  const [ocrLoading, setOcrLoading] = useState(false);

  useEffect(() => {
    setFileText(file.textContent || '');
    setExtractedAmount(file.extractedAmount || '');

    if (file.category === 'image' && file.url) {
      setOcrLoading(true);
      extractReceiptData(file.url).then(({ extractedAmount, rawText }) => {
        if (rawText && rawText.trim()) {
          setFileText(rawText);
          file.textContent = rawText;
        }
        if (extractedAmount) {
          setExtractedAmount(extractedAmount);
          file.extractedAmount = extractedAmount;
          file.isReceipt = true;
        }
        setOcrLoading(false);
      }).catch(e => {
        console.warn('OCR error in preview:', e);
        setOcrLoading(false);
      });
    }
  }, [file]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setFileText(newText);
    file.textContent = newText;
  };


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
    if (file.category === 'image' && file.url) {
      return (
        <div className="preview-image-container" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          padding: '12px',
          boxSizing: 'border-box'
        }}>
          <div className="preview-image-wrapper" style={{ maxHeight: '220px', flexShrink: 0 }}>
            <img
              src={file.url}
              alt={file.name}
              className="preview-image"
              draggable={false}
              style={{ maxHeight: '200px' }}
            />
          </div>

          <div className="preview-ocr-section" style={{
            background: 'rgba(15, 23, 42, 0.7)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                Extracted Text &amp; Data
              </span>
              <button
                type="button"
                onClick={() => {
                  setOcrLoading(true);
                  extractReceiptData(file.url).then(({ extractedAmount, rawText }) => {
                    setFileText(rawText || '');
                    file.textContent = rawText || '';
                    if (extractedAmount) {
                      setExtractedAmount(extractedAmount);
                      file.extractedAmount = extractedAmount;
                    }
                    setOcrLoading(false);
                  }).catch(() => setOcrLoading(false));
                }}
                style={{
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#818cf8',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {ocrLoading ? 'Scanning...' : '⚡ Extract / Rescan'}
              </button>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '13px',
              color: '#34d399',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <span>Extracted Total Amount:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700 }}>$</span>
                <input
                  type="text"
                  value={extractedAmount}
                  placeholder="47.40"
                  onChange={(e) => {
                    const val = e.target.value;
                    setExtractedAmount(val);
                    file.extractedAmount = val;
                    file.isReceipt = true;
                  }}
                  style={{
                    background: 'rgba(2, 6, 23, 0.6)',
                    border: '1px solid rgba(52, 211, 153, 0.4)',
                    borderRadius: '4px',
                    color: '#34d399',
                    fontSize: '14px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    width: '90px',
                    outline: 'none',
                    textAlign: 'right'
                  }}
                />
              </div>
            </div>

            <textarea
              className="preview-code-editable"
              value={fileText}
              onChange={handleTextChange}
              placeholder={ocrLoading ? "Extracting text from image..." : "No text extracted. Type here..."}
              style={{
                width: '100%',
                minHeight: '130px',
                maxHeight: '220px',
                background: 'rgba(2, 6, 23, 0.6)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.5',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      );
    }
    return renderCodeFallback();
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary, #94a3b8)', fontWeight: 500 }}>Editable Content</span>
        </div>
        <textarea
          className="preview-code-editable"
          value={fileText}
          onChange={handleTextChange}
          placeholder="No content available. Type here..."
          style={{
            width: '100%',
            minHeight: '260px',
            maxHeight: '400px',
            background: 'rgba(15, 23, 42, 0.6)',
            color: '#e2e8f0',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '12px',
            fontFamily: 'monospace',
            fontSize: '13px',
            lineHeight: '1.5',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
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
