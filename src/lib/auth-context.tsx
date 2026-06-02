'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/lib/mock-data';
import { isSupabaseConfigured } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface AuthContextType {
  user: User | null;
  activeRole: UserRole | null;
  isLoading: boolean;
  needsRoleSelection: boolean;
  isProfileComplete: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  selectRole: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function mapProfileToUser(data: any): User {
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    phone: data.phone,
    age: data.age,
    gender: data.gender,
    date_of_birth: data.dateOfBirth || data.date_of_birth || undefined,
    role: data.roles && data.roles.includes('admin') ? 'admin' : (data.roles && data.roles.includes('umpire') ? 'umpire' : 'player'),
    roles: data.roles || ['player'],
    created_at: data.createdAt || data.created_at || new Date().toISOString()
  };
}

function checkProfileComplete(u: User | null): boolean {
  if (!u) return false;
  return !!(u.date_of_birth && u.phone && u.gender);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('matchpoint_token');
    }
    return false;
  });
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  const isProfileComplete = checkProfileComplete(user);

  const handleUserRoles = (mappedUser: User) => {
    setUser(mappedUser);
    if (mappedUser.roles.length === 1) {
      setActiveRole(mappedUser.roles[0]);
      setNeedsRoleSelection(false);
    } else {
      setNeedsRoleSelection(true);
      setActiveRole(null);
    }
  };

  // Refresh profile from server (used after profile save)
  const refreshProfile = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('matchpoint_token') : null;
    if (!token || !user) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/profiles/${user.id}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'bypass-tunnel-reminder': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const mappedUser = mapProfileToUser(data);
        setUser(mappedUser);
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  }, [user]);

  React.useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('matchpoint_token') : null;
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.userId) {
        setIsLoading(true);
        fetch(`${API_BASE_URL}/api/v1/profiles/${decoded.userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'bypass-tunnel-reminder': 'true'
          }
        })
          .then(res => {
            if (res.ok) return res.json();
            throw new Error('Failed to load profile');
          })
          .then(data => {
            const mappedUser = mapProfileToUser(data);
            handleUserRoles(mappedUser);
          })
          .catch(err => {
            console.error('Session restoration failed:', err);
            localStorage.removeItem('matchpoint_token');
            setUser(null);
            setActiveRole(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('matchpoint_token', data.token);

        // Fetch full profile details to get age, gender, phone, date_of_birth, etc.
        const profileRes = await fetch(`${API_BASE_URL}/api/v1/profiles/${data.user.id}`, {
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'bypass-tunnel-reminder': 'true'
          }
        });

        let fullProfile = data.user;
        if (profileRes.ok) {
          fullProfile = await profileRes.json();
        }

        const mappedUser = mapProfileToUser(fullProfile);
        handleUserRoles(mappedUser);
        setIsLoading(false);
        return true;
      } else {
        if (isSupabaseConfigured) {
          setIsLoading(false);
          return false;
        }
      }
    } catch (err) {
      console.warn('REST API login failed:', err);
      if (isSupabaseConfigured) {
        setIsLoading(false);
        return false;
      }
    }

    // Mock Fallback
    await new Promise(r => setTimeout(r, 800));

    const found = mockUsers.find(u => u.email === email);
    if (found) {
      handleUserRoles(found);
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'bypass-tunnel-reminder': 'true'
        },
        body: JSON.stringify({ name, email, password })
      });

      if (res.ok) {
        setIsLoading(false);
        return login(email, password);
      } else {
        if (isSupabaseConfigured) {
          setIsLoading(false);
          return false;
        }
      }
    } catch (err) {
      console.warn('REST API registration failed:', err);
      if (isSupabaseConfigured) {
        setIsLoading(false);
        return false;
      }
    }

    // Mock Fallback
    await new Promise(r => setTimeout(r, 800));

    const newUser: User = {
      id: `u${Date.now()}`,
      email,
      name,
      role: 'player',
      roles: ['player'],
      created_at: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    setUser(newUser);
    setActiveRole('player');
    setNeedsRoleSelection(false);
    setIsLoading(false);
    return true;
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('matchpoint_token');
    setUser(null);
    setActiveRole(null);
    setNeedsRoleSelection(false);
  }, []);

  const selectRole = useCallback((role: UserRole) => {
    if (user && user.roles.includes(role)) {
      setActiveRole(role);
      setNeedsRoleSelection(false);
    }
  }, [user]);

  const switchRole = useCallback((role: UserRole) => {
    if (user && user.roles.includes(role)) {
      setActiveRole(role);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      activeRole,
      isLoading,
      needsRoleSelection,
      isProfileComplete,
      login,
      register,
      logout,
      selectRole,
      switchRole,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
