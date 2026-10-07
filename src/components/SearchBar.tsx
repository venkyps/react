import React from 'react';
import { Search, SlidersHorizontal, X, Star, Trash2 } from 'lucide-react';
import type { FilterState, FileCategory, FileTag } from '../types/file';

interface SearchBarProps {
  filterState: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  totalResults: number;
}

const CATEGORIES: { value: FileCategory | 'all'; label: string; emoji: string }[] = [
  { value: 'all',      label: 'All',  emoji: '📁' },
  { value: 'document', label: 'Docs', emoji: '📄' },
];

const TAGS: FileTag[] = ['Work', 'Personal', 'Important', 'Project', 'Draft', 'Media'];

export const SearchBar: React.FC<SearchBarProps> = ({ filterState, onChange, totalResults }) => {
  const [showFilters, setShowFilters] = React.useState(false);

  return (
    <div className="search-section">
      {/* Search Input */}
      <div className="search-input-wrap">
        <Search size={17} className="search-icon" />
        <input
          id="file-search-input"
          type="text"
          value={filterState.searchQuery}
          onChange={e => onChange({ searchQuery: e.target.value })}
          placeholder="Search files..."
          className="search-input"
          aria-label="Search files"
        />
        {filterState.searchQuery && (
          <button className="search-clear-btn" onClick={() => onChange({ searchQuery: '' })} aria-label="Clear search">
            <X size={15} />
          </button>
        )}
        <button
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(v => !v)}
          aria-label="Toggle filters"
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {/* Category Pills */}
      <div className="category-pills-scroll" role="tablist" aria-label="Filter by category">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            role="tab"
            aria-selected={filterState.category === cat.value}
            className={`category-pill ${filterState.category === cat.value ? 'active' : ''}`}
            onClick={() => onChange({ category: cat.value })}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="advanced-filters-panel glass-panel">
          <div className="filters-row">
            {/* Favorites Toggle */}
            <button
              className={`filter-chip ${filterState.favoritesOnly ? 'active' : ''}`}
              onClick={() => onChange({ favoritesOnly: !filterState.favoritesOnly })}
            >
              <Star size={13} fill={filterState.favoritesOnly ? 'currentColor' : 'none'} />
              Favorites
            </button>

            {/* Trash Toggle */}
            <button
              className={`filter-chip ${filterState.inTrash ? 'active' : ''}`}
              onClick={() => onChange({ inTrash: !filterState.inTrash })}
            >
              <Trash2 size={13} />
              Trash
            </button>
          </div>

          {/* Sort Controls */}
          <div className="filters-row sort-row">
            <label className="sort-label">Sort by</label>
            <select
              className="sort-select"
              value={filterState.sortBy}
              onChange={e => onChange({ sortBy: e.target.value as any })}
              aria-label="Sort by"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="type">Type</option>
            </select>
            <button
              className="sort-order-btn"
              onClick={() => onChange({ sortOrder: filterState.sortOrder === 'asc' ? 'desc' : 'asc' })}
              aria-label="Toggle sort order"
            >
              {filterState.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>

          {/* Tags */}
          <div className="filters-row">
            <label className="sort-label">Tags</label>
            <div className="filter-tags-row">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  className={`filter-chip small ${filterState.tag === tag ? 'active' : ''}`}
                  onClick={() => onChange({ tag: filterState.tag === tag ? 'all' : tag })}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="results-count">
        {totalResults === 0
          ? 'No files found'
          : `${totalResults} file${totalResults !== 1 ? 's' : ''}`}
      </div>
    </div>
  );
};
