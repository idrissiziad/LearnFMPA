'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { modules, getModuleQuestions, getModuleChapters } from '@/data/modules';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isLoading: authLoading, logout } = useAuth();
  const isDarkMode = theme === 'dark';
  const [moduleStats, setModuleStats] = useState<{ [key: number]: { questions: number; chapters: number } }>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadStats() {
      const stats: { [key: number]: { questions: number; chapters: number } } = {};
      for (const module of modules) {
        try {
          const [questions, chapters] = await Promise.all([
            getModuleQuestions(module.id),
            getModuleChapters(module.id)
          ]);
          stats[module.id] = { questions: questions.length, chapters: chapters.length };
        } catch {
          stats[module.id] = { questions: 0, chapters: 0 };
        }
      }
      setModuleStats(stats);
      setIsLoading(false);
    }
    loadStats();
  }, []);

  if (authLoading || !user) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalQuestions = Object.values(moduleStats).reduce((sum, s) => sum + s.questions, 0);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} sticky top-0 z-50`}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg"></div>
            <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>LearnFMPA</span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{user.email}</span>
            <button onClick={logout} className="text-sm text-red-500 hover:text-red-600 font-medium">Déconnexion</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Bonjour, {user.name}
          </h1>
          <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {totalQuestions} questions disponibles
          </p>
        </div>

        <div className={`grid ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          {modules.map((module) => {
            const stats = moduleStats[module.id];
            return (
              <Link
                key={module.id}
                href={`/modules/${module.id}`}
                className={`flex items-center justify-between p-4 border-b last:border-b-0 ${isDarkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'} transition-colors group`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center text-white font-bold text-sm`}>
                    {module.title.charAt(0)}
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} group-hover:text-green-600 transition-colors`}>
                      {module.title}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {module.year}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {stats ? `${stats.questions} questions` : '...'}
                  </span>
                  <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'} group-hover:text-green-500 group-hover:translate-x-1 transition-all`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        <p className={`mt-8 text-center text-xs ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          © 2024 LearnFMPA
        </p>
      </main>
    </div>
  );
}
