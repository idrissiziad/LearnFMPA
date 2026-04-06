'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  must_change_password: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>;
  logout: () => void;
  changePassword: (email: string, currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  syncProgress: (moduleId: number, questionId: string, isCorrect: boolean) => Promise<void>;
  getProgress: (moduleId: number) => Promise<{ [key: string]: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = '/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored session on mount
    const storedUser = localStorage.getItem('learnfmpa_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch {
        localStorage.removeItem('learnfmpa_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      const userInfo = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        must_change_password: data.user.must_change_password
      };

      setUser(userInfo);
      localStorage.setItem('learnfmpa_user', JSON.stringify(userInfo));
      localStorage.setItem('learnfmpa_token', data.user.token);

      return { 
        success: true, 
        mustChangePassword: data.user.must_change_password 
      };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('learnfmpa_user');
    localStorage.removeItem('learnfmpa_token');
    // Clear progress cache
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('learnfmpa_answered_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    router.push('/login');
  };

  const changePassword = async (email: string, currentPassword: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, current_password: currentPassword, new_password: newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to change password' };
      }

      // Update user state
      if (user) {
        const updatedUser = { ...user, must_change_password: false };
        setUser(updatedUser);
        localStorage.setItem('learnfmpa_user', JSON.stringify(updatedUser));
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const syncProgress = async (moduleId: number, questionId: string, isCorrect: boolean) => {
    if (!user) return;

    try {
      await fetch(`${API_BASE}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          module_id: moduleId,
          question_id: questionId,
          is_correct: isCorrect
        })
      });
    } catch (error) {
      console.error('Failed to sync progress:', error);
    }
  };

  const getProgress = async (moduleId: number) => {
    if (!user) return {};

    try {
      const response = await fetch(`${API_BASE}/progress?user_id=${user.id}`);
      const data = await response.json();
      
      if (data.success && data.progress) {
        return data.progress[`module_${moduleId}`] || {};
      }
      return {};
    } catch (error) {
      console.error('Failed to get progress:', error);
      return {};
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      logout, 
      changePassword,
      syncProgress,
      getProgress 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
