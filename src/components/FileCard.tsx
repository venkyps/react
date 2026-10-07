import React from 'react';
import { Heart, Trash2, Download } from 'lucide-react';
import type { UploadedFile } from '../types/file';
import { formatBytes, formatDate } from '../utils/fileUtils';

interface FileCardProps {
  file: UploadedFile;
  viewMode: 'grid' | 'list';
  onOpen: (file: UploadedFile) => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  image:    { bg: 'rgba(99,102,241,0.18)',  text: '#818cf8' },
  document: { bg: 'rgba(245,158,11,0.18)', text: '#fbbf24' },
  other:    { bg: 'rgba(100,116,139,0.18)', text: '#94a3b8' },
};

const categoryEmoji: Record<string, string> = {
  image:    '🖼️',
  document: '📄',
  other:    '📦',
};

export const FileCard: React.FC<FileCardProps> = ({
  file, viewMode, onOpen, onToggleFavorite, onDelete,
}) => {
  const colors = categoryColors[file.category] || categoryColors.other;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.name;
    a.click();
  };

  if (viewMode === 'list') {
    return (
      <div className="file-list-item" onClick={() => onOpen(file)}>
        {/* Thumbnail / Icon */}
        <div className="file-list-thumb" style={{ background: colors.bg }}>
          {file.category === 'image' && file.url ? (
            <img src={file.url} alt={file.name} className="file-list-img" />
          ) : (
            <span className="file-list-emoji">{categoryEmoji[file.category] ?? '📦'}</span>
          )}
        </div>

        {/* Info */}
        <div className="file-list-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p className="file-list-name" title={file.name}>
              {file.name.length > 25 ? `${file.name.slice(0, 22)}…` : file.name}
            </p>
            {file.extractedAmount && (
              <span className="file-extracted-amount-badge">
                ${file.extractedAmount}
              </span>
            )}
          </div>
          <p className="file-list-meta">
            {formatBytes(file.size)} · {formatDate(file.uploadDate)}
          </p>
          {file.tags.length > 0 && (
            <div className="file-list-tags">
              {file.tags.slice(0, 2).map(tag => (
                <span key={tag} className="file-tag-chip">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="file-list-actions" onClick={e => e.stopPropagation()}>
          <button
            className={`icon-btn-sm ${file.favorite ? 'active-fav' : ''}`}
            onClick={() => onToggleFavorite(file.id)}
            aria-label="Toggle favorite"
          >
            <Heart size={16} fill={file.favorite ? 'currentColor' : 'none'} />
          </button>
          <button className="icon-btn-sm" onClick={() => onDelete(file.id)} aria-label="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    );
  }

  // Grid mode
  return (
    <div className="file-card" onClick={() => onOpen(file)}>
      {/* Thumbnail */}
      <div className="file-card-thumb" style={{ background: colors.bg }}>
        {file.category === 'image' && file.url ? (
          <img src={file.url} alt={file.name} className="file-card-img" />
        ) : (
          <div className="file-card-icon">
            <span>{categoryEmoji[file.category] ?? '📦'}</span>
          </div>
        )}

        {/* Favorite Badge */}
        {file.favorite && (
          <div className="file-card-fav-badge">
            <Heart size={12} fill="currentColor" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="file-card-overlay">
          <button
            className="overlay-btn"
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(file.id); }}
            aria-label="Toggle favorite"
          >
            <Heart size={15} fill={file.favorite ? 'currentColor' : 'none'} />
          </button>
          <button
            className="overlay-btn"
            onClick={handleDownload}
            aria-label="Download"
          >
            <Download size={15} />
          </button>
          <button
            className="overlay-btn danger-overlay"
            onClick={(e) => { e.stopPropagation(); onDelete(file.id); }}
            aria-label="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="file-card-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <p className="file-card-name" title={file.name}>
            {file.name.length > 18 ? `${file.name.slice(0, 15)}…${file.name.slice(file.name.lastIndexOf('.'))}` : file.name}
          </p>
          {file.extractedAmount && (
            <span className="file-extracted-amount-badge small">
              ${file.extractedAmount}
            </span>
          )}
        </div>
        <div className="file-card-meta-row">
          <span className="file-size-badge" style={{ background: colors.bg, color: colors.text }}>
            {file.category}
          </span>
          <span className="file-card-size">{formatBytes(file.size)}</span>
        </div>
        {file.tags.length > 0 && (
          <div className="file-card-tags">
            {file.tags.slice(0, 2).map(tag => (
              <span key={tag} className="file-tag-chip small">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

