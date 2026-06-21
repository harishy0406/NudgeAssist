'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from './api';
import { supabase } from './supabase';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'agent' | 'manager';
  department?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    department?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from localStorage and Supabase
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setToken(session.access_token);
        localStorage.setItem('nudge_token', session.access_token);
        try {
          const res = await authAPI.getMe();
          const p = res.data;
          setUser({
            id: p.id,
            name: p.name,
            email: session.user.email || '',
            role: p.role,
            department: p.department
          });
          localStorage.setItem('nudge_user', JSON.stringify(p));
        } catch (e) {
          console.error("Failed to fetch profile info", e);
          localStorage.removeItem('nudge_token');
          localStorage.removeItem('nudge_user');
          await supabase.auth.signOut();
          setToken(null);
          setUser(null);
        }
      } else {
        localStorage.removeItem('nudge_token');
        localStorage.removeItem('nudge_user');
      }
      setLoading(false);
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setToken(null);
        setUser(null);
        localStorage.removeItem('nudge_token');
        localStorage.removeItem('nudge_user');
      } else if (session) {
        setToken(session.access_token);
        localStorage.setItem('nudge_token', session.access_token);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    
    if (data.session) {
      setToken(data.session.access_token);
      localStorage.setItem('nudge_token', data.session.access_token);
      
      const res = await authAPI.getMe();
      const p = res.data;
      const userData: User = {
        id: p.id,
        name: p.name,
        email: email,
        role: p.role,
        department: p.department,
      };
      setUser(userData);
      localStorage.setItem('nudge_user', JSON.stringify(userData));
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    department?: string;
  }) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (error) throw new Error(error.message);

    if (authData.session) {
      setToken(authData.session.access_token);
      localStorage.setItem('nudge_token', authData.session.access_token);

      // Bootstrap profile
      await authAPI.bootstrap({
        name: data.name,
        role: data.role,
        department: data.department
      });

      const userData: User = {
        id: authData.user!.id,
        name: data.name,
        email: data.email,
        role: data.role as User['role'],
        department: data.department,
      };
      setUser(userData);
      localStorage.setItem('nudge_user', JSON.stringify(userData));
    } else {
      // Sometimes email confirmation is required, handle later.
      throw new Error("Registration succeeded, but requires email confirmation.");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
