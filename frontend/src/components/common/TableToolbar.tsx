import React from 'react';
import { Search, X, Rows, List, LayoutGrid } from 'lucide-react';

interface TableToolbarProps {
  searchQuery?: string;
  searchValue?: string;
  onSearchChange: (q: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  totalCount?: number;
  filteredCount?: number;
  filters?: React.ReactNode;
  filterSlots?: React.ReactNode;
  actions?: React.ReactNode;
  onClearFilters?: () => void;
  isFiltered?: boolean;
  density?: 'compact' | 'comfortable';
  onDensityChange?: (d: 'compact' | 'comfortable') => void;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (m: 'list' | 'grid') => void;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  searchQuery,
  searchValue,
  onSearchChange,
  placeholder,
  searchPlaceholder,
  totalCount,
  filteredCount,
  filters,
  filterSlots,
  actions,
  onClearFilters,
  isFiltered = false,
  density,
  onDensityChange,
  viewMode,
  onViewModeChange,
}) => {
  const query = searchValue !== undefined ? searchValue : searchQuery || '';
  const holder = searchPlaceholder || placeholder || 'Search records...';
  const filterElements = filterSlots || filters;

  return (
    <div className="table-toolbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px', maxWidth: '380px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: '9px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            className="input-text"
            style={{ paddingLeft: '28px', paddingRight: query ? '28px' : '10px', height: '28px', fontSize: '0.75rem' }}
            placeholder={holder}
            value={query}
            onChange={e => onSearchChange(e.target.value)}
          />
          {query && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: 0,
              }}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Filter items & Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {filterElements}

        {isFiltered && onClearFilters && (
          <button
            type="button"
            className="btn btn-subtle btn-sm text-danger"
            onClick={onClearFilters}
            style={{ fontSize: '0.75rem' }}
          >
            Clear filters
          </button>
        )}

        {totalCount !== undefined && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 4px', whiteSpace: 'nowrap' }}>
            {filteredCount !== undefined && filteredCount !== totalCount
              ? `${filteredCount} of ${totalCount}`
              : `${totalCount} item${totalCount === 1 ? '' : 's'}`}
          </span>
        )}

        {/* View Mode Switcher (List vs Grid) */}
        {onViewModeChange && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)',
              padding: '1px',
            }}
          >
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              title="List view (dense comparison)"
              aria-label="List view"
              style={{
                background: viewMode === 'list' ? 'var(--surface)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                padding: '3px 6px',
                cursor: 'pointer',
                color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                boxShadow: viewMode === 'list' ? 'var(--shadow-xs)' : 'none',
                transition: 'var(--transition-fast)',
              }}
            >
              <List size={13} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              title="Grid view (cards)"
              aria-label="Grid view"
              style={{
                background: viewMode === 'grid' ? 'var(--surface)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                padding: '3px 6px',
                cursor: 'pointer',
                color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                boxShadow: viewMode === 'grid' ? 'var(--shadow-xs)' : 'none',
                transition: 'var(--transition-fast)',
              }}
            >
              <LayoutGrid size={13} />
            </button>
          </div>
        )}

        {/* Density Mode Switcher */}
        {onDensityChange && (!viewMode || viewMode === 'list') && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--surface-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xs)',
              padding: '1px',
            }}
          >
            <button
              type="button"
              onClick={() => onDensityChange('compact')}
              title="Compact density"
              aria-label="Compact density"
              style={{
                background: density === 'compact' ? 'var(--surface)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                padding: '2px 5px',
                cursor: 'pointer',
                color: density === 'compact' ? 'var(--text-primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0 2px' }}>Compact</span>
            </button>
            <button
              type="button"
              onClick={() => onDensityChange('comfortable')}
              title="Comfortable density"
              aria-label="Comfortable density"
              style={{
                background: density === 'comfortable' ? 'var(--surface)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                padding: '2px 5px',
                cursor: 'pointer',
                color: density === 'comfortable' ? 'var(--text-primary)' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '0 2px' }}>Comfortable</span>
            </button>
          </div>
        )}

        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
