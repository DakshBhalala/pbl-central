import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface AppSelectOption<T = string | number> {
  value: T;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface AppSelectProps<T = string | number> {
  options: Array<AppSelectOption<T> | T>;
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md';
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  fullWidth?: boolean;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  triggerStyle?: React.CSSProperties;
  menuStyle?: React.CSSProperties;
  'aria-label'?: string;
  name?: string;
  id?: string;
}

export function AppSelect<T extends string | number = string | number>({
  options,
  value,
  defaultValue,
  onChange,
  placeholder = 'Select an option...',
  label,
  error,
  helperText,
  size = 'md',
  searchable,
  searchPlaceholder = 'Search options...',
  disabled = false,
  clearable = false,
  fullWidth = false,
  required = false,
  className = '',
  style,
  triggerStyle,
  menuStyle,
  'aria-label': ariaLabel,
  name,
  id,
}: AppSelectProps<T>) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options
  const normalizedOptions: AppSelectOption<T>[] = React.useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'object' && opt !== null && 'value' in opt) {
        return opt as AppSelectOption<T>;
      }
      return {
        value: opt as T,
        label: String(opt),
      };
    });
  }, [options]);

  const [isOpen, setIsOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<T | undefined>(
    value !== undefined ? value : defaultValue
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [openUpward, setOpenUpward] = useState(false);

  // Sync controlled value
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value);
    }
  }, [value]);

  const currentValue = value !== undefined ? value : internalValue;
  const selectedOption = normalizedOptions.find(opt => opt.value === currentValue);

  // Filter options if searchable
  const isSearchActive = searchable !== undefined ? searchable : normalizedOptions.length > 8;
  const filteredOptions = React.useMemo(() => {
    if (!isSearchActive || !searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase();
    return normalizedOptions.filter(
      opt =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery, isSearchActive]);

  // Smart upward/downward positioning check
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 240 && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }

      if (isSearchActive) {
        setTimeout(() => searchInputRef.current?.focus(), 40);
      }
    } else {
      setSearchQuery('');
      setFocusedIndex(-1);
    }
  }, [isOpen, isSearchActive]);

  // Click outside listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleSelect = (option: AppSelectOption<T>) => {
    if (option.disabled) return;
    if (value === undefined) {
      setInternalValue(option.value);
    }
    onChange?.(option.value);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (value === undefined) {
      setInternalValue(undefined);
    }
    onChange?.('' as unknown as T);
    triggerRef.current?.focus();
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
          return next;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
          return next;
        });
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(filteredOptions.length - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
          handleSelect(filteredOptions[focusedIndex]);
        } else if (filteredOptions.length === 1 && searchQuery) {
          handleSelect(filteredOptions[0]);
        }
        break;
    }
  };

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && menuRef.current) {
      const optionElements = menuRef.current.querySelectorAll('.app-select-option');
      const focusedElement = optionElements[focusedIndex] as HTMLElement;
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  return (
    <div
      ref={containerRef}
      className={`app-select-container ${fullWidth ? 'app-select-full-width' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        position: 'relative',
        width: fullWidth ? '100%' : 'auto',
        ...style,
      }}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label
          htmlFor={selectId}
          className="form-label"
          style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <span>{label}</span>
          {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}

      {name && (
        <input
          type="hidden"
          name={name}
          value={currentValue !== undefined ? String(currentValue) : ''}
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || label || placeholder}
        aria-invalid={!!error}
        onClick={() => setIsOpen(prev => !prev)}
        className={`app-select-trigger app-select-trigger-${size} ${isOpen ? 'app-select-open' : ''} ${
          error ? 'app-select-error' : ''
        } ${disabled ? 'app-select-disabled' : ''}`}
        style={triggerStyle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
          {selectedOption?.icon && (
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {selectedOption.icon}
            </span>
          )}
          <span
            className="app-select-value truncate"
            style={{
              color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: selectedOption ? 500 : 400,
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, marginLeft: '6px' }}>
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="app-select-clear"
              title="Clear selection"
            >
              <X size={12} />
            </span>
          )}
          <ChevronDown
            size={size === 'sm' ? 13 : 15}
            className="app-select-chevron"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s ease',
              color: 'var(--text-muted)',
            }}
          />
        </div>
      </button>

      {/* Floating Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label={ariaLabel || label || placeholder}
          className={`app-select-menu ${openUpward ? 'app-select-menu-upward' : ''}`}
          style={menuStyle}
        >
          {isSearchActive && (
            <div className="app-select-search-container">
              <Search size={13} className="app-select-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="app-select-search-input"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setFocusedIndex(0);
                }}
                onClick={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="app-select-search-clear"
                  onClick={e => {
                    e.stopPropagation();
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          <div className="app-select-options-list">
            {filteredOptions.length === 0 ? (
              <div className="app-select-empty">No options found</div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === currentValue;
                const isFocused = idx === focusedIndex;

                return (
                  <div
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={opt.disabled}
                    className={`app-select-option ${isSelected ? 'app-select-option-selected' : ''} ${
                      isFocused ? 'app-select-option-focused' : ''
                    } ${opt.disabled ? 'app-select-option-disabled' : ''}`}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      {opt.icon && (
                        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          {opt.icon}
                        </span>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span className="truncate" style={{ fontWeight: isSelected ? 600 : 400 }}>
                          {opt.label}
                        </span>
                        {opt.sublabel && (
                          <span
                            className="truncate"
                            style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}
                          >
                            {opt.sublabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check
                        size={14}
                        className="app-select-check"
                        style={{ color: 'var(--accent)', flexShrink: 0, marginLeft: '8px' }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <span className="form-error" style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--danger)' }}>{error}</span>}
      {helperText && !error && (
        <span className="form-helper" style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{helperText}</span>
      )}
    </div>
  );
}
