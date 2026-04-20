'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { modules, getModuleQuestions, getModuleChapters } from '@/data/modules';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

interface ModuleStats {
  questionCount: number;
  chapterCount: number;
  loaded: boolean;
}

export default function ModulesPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isLoading: authLoading, logout, getAllProgress } = useAuth();
  const isDarkMode = theme === 'dark';
  const [moduleStats, setModuleStats] = useState<Map<number, ModuleStats>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const userYears = user?.years || ['3ème année'];
  const filteredModules = modules.filter(m => m.levels.some(level => userYears.includes(level)));

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && !authLoading) {
      getAllProgress().catch(() => {});
    }
  }, [user, authLoading, getAllProgress]);

  useEffect(() => {
    const loadModuleStats = async () => {
      const statsMap = new Map<number, ModuleStats>();
      
      for (const module of filteredModules) {
        try {
          const [questions, chapters] = await Promise.all([
            getModuleQuestions(module.id),
            getModuleChapters(module.id)
          ]);
          statsMap.set(module.id, {
            questionCount: questions.length,
            chapterCount: chapters.length,
            loaded: true
          });
        } catch {
          statsMap.set(module.id, {
            questionCount: 0,
            chapterCount: 0,
            loaded: false
          });
        }
      }
      
      setModuleStats(statsMap);
      setIsLoading(false);
    };

    loadModuleStats();
  }, [userYears]);

  const handleLogout = () => {
    logout();
  };

  const getYearBadgeColor = (year: string) => {
    const colors: { [key: string]: string } = {
      '1ère année': 'bg-blue-100 text-blue-700',
      '2ème année': 'bg-purple-100 text-purple-700',
      '3ème année': 'bg-green-100 text-green-700',
      '4ème année': 'bg-amber-100 text-amber-700',
      '5ème année': 'bg-rose-100 text-rose-700',
      '6ème année': 'bg-cyan-100 text-cyan-700',
    };
    return colors[year] || 'bg-gray-100 text-gray-700';
  };

  if (authLoading || !user) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border-gray-700' : 'bg-white/95 backdrop-blur-sm border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-green-800/20">
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-white rounded"></div>
                  <div className="w-1 h-4 bg-white rounded"></div>
                </div>
              </div>
              <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>LearnFMPA</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium`}>
                Tableau de bord
              </Link>
              <span className={`${isDarkMode ? 'text-green-400' : 'text-green-600'} font-medium`}>
                Modules
              </span>
              <Link href="/progress" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium`}>
                Progression
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className={`hidden sm:flex items-center px-4 py-2 rounded-xl transition-all font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Modules
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Choisissez un module pour commencer à réviser les annales — {userYears.join(', ')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => {
            const stats = moduleStats.get(module.id);
            return (
              <Link
                key={module.id}
                href={`/modules/${module.id}`}
                className="group cursor-pointer"
              >
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className={`h-32 bg-gradient-to-br ${module.gradient} relative overflow-hidden flex items-center justify-center`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                    <div className="relative z-10 text-white text-center">
                      <div className="text-4xl font-bold mb-1">{stats?.questionCount || '...'}</div>
                      <div className="text-sm text-white/80">questions</div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-bold text-lg group-hover:text-green-600 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {module.title}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {module.levels.map((level) => (
                          <span key={level} className={`text-xs px-2 py-1 rounded-full font-medium ${getYearBadgeColor(level)}`}>
                            {level}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
                      {module.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {stats ? `${stats.chapterCount} chapitres` : '...'}
                      </div>
                      <div className={`flex items-center text-sm font-medium text-green-600 group-hover:text-green-700`}>
                        Commencer
                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
