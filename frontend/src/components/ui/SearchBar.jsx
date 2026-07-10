import React from 'react'

/**
 * SearchBar — standalone search input with icon and keyboard shortcut hint
 */
const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search…',
  shortcut,       // e.g. '⌘K'
  onClear,
  className = '',
  size = 'md',    // sm | md
  ...props
}) => {
  const height = size === 'sm' ? 36 : 40

  return (
    <div className={`nc-search ${className}`}>
      <i className="nc-search-icon ri-search-line" style={{ fontSize: 16 }} />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="nc-search-input"
        style={{ height }}
        aria-label={placeholder}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: 'var(--nc-text-muted)' }}
          aria-label="Clear search"
        >
          <i className="ri-close-circle-line text-[16px]" />
        </button>
      )}
      {!value && shortcut && (
        <kbd
          className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[11px] font-[600]"
          style={{
            background: 'rgba(255,255,255,0.06)',
            color: 'var(--nc-text-muted)',
            border: '1px solid var(--nc-border)',
          }}
        >
          {shortcut}
        </kbd>
      )}
    </div>
  )
}

export default SearchBar
