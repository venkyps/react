import React from 'react';
import { HardDrive } from 'lucide-react';
import type { StorageStats } from '../types/file';
import { formatBytes } from '../utils/fileUtils';

interface StorageBarProps {
  stats: StorageStats;
}

const SEGMENT_COLORS: Record<string, string> = {
  image:       '#6366f1',
  video:       '#ec4899',
  audio:       '#10b981',
  document:    '#f59e0b',
  code:        '#06b6d4',
  spreadsheet: '#84cc16',
  archive:     '#8b5cf6',
  other:       '#64748b',
};

export const StorageBar: React.FC<StorageBarProps> = ({ stats }) => {
  const totalBytes = Math.max(stats.usedBytes, 1);
  const cappedTotal = Math.max(stats.totalBytes, totalBytes);
  const usagePercent = Math.min((totalBytes / cappedTotal) * 100, 100);

  // Sort categories by usage
  const segmentData = (Object.entries(stats.categoryBytes) as [string, number][])
    .filter(([, bytes]) => bytes > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="storage-bar-container glass-panel">
      {/* Header */}
      <div className="storage-bar-header">
        <div className="storage-bar-title">
          <HardDrive size={15} className="storage-icon" />
          <span>Storage</span>
        </div>
        <span className="storage-used-text">
          {formatBytes(stats.usedBytes)} / {formatBytes(cappedTotal)}
        </span>
      </div>

      {/* Visual bar */}
      <div className="storage-bar-track" role="progressbar" aria-valuenow={usagePercent} aria-valuemin={0} aria-valuemax={100}>
        {segmentData.map(([cat, bytes]) => (
          <div
            key={cat}
            className="storage-bar-segment"
            style={{
              width: `${(bytes / cappedTotal) * 100}%`,
              background: SEGMENT_COLORS[cat] || SEGMENT_COLORS.other,
            }}
            title={`${cat}: ${formatBytes(bytes)}`}
          />
        ))}
      </div>

      {/* Legend */}
      {segmentData.length > 0 && (
        <div className="storage-legend">
          {segmentData.slice(0, 4).map(([cat, bytes]) => (
            <div key={cat} className="storage-legend-item">
              <span
                className="storage-legend-dot"
                style={{ background: SEGMENT_COLORS[cat] || SEGMENT_COLORS.other }}
              />
              <span className="storage-legend-cat">{cat}</span>
              <span className="storage-legend-size">{formatBytes(bytes)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
