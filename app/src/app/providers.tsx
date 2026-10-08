'use client';

import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { SportProvider, useSport } from '@/lib/sport-context';

function SportBackgroundWrapper({ children }: { children: React.ReactNode }) {
  const { activeSport } = useSport();

  return (
    <div 
      className="relative min-h-full flex flex-col flex-1"
      data-active-sport={activeSport}
      style={{ backgroundColor: 'var(--bg-primary)', transition: 'background-color 0.4s ease' }}
    >
      {children}
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SportProvider>
          <SportBackgroundWrapper>
            {children}
          </SportBackgroundWrapper>
        </SportProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
