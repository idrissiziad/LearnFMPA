'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { clearModuleLocalStorageCache } from '@/data/modules';

interface User {
  id: string;
  name: string;
  email: string;
  must_change_password: boolean;
  years: string[];
  subscription_status: 'inactive' | 'free' | 'paid';
  daily_answer_count: number;
  trial_days_left: number | null;
}

interface QuestionStats {
  total_answers: number;
  correct_answers: number;
  option_counts: { [optionIndex: string]: number };
}

interface FlushResult {
  statistics?: QuestionStats | null;
  progress?: Record<string, unknown> | null;
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
  clearProgressAndStats: () => void;
  flushAnswers: () => Promise<FlushResult | null>;
  kickedOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = '/api';
const PROGRESS_CACHE_TTL = 300000;
const FLUSH_INTERVAL = 3000;
const STATS_CACHE_TTL = 120000;
const FREE_FLUSH_INTERVAL = 10000;
const LOCAL_PROGRESS_KEY = 'learnfmpa_progress_cache';
const LOCAL_STATS_KEY = 'learnfmpa_stats_cache';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [kickedOut, setKickedOut] = useState(false);
  const router = useRouter();

  const progressCacheRef = useRef<{ data: any | null; timestamp: number }>({ data: null, timestamp: 0 });
  const statsCacheRef = useRef<Map<string, { stats: QuestionStats; timestamp: number }>>(new Map());
  const pendingAnswersRef = useRef<any[]>([]);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flushPromiseRef = useRef<Promise<FlushResult | null> | null>(null);
  const progressFetchRef = useRef<Promise<any> | null>(null);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('learnfmpa_token');
    const headers: { [key: string]: string } = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const loadProgressFromStorage = useCallback((): { data: any; timestamp: number } | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(LOCAL_PROGRESS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.data && parsed.timestamp) {
          return parsed;
        }
      }
    } catch {}
    return null;
  }, []);

  const saveProgressToStorage = useCallback((data: any) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    } catch {}
  }, []);

  const loadStatsFromStorage = useCallback((): Record<string, { stats: QuestionStats; timestamp: number }> | null => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(LOCAL_STATS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  }, []);

  const saveStatsToStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const obj: Record<string, { stats: QuestionStats; timestamp: number }> = {};
      statsCacheRef.current.forEach((v, k) => { obj[k] = v; });
      localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(obj));
    } catch {}
  }, []);

  const invalidateProgressCache = useCallback(() => {
    progressCacheRef.current = { data: null, timestamp: 0 };
  }, []);

  const clearProgressAndStats = useCallback(() => {
    progressCacheRef.current = { data: null, timestamp: 0 };
    statsCacheRef.current = new Map();
    try {
      localStorage.removeItem(LOCAL_PROGRESS_KEY);
      localStorage.removeItem(LOCAL_STATS_KEY);
    } catch {}
  }, []);

  const clearAllCaches = useCallback(() => {
    progressCacheRef.current = { data: null, timestamp: 0 };
    statsCacheRef.current = new Map();
    try {
      localStorage.removeItem(LOCAL_PROGRESS_KEY);
      localStorage.removeItem(LOCAL_STATS_KEY);
      clearModuleLocalStorageCache();
    } catch {}
  }, []);

  useEffect(() => {
    const stored = loadProgressFromStorage();
    if (stored) {
      progressCacheRef.current = stored;
    }
    const storedStats = loadStatsFromStorage();
    if (storedStats) {
      const map = new Map<string, { stats: QuestionStats; timestamp: number }>();
      Object.entries(storedStats).forEach(([k, v]: [string, any]) => {
        if (Date.now() - v.timestamp < STATS_CACHE_TTL) {
          map.set(k, v as { stats: QuestionStats; timestamp: number });
        }
      });
      statsCacheRef.current = map;
    }
  }, [loadProgressFromStorage, loadStatsFromStorage]);

  const handleUnauthorized = useCallback(() => {
    setKickedOut(true);
    setUser(null);
    localStorage.removeItem('learnfmpa_user');
    localStorage.removeItem('learnfmpa_token');
    clearAllCaches();
    router.push('/login?kicked=1');
  }, [router, clearAllCaches]);

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

  const flushPendingAnswers = useCallback(async (): Promise<FlushResult | null> => {
    if (pendingAnswersRef.current.length === 0) return null;

    if (flushPromiseRef.current) return flushPromiseRef.current;

    const answersToFlush = [...pendingAnswersRef.current];
    pendingAnswersRef.current = [];

    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    const currentAnswers = answersToFlush;

    flushPromiseRef.current = (async (): Promise<FlushResult | null> => {
      try {
        const response = await fetch(`${API_BASE}/answer`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ user_id: user?.id, answers: currentAnswers })
        });

        if (response.status === 401) {
          handleUnauthorized();
          return null;
        }

        const data = await response.json();

        if (data.success) {
          if (data.statistics) {
            const lastAnswer = currentAnswers[currentAnswers.length - 1];
            if (lastAnswer) {
              const statsKey = `${lastAnswer.module_id}_${lastAnswer.question_id}`;
              statsCacheRef.current.set(statsKey, { stats: data.statistics, timestamp: Date.now() });
            }
            saveStatsToStorage();
          }

          if (data.progress) {
            progressCacheRef.current = { data: data.progress, timestamp: Date.now() };
            saveProgressToStorage(data.progress);
          } else {
            progressCacheRef.current = { data: null, timestamp: 0 };
          }

          return {
            statistics: data.statistics || null,
            progress: data.progress || null,
          };
        }

        return null;
      } catch (error) {
        console.error('Failed to flush answers:', error);
        pendingAnswersRef.current = [...currentAnswers, ...pendingAnswersRef.current];
        return null;
      } finally {
        flushPromiseRef.current = null;
      }
    })();

    return flushPromiseRef.current;
  }, [user, getAuthHeaders, handleUnauthorized, saveStatsToStorage, saveProgressToStorage]);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
    }
    const interval = user?.subscription_status === 'free' ? FREE_FLUSH_INTERVAL : FLUSH_INTERVAL;
    flushTimerRef.current = setTimeout(flushPendingAnswers, interval);
  }, [flushPendingAnswers, user]);

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
        years: data.user.years || ['3ème année'],
        subscription_status: data.user.subscription_status || 'free',
        daily_answer_count: data.user.daily_answer_count || 0,
        trial_days_left: data.user.trial_days_left ?? null,
      };

      setUser(userInfo);
      localStorage.setItem('learnfmpa_user', JSON.stringify(userInfo));
      localStorage.setItem('learnfmpa_token', data.user.token);
      setKickedOut(false);

      progressCacheRef.current = { data: null, timestamp: 0 };

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
    clearAllCaches();
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('learnfmpa_answered_') || key.startsWith('learnfmpa_module_cache_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    router.push('/login');
  }, [router, flushPendingAnswers, clearAllCaches]);

  const changePassword = async (email: string, currentPassword: string, newPassword: string) => {
    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email, current_password: currentPassword, new_password: newPassword, user_id: user?.id })
      });

      if (response.status === 401) {
        let data: any = {};
        try { data = await response.json(); } catch {}
        if (data.code === 'SESSION_INVALID') {
          handleUnauthorized();
          return { success: false, error: 'Session expirée' };
        }
        return { success: false, error: data.error || 'Non autorisé' };
      }

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to change password' };
      }

      if (user) {
        const updatedUser = { ...user, must_change_password: false, subscription_status: data.subscription_status || user.subscription_status };
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

    const storedProg = loadProgressFromStorage();
    if (storedProg && storedProg.data && Date.now() - storedProg.timestamp < PROGRESS_CACHE_TTL) {
      progressCacheRef.current = storedProg;
      return storedProg.data[`module_${moduleId}`] || {};
    }

    if (progressFetchRef.current) {
      return progressFetchRef.current.then((data: any) => data?.[`module_${moduleId}`] || {});
    }

    progressFetchRef.current = (async () => {
      try {
        const response = await fetch(`${API_BASE}/progress?user_id=${user.id}`, {
          headers: getAuthHeaders(),
          cache: 'no-store',
        });

        if (response.status === 401) {
          handleUnauthorized();
          return storedProg?.data || {};
        }

        const data = await response.json();

        if (data.success && data.progress) {
          progressCacheRef.current = { data: data.progress, timestamp: Date.now() };
          saveProgressToStorage(data.progress);
          return data.progress;
        }
        return storedProg?.data || {};
      } catch (error) {
        console.error('Failed to get progress:', error);
        if (storedProg?.data) {
          progressCacheRef.current = { data: storedProg.data, timestamp: storedProg.timestamp };
          return storedProg.data;
        }
        return {};
      } finally {
        progressFetchRef.current = null;
      }
    })();

    return progressFetchRef.current.then((data: any) => data?.[`module_${moduleId}`] || {});
  }, [user, getAuthHeaders, handleUnauthorized, loadProgressFromStorage, saveProgressToStorage]);

  const getAllProgress = useCallback(async () => {
    if (!user) return {};

    const cache = progressCacheRef.current;
    if (cache.data && Date.now() - cache.timestamp < PROGRESS_CACHE_TTL) {
      return cache.data;
    }

    const storedProg = loadProgressFromStorage();
    if (storedProg && storedProg.data && Date.now() - storedProg.timestamp < PROGRESS_CACHE_TTL) {
      progressCacheRef.current = storedProg;
      return storedProg.data;
    }

    if (progressFetchRef.current) {
      return progressFetchRef.current;
    }

    progressFetchRef.current = (async () => {
      try {
        const response = await fetch(`${API_BASE}/progress?user_id=${user.id}`, {
          headers: getAuthHeaders(),
          cache: 'no-store',
        });

        if (response.status === 401) {
          handleUnauthorized();
          return storedProg?.data || {};
        }

        const data = await response.json();

        if (data.success && data.progress) {
          progressCacheRef.current = { data: data.progress, timestamp: Date.now() };
          saveProgressToStorage(data.progress);
          return data.progress;
        }
        return storedProg?.data || {};
      } catch (error) {
        console.error('Failed to get all progress:', error);
        if (storedProg?.data) {
          progressCacheRef.current = { data: storedProg.data, timestamp: storedProg.timestamp };
          return storedProg.data;
        }
        return {};
      } finally {
        progressFetchRef.current = null;
      }
    })();

    return progressFetchRef.current;
  }, [user, getAuthHeaders, handleUnauthorized, loadProgressFromStorage, saveProgressToStorage]);

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
        if (cached) return cached.stats;
        return null;
      }

      const data = await response.json();

      if (data.success && data.statistics) {
        statsCacheRef.current.set(statsKey, { stats: data.statistics, timestamp: Date.now() });
        saveStatsToStorage();
        return data.statistics;
      }
      return null;
    } catch (error) {
      if (cached) return cached.stats;
      return null;
    }
  }, [getAuthHeaders, handleUnauthorized, saveStatsToStorage]);

  const flushAnswers = useCallback(async (): Promise<FlushResult | null> => {
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
      clearProgressAndStats,
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