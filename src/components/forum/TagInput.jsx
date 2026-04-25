import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Tag input with pill display and comma/Enter submission.
 */
export default function TagInput({ value = [], onChange, placeholder = 'Add tags (e.g. wedding, kl, 100pax)…', suggestedTags = [] }) {
  const [inputVal, setInputVal] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)

  const filtered = suggestedTags
    .filter(t => t.toLowerCase().includes(inputVal.toLowerCase()) && !value.includes(t))
    .slice(0, 6)

  const addTag = (tag) => {
    const clean = tag.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(0, 30)
    if (!clean || value.includes(clean) || value.length >= 10) return
    onChange([...value, clean])
    setInputVal('')
  }

  const removeTag = (tag) => onChange(value.filter(t => t !== tag))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputVal)
    } else if (e.key === 'Backspace' && !inputVal && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div>
      <div
        className="tag-input-container"
        onClick={() => inputRef.current?.focus()}
        id="tag-input-wrapper"
      >
        {value.map(tag => (
          <span key={tag} className="tag-pill">
            #{tag}
            <button
              type="button"
              className="tag-pill-remove"
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              aria-label={`Remove ${tag}`}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="tag-input"
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setShowSuggestions(true) }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={value.length === 0 ? placeholder : ''}
          maxLength={32}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && inputVal && filtered.length > 0 && (
        <div style={{
          background: 'white', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-md)',
          padding: 'var(--s-2)', marginTop: 4, display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap',
        }}>
          {filtered.map(t => (
            <button
              key={t}
              type="button"
              className="post-tag"
              onClick={() => addTag(t)}
              style={{ cursor: 'pointer' }}
            >
              #{t}
            </button>
          ))}
        </div>
      )}

      <p className="hint-text" style={{ marginTop: 4 }}>
        Press <strong>Enter</strong> or <strong>comma</strong> to add · max 10 tags
      </p>
    </div>
  )
}
