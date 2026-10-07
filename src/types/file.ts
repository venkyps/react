export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'code' | 'spreadsheet' | 'archive' | 'other';

export type FileTag = 'Work' | 'Personal' | 'Important' | 'Project' | 'Draft' | 'Media';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  category: FileCategory;
  url: string; // Data URL or Blob URL
  uploadDate: string; // ISO string
  lastModified?: number;
  favorite: boolean;
  tags: FileTag[];
  inTrash?: boolean;
  
  // Specific metadata
  dimensions?: { width: number; height: number }; // for images & video
  duration?: number; // for video & audio in seconds
  pageCount?: number; // for documents
  textContent?: string; // for text/code/csv/json
  parsedCsv?: string[][]; // for csv tabular view
  jsonContent?: any; // for json preview

  // Receipt extraction
  isReceipt?: boolean;
  extractedAmount?: string | null;
}

export type ViewMode = 'grid' | 'list';

export type SortField = 'date' | 'name' | 'size' | 'type';
export type SortOrder = 'asc' | 'desc';

export interface FilterState {
  searchQuery: string;
  category: FileCategory | 'all';
  tag: FileTag | 'all';
  favoritesOnly: boolean;
  inTrash: boolean;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface StorageStats {
  usedBytes: number;
  totalBytes: number;
  fileCount: number;
  categoryBytes: Record<FileCategory, number>;
  categoryCounts: Record<FileCategory, number>;
}
