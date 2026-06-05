import { useState, useEffect, useRef } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function PatientAutocomplete({ value, onChange, onSelect }) {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

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

  const fetchPatients = async (term) => {
    if (!term.trim()) {
      setResults([]);
      setShowDropdown(false);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      // Query collection and filter client-side for robust partial matching
      const q = query(collection(db, 'patients'));
      const snap = await getDocs(q);
      const allPatients = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(p => p.deleted !== true);
      
      const lowerTerm = term.toLowerCase();
      const matched = allPatients.filter(p => {
        const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
        return fullName.includes(lowerTerm);
      }).slice(0, 5); // Return top 5 matches
      
      setResults(matched);
      setShowDropdown(true);
    } catch (e) {
      console.error('Failed to search patients:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPatients(searchTerm);
    }, 300); // 300ms debounce
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onChange) onChange(val);
  };

  const handleSelect = (patient) => {
    const fullName = `${patient.firstName} ${patient.lastName}`;
    setSearchTerm(fullName);
    if (onChange) onChange(fullName);
    setShowDropdown(false);
    onSelect(patient.id, fullName);
  };

  return (
    <div className="form-group" style={{ position: 'relative', overflow: 'visible' }} ref={wrapperRef}>
      <label className="input-label">Patient Name *</label>
      <div style={{ position: 'relative' }}>
        <input
          className="input-field"
          value={searchTerm}
          onChange={handleTextChange}
          onFocus={() => { if (searchTerm.trim()) setShowDropdown(true); }}
          placeholder="Search patient..."
          style={{ paddingRight: '2.5rem' }}
        />
        <Search 
          size={18} 
          color="var(--color-text-muted)" 
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} 
        />
      </div>

      {showDropdown && hasSearched && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'rgba(255, 250, 240, 0.95)', // Milky white (surface color)
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-sm)',
          marginTop: '6px',
          boxShadow: '0 8px 32px rgba(90, 60, 11, 0.15)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ padding: '1rem', color: 'var(--color-amber)', fontSize: '0.85rem', textAlign: 'center' }}>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {results.map(patient => (
                <li 
                  key={patient.id}
                  className="autocomplete-item"
                  style={{ borderBottom: '1px solid rgba(196, 139, 40, 0.05)' }}
                  onClick={() => handleSelect(patient)}
                >
                  <div style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '0.95rem' }}>
                    {patient.firstName} {patient.lastName}
                  </div>
                  <div style={{ color: 'var(--color-text-sub)', fontSize: '0.75rem', marginTop: 2 }}>
                    {patient.phone ? `Phone: ${patient.phone}` : patient.dateOfBirth ? `DOB: ${patient.dateOfBirth}` : 'No extra details'}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: '1.2rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--color-amber)', fontSize: '0.9rem', marginBottom: '8px' }}>
                No patient found.
              </div>
              <button 
                type="button"
                className="btn-ghost" 
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                onClick={() => navigate('/patients')}
              >
                Register a new patient?
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
