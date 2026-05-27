'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { mockUsers } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  activeRole: UserRole | null;
  isLoading: boolean;
  needsRoleSelection: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  selectRole: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('matchpoint_token', data.token);

        const mappedUser: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.roles[0],
          roles: data.user.roles,
          created_at: new Date().toISOString()
        };

        setUser(mappedUser);
        if (mappedUser.roles.length === 1) {
          setActiveRole(mappedUser.roles[0]);
          setNeedsRoleSelection(false);
        } else {
          setNeedsRoleSelection(true);
          setActiveRole(null);
        }
        setIsLoading(false);
        return true;
      }
    } catch (err) {
      console.warn('REST API login failed, falling back to mock:', err);
    }

    // Mock Fallback
    await new Promise(r => setTimeout(r, 800));

    const found = mockUsers.find(u => u.email === email);
    if (found) {
      setUser(found);
      if (found.roles.length === 1) {
        // Single role — auto-select
        setActiveRole(found.roles[0]);
        setNeedsRoleSelection(false);
      } else {
        // Multiple roles — show picker
        setNeedsRoleSelection(true);
        setActiveRole(null);
      }
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:8080/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, roles: [role] })
      });

      if (res.ok) {
        setIsLoading(false);
        return login(email, password);
      }
    } catch (err) {
      console.warn('REST API registration failed, falling back to mock:', err);
    }

    // Mock Fallback
    await new Promise(r => setTimeout(r, 800));

    const newUser: User = {
      id: `u${Date.now()}`,
      email,
      name,
      role,
      roles: [role],
      created_at: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    setUser(newUser);
    setActiveRole(role);
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
      login,
      register,
      logout,
      selectRole,
      switchRole,
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
