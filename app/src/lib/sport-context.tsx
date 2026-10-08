'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type SportType = 'all' | 'badminton' | 'table_tennis' | 'squash' | 'tennis' | 'volleyball' | 'cricket' | 'basketball';

interface SportContextType {
  activeSport: SportType;
  setActiveSport: (sport: SportType) => void;
}

const SportContext = createContext<SportContextType | undefined>(undefined);

export function SportProvider({ children }: { children: ReactNode }) {
  const [activeSport, setActiveSportState] = useState<SportType>('all');

  // Safely read from localStorage on mount (hydration safe)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('matchpoint-sport') as SportType | null;
      const validSports: SportType[] = ['all', 'badminton', 'table_tennis', 'squash', 'tennis', 'volleyball', 'cricket', 'basketball'];
      if (saved && validSports.includes(saved)) {
        setActiveSportState(saved);
      }
    } catch (e) {
      console.warn('Failed to load active sport preference:', e);
    }
  }, []);

  const setActiveSport = useCallback((sport: SportType) => {
    setActiveSportState(sport);
    try {
      localStorage.setItem('matchpoint-sport', sport);
    } catch (e) {
      console.warn('Failed to save active sport preference:', e);
    }
  }, []);

  return (
    <SportContext.Provider value={{ activeSport, setActiveSport }}>
      {children}
    </SportContext.Provider>
  );
}

export function useSport(): SportContextType {
  const ctx = useContext(SportContext);
  if (!ctx) throw new Error('useSport must be used within SportProvider');
  return ctx;
}
