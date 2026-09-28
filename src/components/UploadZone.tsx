import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getFileCategory, fileToDataURL, fileToText, parseCSV, formatBytes } from '../utils/fileUtils';
import type { UploadedFile, FileTag } from '../types/file';

interface UploadZoneProps {
  onFilesUploaded: (files: UploadedFile[]) => void;
  onClose?: () => void;
}

interface UploadProgress {
  name: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesUploaded, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [progresses, setProgresses] = useState<UploadProgress[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFiles = useCallback(async (rawFiles: File[]) => {
    if (rawFiles.length === 0) return;
    setIsProcessing(true);

    // Initialize progress list
    const initialProgresses: UploadProgress[] = rawFiles.map(f => ({
      name: f.name,
      progress: 0,
      status: 'uploading',
    }));
    setProgresses(initialProgresses);

    const results: UploadedFile[] = [];

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];

      try {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File exceeds 50MB limit (${formatBytes(file.size)})`);
        }

        // Simulate progress
        for (let p = 10; p <= 70; p += 20) {
          await new Promise(r => setTimeout(r, 80));
          setProgresses(prev => prev.map((x, idx) => idx === i ? { ...x, progress: p } : x));
        }

        const category = getFileCategory(file);
        let url = '';
        let textContent: string | undefined;
        let parsedCsv: string[][] | undefined;
        let jsonContent: any;

        if (['image', 'audio', 'video'].includes(category)) {
          url = await fileToDataURL(file);
        } else if (['document', 'code', 'spreadsheet', 'other'].includes(category)) {
          try {
            textContent = await fileToText(file);
            url = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(textContent.slice(0, 100000))))}`;
            if (category === 'spreadsheet' || file.name.endsWith('.csv') || file.name.endsWith('.tsv')) {
              parsedCsv = parseCSV(textContent);
            }
            if (file.name.endsWith('.json')) {
              try { jsonContent = JSON.parse(textContent); } catch {}
            }
          } catch {
            url = URL.createObjectURL(file);
          }
        } else {
          url = URL.createObjectURL(file);
        }

        setProgresses(prev => prev.map((x, idx) => idx === i ? { ...x, progress: 90 } : x));
        await new Promise(r => setTimeout(r, 60));

        const uploadedFile: UploadedFile = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          category,
          url,
          uploadDate: new Date().toISOString(),
          lastModified: file.lastModified,
          favorite: false,
          tags: [] as FileTag[],
          textContent,
          parsedCsv,
          jsonContent,
        };

        results.push(uploadedFile);
        setProgresses(prev => prev.map((x, idx) => idx === i ? { ...x, progress: 100, status: 'done' } : x));
      } catch (err: any) {
        setProgresses(prev => prev.map((x, idx) =>
          idx === i ? { ...x, progress: 100, status: 'error', error: err.message || 'Upload failed' } : x
        ));
      }
    }

    if (results.length > 0) {
      onFilesUploaded(results);
    }

    // Auto close after success delay if ALL done
    await new Promise(r => setTimeout(r, 1200));
    setIsProcessing(false);
    setProgresses([]);
    if (onClose) onClose();
  }, [onFilesUploaded, onClose]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    processFiles(Array.from(e.dataTransfer.files));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files));
    }
    e.target.value = '';
  };

  return (
    <div className="upload-sheet">
      <div className="upload-sheet-header">
        <h2 className="upload-title">Upload Files</h2>
        {onClose && (
          <button className="icon-btn-sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        )}
      </div>

      {progresses.length === 0 ? (
        <>
          {/* Drag and Drop Zone */}
          <div
            className={`drop-zone ${dragActive ? 'drop-zone--active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
            aria-label="Upload area - click or drag and drop files"
          >
            <div className="drop-zone-icon-wrap">
              <Upload size={36} className="drop-zone-icon" />
            </div>
            <p className="drop-zone-title">Tap to browse or drop files</p>
            <p className="drop-zone-subtitle">Images, audio, video, code, docs &amp; more</p>
            <p className="drop-zone-limit">Max 50 MB per file</p>
          </div>

          {/* Quick action pills */}
          <div className="upload-quick-actions">
            <button className="quick-action-btn" onClick={() => {
              if (inputRef.current) {
                inputRef.current.accept = 'image/*';
                inputRef.current.click();
              }
            }}>
              📷 Photos
            </button>
            <button className="quick-action-btn" onClick={() => {
              if (inputRef.current) {
                inputRef.current.accept = 'video/*';
                inputRef.current.click();
              }
            }}>
              🎬 Videos
            </button>
            <button className="quick-action-btn" onClick={() => {
              if (inputRef.current) {
                inputRef.current.accept = 'audio/*';
                inputRef.current.click();
              }
            }}>
              🎵 Audio
            </button>
            <button className="quick-action-btn" onClick={() => {
              if (inputRef.current) {
                inputRef.current.accept = '.pdf,.doc,.docx,.txt,.md';
                inputRef.current.click();
              }
            }}>
              📄 Docs
            </button>
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            accept="*/*"
            style={{ display: 'none' }}
            onChange={handleInputChange}
            aria-label="File input"
          />
        </>
      ) : (
        // Progress List
        <div className="progress-list">
          {progresses.map((p, i) => (
            <div key={i} className="progress-item">
              <div className="progress-item-header">
                <span className="progress-name" title={p.name}>{p.name}</span>
                {p.status === 'done' && <CheckCircle2 size={16} className="progress-icon success" />}
                {p.status === 'error' && <AlertCircle size={16} className="progress-icon error" />}
              </div>
              <div className="progress-bar-track">
                <div
                  className={`progress-bar-fill ${p.status === 'error' ? 'error' : ''} ${p.status === 'done' ? 'done' : ''}`}
                  style={{ width: `${p.progress}%` }}
                />
              </div>
              {p.error && <p className="progress-error">{p.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
