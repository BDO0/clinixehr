import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { COMMON_ICD10_CODES } from '../data/icd10';

export default function Icd10Autocomplete({ value, onChange, onSelect }) {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update internal state if value prop changes externally (e.g. form reset)
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onChange) onChange(val); // Sync with parent form

    if (!val.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const lowerTerm = val.toLowerCase();
    const matched = COMMON_ICD10_CODES.filter(item => 
      item.code.toLowerCase().includes(lowerTerm) || 
      item.desc.toLowerCase().includes(lowerTerm)
    ).slice(0, 10); // Show top 10 matches

    setResults(matched);
    setShowDropdown(true);
  };

  const handleSelect = (item) => {
    const formattedVal = `[${item.code}] ${item.desc}`;
    setSearchTerm(formattedVal);
    if (onChange) onChange(formattedVal);
    if (onSelect) onSelect(item);
    setShowDropdown(false);
  };

  return (
    <div className="form-group" style={{ position: 'relative', overflow: 'visible' }} ref={wrapperRef}>
      <label className="input-label">Assessment / Diagnosis (ICD-10) *</label>
      <div style={{ position: 'relative' }}>
        <input
          className="input-field"
          value={searchTerm}
          onChange={handleTextChange}
          onFocus={() => { if (searchTerm.trim() && results.length > 0) setShowDropdown(true); }}
          placeholder="Search by diagnosis or code (e.g., Hypertension or I10)..."
          style={{ paddingRight: '2.5rem' }}
        />
        <Search 
          size={18} 
          color="var(--color-text-muted)" 
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} 
        />
      </div>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'rgba(255, 250, 240, 0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          marginTop: '6px',
          boxShadow: '0 8px 32px rgba(90, 60, 11, 0.15)',
          maxHeight: '250px',
          overflowY: 'auto'
        }}>
          {results.length > 0 ? (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {results.map(item => (
                <li 
                  key={item.code}
                  className="autocomplete-item"
                  style={{ borderBottom: '1px solid rgba(196, 139, 40, 0.05)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}
                  onClick={() => handleSelect(item)}
                >
                  <div style={{ fontWeight: 800, color: 'var(--color-amber-dark)', fontSize: '0.85rem', minWidth: '50px' }}>
                    {item.code}
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>
                    {item.desc}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
             <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-amber)', fontSize: '0.85rem' }}>
              No common ICD-10 codes found. You can still type a custom diagnosis.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
