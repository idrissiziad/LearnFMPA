'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  must_change_password: boolean;
  year: string;
}

interface QuestionStats {
  total_answers: number;
  correct_answers: number;
  option_counts: { [optionIndex: string]: number };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>;
  logout: () => void;
  changePassword: (email: string, currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  submitAnswer: (moduleId: number, questionId: string, isCorrect: boolean, selectedOptions: number[]) => void;
  getProgress: (moduleId: number) => Promise<{ [key: string]: any }>;
  getAllProgress: () => Promise<{ [key: string]: any }>;
  getQuestionStats: (moduleId: number, questionId: string) => Promise<QuestionStats | null>;
  invalidateProgressCache: () => void;
  flushAnswers: () => Promise<any>;
  kickedOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = '/api';
const PROGRESS_CACHE_TTL = 120000;
const FLUSH_INTERVAL = 3000;
const MAX_BATCH_SIZE = 5;
const STATS_CACHE_TTL = 60000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kickedOut, setKickedOut] = useState(false);
  const router = useRouter();

  const progressCacheRef = useRef<{ data: any | null; timestamp: number }>({ data: null, timestamp: 0 });
  const statsCacheRef = useRef<Map<string, { stats: QuestionStats; timestamp: number }>>(new Map());
  const pendingAnswersRef = useRef<any[]>([]);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flushPromiseRef = useRef<Promise<any> | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('learnfmpa_token');
    const headers: { [key: string]: string } = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const invalidateProgressCache = useCallback(() => {
    progressCacheRef.current = { data: null, timestamp: 0 };
  }, []);

  const handleUnauthorized = useCallback(() => {
    setKickedOut(true);
    setUser(null);
    localStorage.removeItem('learnfmpa_user');
    localStorage.removeItem('learnfmpa_token');
    invalidateProgressCache();
    router.push('/login?kicked=1');
  }, [router, invalidateProgressCache]);

  useEffect(() => {
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

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingAnswersRef.current.length > 0) {
        const answers = [...pendingAnswersRef.current];
        pendingAnswersRef.current = [];
        const token = localStorage.getItem('learnfmpa_token');
        if (user?.id && token) {
          const blob = new Blob(
            [JSON.stringify({ user_id: user.id, answers })],
            { type: 'application/json' }
          );
          navigator.sendBeacon(`${API_BASE}/answer`, blob);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current);
      }
    };
  }, [user]);

  const flushPendingAnswers = useCallback(async (): Promise<any> => {
    if (pendingAnswersRef.current.length === 0) return null;

    if (flushPromiseRef.current) return flushPromiseRef.current;

    const answersToFlush = [...pendingAnswersRef.current];
    pendingAnswersRef.current = [];

    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    flushPromiseRef.current = (async () => {
      try {
        const response = await fetch(`${API_BASE}/answer`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ user_id: user?.id, answers: answersToFlush })
        });

        if (response.status === 401) {
          handleUnauthorized();
          return null;
        }

        const data = await response.json();
        invalidateProgressCache();

        if (data.success && data.statistics) {
          const lastAnswer = answersToFlush[answersToFlush.length - 1];
          if (lastAnswer) {
            const statsKey = `${lastAnswer.module_id}_${lastAnswer.question_id}`;
            statsCacheRef.current.set(statsKey, { stats: data.statistics, timestamp: Date.now() });
          }
        }

        return data;
      } catch (error) {
        console.error('Failed to flush answers:', error);
        pendingAnswersRef.current = [...answersToFlush, ...pendingAnswersRef.current];
        return null;
      } finally {
        flushPromiseRef.current = null;
      }
    })();

    return flushPromiseRef.current;
  }, [user, invalidateProgressCache, getAuthHeaders, handleUnauthorized]);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
    }
    flushTimerRef.current = setTimeout(flushPendingAnswers, FLUSH_INTERVAL);
  }, [flushPendingAnswers]);

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
        must_change_password: data.user.must_change_password,
        year: data.user.year || '3ème année'
      };

      setUser(userInfo);
      localStorage.setItem('learnfmpa_user', JSON.stringify(userInfo));
      localStorage.setItem('learnfmpa_token', data.user.token);
      setKickedOut(false);

      return {
        success: true,
        mustChangePassword: data.user.must_change_password
      };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = useCallback(() => {
    if (pendingAnswersRef.current.length > 0) {
      flushPendingAnswers();
    }
    const token = localStorage.getItem('learnfmpa_token');
    if (user?.id && token) {
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      }).catch(() => {});
    }
    setUser(null);
    localStorage.removeItem('learnfmpa_user');
    localStorage.removeItem('learnfmpa_token');
    invalidateProgressCache();
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('learnfmpa_answered_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    router.push('/login');
  }, [router, flushPendingAnswers, invalidateProgressCache]);

  const changePassword = async (email: string, currentPassword: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, current_password: currentPassword, new_password: newPassword })
      });

      if (response.status === 401) {
        handleUnauthorized();
        return { success: false, error: 'Session expirée' };
      }

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to change password' };
      }

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

  const submitAnswer = useCallback((
    moduleId: number,
    questionId: string,
    isCorrect: boolean,
    selectedOptions: number[]
  ): void => {
    if (!user) return;

    const answer = {
      module_id: moduleId,
      question_id: questionId,
      is_correct: isCorrect,
      selected_options: selectedOptions
    };

    pendingAnswersRef.current.push(answer);
    scheduleFlush();
  }, [user, scheduleFlush]);

  const getProgress = useCallback(async (moduleId: number) => {
    if (!user) return {};

    const cache = progressCacheRef.current;
    if (cache.data && Date.now() - cache.timestamp < PROGRESS_CACHE_TTL) {
      return cache.data[`module_${moduleId}`] || {};
    }

    try {
      const response = await fetch(`${API_BASE}/progress?user_id=${user.id}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (response.status === 401) {
        handleUnauthorized();
        return {};
      }

      const data = await response.json();

      if (data.success && data.progress) {
        progressCacheRef.current = { data: data.progress, timestamp: Date.now() };
        return data.progress[`module_${moduleId}`] || {};
      }
      return {};
    } catch (error) {
      console.error('Failed to get progress:', error);
      return {};
    }
  }, [user, getAuthHeaders, handleUnauthorized]);

  const getAllProgress = useCallback(async () => {
    if (!user) return {};

    const cache = progressCacheRef.current;
    if (cache.data && Date.now() - cache.timestamp < PROGRESS_CACHE_TTL) {
      return cache.data;
    }

    try {
      const response = await fetch(`${API_BASE}/progress?user_id=${user.id}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (response.status === 401) {
        handleUnauthorized();
        return {};
      }

      const data = await response.json();

      if (data.success && data.progress) {
        progressCacheRef.current = { data: data.progress, timestamp: Date.now() };
        return data.progress;
      }
      return {};
    } catch (error) {
      console.error('Failed to get all progress:', error);
      return {};
    }
  }, [user, getAuthHeaders, handleUnauthorized]);

  const getQuestionStats = useCallback(async (moduleId: number, questionId: string): Promise<QuestionStats | null> => {
    const statsKey = `${moduleId}_${questionId}`;
    const cached = statsCacheRef.current.get(statsKey);
    if (cached && Date.now() - cached.timestamp < STATS_CACHE_TTL) {
      return cached.stats;
    }

    try {
      const response = await fetch(`${API_BASE}/statistics?module_id=${moduleId}&question_id=${questionId}`, {
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (response.status === 401) {
        handleUnauthorized();
        return null;
      }

      const data = await response.json();

      if (data.success && data.statistics) {
        statsCacheRef.current.set(statsKey, { stats: data.statistics, timestamp: Date.now() });
        return data.statistics;
      }
      return null;
    } catch (error) {
      if (cached) return cached.stats;
      return null;
    }
  }, [getAuthHeaders, handleUnauthorized]);

  const flushAnswers = useCallback(async () => {
    return flushPendingAnswers();
  }, [flushPendingAnswers]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      logout,
      changePassword,
      submitAnswer,
      getProgress,
      getAllProgress,
      getQuestionStats,
      invalidateProgressCache,
      flushAnswers,
      kickedOut
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
