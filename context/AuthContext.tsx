import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  gasUrl: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setGasUrl: (url: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gasUrl, setGasUrlState] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [storedUser, storedUrl] = await Promise.all([
          AsyncStorage.getItem('auth_user'),
          AsyncStorage.getItem('gas_url'),
        ]);
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedUrl) setGasUrlState(storedUrl);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const url = await AsyncStorage.getItem('gas_url');
    if (!url) throw new Error('يرجى إعداد رابط النظام أولاً في الإعدادات');
    // Send credentials in POST body — never in URL query params
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'validateUser', email, password }),
    });
    if (!res.ok) throw new Error('فشل الاتصال بالخادم');
    const data = await res.json();
    if (!data.success) throw new Error(data.error ?? 'بيانات الدخول غير صحيحة');
    const authUser: AuthUser = data.user;
    setUser(authUser);
    await AsyncStorage.setItem('auth_user', JSON.stringify(authUser));
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem('auth_user');
  }, []);

  const setGasUrl = useCallback(async (url: string) => {
    const trimmed = url.trim();
    setGasUrlState(trimmed);
    await AsyncStorage.setItem('gas_url', trimmed);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, gasUrl, login, logout, setGasUrl }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
