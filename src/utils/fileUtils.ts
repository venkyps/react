import type { FileCategory, UploadedFile } from '../types/file';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFileCategory(file: { name: string; type: string }): FileCategory {
  const mime = file.type.toLowerCase();
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'avif', 'ico'].includes(ext)) {
    return 'image';
  }
  if (mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext)) {
    return 'audio';
  }
  if (mime === 'application/pdf' || ext === 'pdf') {
    return 'document';
  }
  if (['csv', 'tsv', 'xlsx', 'xls'].includes(ext) || mime.includes('csv') || mime.includes('spreadsheet')) {
    return 'spreadsheet';
  }
  if (
    ['json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'java', 'c', 'cpp', 'rs', 'go', 'php', 'sql', 'sh', 'md', 'xml', 'yaml', 'yml'].includes(ext) ||
    mime.includes('javascript') || mime.includes('json') || mime.includes('text/x-')
  ) {
    return 'code';
  }
  if (['doc', 'docx', 'txt', 'rtf', 'odt', 'pages', 'md'].includes(ext) || mime.startsWith('text/')) {
    return 'document';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext) || mime.includes('zip') || mime.includes('compressed')) {
    return 'archive';
  }
  return 'other';
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function parseCSV(text: string): string[][] {
  const lines = text.split(/\r\n|\n/);
  return lines
    .filter(line => line.trim().length > 0)
    .map(line => {
      // Basic CSV splitter with quote handling
      const result: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim());
      return result;
    });
}

export function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Generate high quality SVG sample images and canvases
export function generateSampleData(): UploadedFile[] {
  const now = new Date();

  // SVG Sample Art 1: Cyberpunk Sunset
  const sampleSvg1 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="%230f172a"/>
        <stop offset="50%" stop-color="%23581c87"/>
        <stop offset="100%" stop-color="%23be185d"/>
      </linearGradient>
      <linearGradient id="sun" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="%23fde047"/>
        <stop offset="100%" stop-color="%23f97316"/>
      </linearGradient>
      <linearGradient id="grid" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="%23ec4899" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="%233b82f6" stop-opacity="0.2"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(%23sky)"/>
    <circle cx="400" cy="320" r="140" fill="url(%23sun)"/>
    <rect x="0" y="320" width="800" height="280" fill="%23090d16"/>
    <path d="M0,320 L800,320 M0,360 L800,360 M0,410 L800,410 M0,470 L800,470 M0,540 L800,540" stroke="url(%23grid)" stroke-width="2"/>
    <path d="M400,320 L400,600 M400,320 L200,600 M400,320 L0,600 M400,320 L600,600 M400,320 L800,600 M400,320 L100,600 M400,320 L700,600" stroke="url(%23grid)" stroke-width="1.5"/>
    <text x="400" y="120" font-family="sans-serif" font-weight="900" font-size="42" fill="%23ffffff" text-anchor="middle" letter-spacing="4">NEON HORIZON</text>
  </svg>`;

  // SVG Sample Art 2: Mobile UI Wireframe Sample
  const sampleSvg2 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <rect width="600" height="600" rx="30" fill="%230f172a"/>
    <circle cx="300" cy="220" r="80" fill="%236366f1" opacity="0.3"/>
    <circle cx="300" cy="220" r="60" fill="%236366f1"/>
    <rect x="150" y="340" width="300" height="24" rx="12" fill="%23e0e7ff"/>
    <rect x="200" y="380" width="200" height="16" rx="8" fill="%2394a3b8"/>
    <rect x="180" y="440" width="240" height="48" rx="24" fill="%2310b981"/>
    <text x="300" y="470" font-family="sans-serif" font-weight="bold" font-size="18" fill="%23ffffff" text-anchor="middle">GET STARTED</text>
  </svg>`;

  // Audio sample Data (using web audio base64 or tone generator data URI)
  const audioSampleData = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

  const csvContent = `ID,Product,Category,Price,Stock,Rating
1,Wireless Headphones,Electronics,129.99,45,4.8
2,Ergonomic Chair,Furniture,289.00,12,4.6
3,Mechanical Keyboard,Electronics,95.50,88,4.9
4,Stainless Coffee Tumbler,Home,24.99,150,4.7
5,Organic Green Tea,Groceries,14.50,210,4.5
6,Noise Cancelling Earbuds,Electronics,179.00,34,4.7
7,UltraWide Monitor,Electronics,449.99,18,4.9`;

  const codeSample = `// React Mobile File Uploader Component
import React, { useState } from 'react';

export const MobileUploader = ({ onUpload }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div 
      className={\`drop-zone \${dragActive ? 'active' : ''}\`}
      onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <i className="upload-icon" />
      <p>Tap or drop files here to upload</p>
    </div>
  );
};`;

  const jsonSample = {
    app: "Mobile File Vault",
    version: "2.5.0",
    features: ["Instant Upload", "Multi-format Preview", "IndexedDB Storage", "Offline Mode", "Theme Sync"],
    analytics: {
      totalUploads: 142,
      activeUsers: 1250,
      storageUsedMB: 384.5
    },
    settings: {
      autoCompress: true,
      darkTheme: true,
      maxFileSizeBytes: 104857600
    }
  };

  return [
    {
      id: 'sample-1',
      name: 'Cyberpunk_Sunset_Art.svg',
      size: 485200,
      type: 'image/svg+xml',
      category: 'image',
      url: sampleSvg1,
      uploadDate: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
      favorite: true,
      tags: ['Personal', 'Project'] as any,
      dimensions: { width: 800, height: 600 }
    },
    {
      id: 'sample-2',
      name: 'Q3_Sales_Report.csv',
      size: 1840,
      type: 'text/csv',
      category: 'spreadsheet',
      url: `data:text/csv;base64,${btoa(csvContent)}`,
      uploadDate: new Date(now.getTime() - 1000 * 60 * 180).toISOString(),
      favorite: true,
      tags: ['Work', 'Important'] as any,
      textContent: csvContent,
      parsedCsv: parseCSV(csvContent)
    },
    {
      id: 'sample-3',
      name: 'MobileUploader.tsx',
      size: 3420,
      type: 'text/typescript',
      category: 'code',
      url: `data:text/plain;base64,${btoa(codeSample)}`,
      uploadDate: new Date(now.getTime() - 1000 * 60 * 600).toISOString(),
      favorite: false,
      tags: ['Project', 'Draft'] as any,
      textContent: codeSample
    },
    {
      id: 'sample-4',
      name: 'UI_Wireframe_Concept.png',
      size: 612000,
      type: 'image/png',
      category: 'image',
      url: sampleSvg2,
      uploadDate: new Date(now.getTime() - 1000 * 60 * 1400).toISOString(),
      favorite: false,
      tags: ['Personal'] as any,
      dimensions: { width: 600, height: 600 }
    },
    {
      id: 'sample-5',
      name: 'App_Config_Payload.json',
      size: 2150,
      type: 'application/json',
      category: 'code',
      url: `data:application/json;base64,${btoa(JSON.stringify(jsonSample, null, 2))}`,
      uploadDate: new Date(now.getTime() - 1000 * 60 * 2800).toISOString(),
      favorite: true,
      tags: ['Work'] as any,
      textContent: JSON.stringify(jsonSample, null, 2),
      jsonContent: jsonSample
    },
    {
      id: 'sample-6',
      name: 'Voice_Note_Sample.mp3',
      size: 1420000,
      type: 'audio/mp3',
      category: 'audio',
      url: audioSampleData,
      uploadDate: new Date(now.getTime() - 1000 * 60 * 4200).toISOString(),
      favorite: false,
      tags: ['Personal', 'Media'] as any,
      duration: 45
    }
  ];
}
