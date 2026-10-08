'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSport, SportType } from '@/lib/sport-context';

export default function SportSelector({ style }: { style?: React.CSSProperties }) {
  const { activeSport, setActiveSport } = useSport();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const sports: { value: SportType; label: string; icon: string }[] = [
    { value: 'all', label: 'All Sports', icon: '🌍' },
    { value: 'badminton', label: 'Badminton', icon: '🏸' },
    { value: 'table_tennis', label: 'Table Tennis', icon: '🏓' },
    { value: 'squash', label: 'Squash', icon: '🎾' },
    { value: 'tennis', label: 'Tennis', icon: '🥎' },
    { value: 'volleyball', label: 'Volleyball', icon: '🏐' },
    { value: 'cricket', label: 'Cricket', icon: '🏏' },
    { value: 'basketball', label: 'Basketball', icon: '🏀' },
  ];

  const activeOption = sports.find((s) => s.value === activeSport) || sports[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="sport-select-container" style={style}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="sport-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{activeOption.icon}</span>
        <span>{activeOption.label}</span>
        <span style={{ 
          fontSize: '9px', 
          opacity: 0.7, 
          transform: isOpen ? 'rotate(180deg)' : 'none', 
          transition: 'transform 0.2s',
          marginLeft: '4px'
        }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="sport-select-dropdown" role="listbox">
          {sports.map((sport) => (
            <button
              key={sport.value}
              onClick={() => {
                setActiveSport(sport.value);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={activeSport === sport.value}
              className={`sport-select-option ${activeSport === sport.value ? 'active' : ''}`}
            >
              <span>{sport.icon}</span>
              <span>{sport.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
