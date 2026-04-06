'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { modules, getModuleQuestions, getModuleChapters } from '@/data/modules';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

interface ModuleStats {
  questionCount: number;
  chapterCount: number;
  loaded: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isLoading: authLoading, logout } = useAuth();
  const isDarkMode = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleStats, setModuleStats] = useState<Map<number, ModuleStats>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadModuleStats = async () => {
      const statsMap = new Map<number, ModuleStats>();
      
      for (const module of modules) {
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
  }, []);

  const totalQuestions = Array.from(moduleStats.values()).reduce((sum, s) => sum + s.questionCount, 0);
  const totalChapters = Array.from(moduleStats.values()).reduce((sum, s) => sum + s.chapterCount, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  const handleLogout = () => {
    logout();
  };

  const quickStats = [
    { label: 'Modules', value: modules.length, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { label: 'Questions', value: totalQuestions || '...', icon: 'M8.228 9c.549-1.165 2.36-2 4.272-2C14.528 7 16 8.153 16 9.5c0 1.657-1.623 2.417-3.176 3.01-.842.326-1.475.77-1.475 1.49v.5M12 17h.01M9 12h6' },
    { label: 'Chapitres', value: totalChapters || '...', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { label: 'Années', value: '7', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ];

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
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/dashboard" className="flex items-center min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg shadow-green-800/20 flex-shrink-0">
                <div className="flex space-x-0.5 sm:space-x-1">
                  <div className="w-0.5 sm:w-1 h-3 sm:h-4 bg-white rounded"></div>
                  <div className="w-0.5 sm:w-1 h-3 sm:h-4 bg-white rounded"></div>
                </div>
              </div>
              <span className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} truncate`}>LearnFMPA</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className={`${isDarkMode ? 'text-green-400' : 'text-green-600'} font-medium text-sm`}>
                Tableau de bord
              </Link>
              <Link href="/modules" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium text-sm`}>
                Modules
              </Link>
              <Link href="/progress" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium text-sm`}>
                Progression
              </Link>
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className={`hidden sm:flex items-center px-3 py-1.5 rounded-lg transition-all font-medium text-sm ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden lg:inline">Déconnexion</span>
              </button>
              <Link
                href="/modules"
                className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 sm:py-6 lg:py-8">
        <div className="mb-6">
          <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
            Bonjour, {user?.name?.replace(/_/g, ' ') || 'Étudiant'}
          </h1>
          <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Continuez votre progression vers l'excellence.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mb-2 sm:mb-3 ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-0.5 sm:mb-1`}>
                {isLoading ? '...' : stat.value}
              </div>
              <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6">
          <div className="lg:col-span-2">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <h2 className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Recherche rapide
              </h2>
              <form onSubmit={handleSearch}>
                <div className={`flex flex-col sm:flex-row items-stretch sm:items-center rounded-lg sm:rounded-xl border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} overflow-hidden`}>
                  <div className="flex items-center px-3 sm:px-4 py-3 border-b sm:border-b-0 sm:border-r ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className={`flex-1 px-3 sm:px-4 py-3 outline-none text-sm sm:text-base ${isDarkMode ? 'text-white bg-gray-700 placeholder-gray-400' : 'text-gray-800 bg-gray-50 placeholder-gray-500'}`}
                  />
                  <button
                    type="submit"
                    className="px-4 sm:px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium text-sm sm:text-base hover:from-green-700 hover:to-green-800 transition-all"
                  >
                    Rechercher
                  </button>
                </div>
              </form>

              <div className="mt-4 sm:mt-6">
                <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2 sm:mb-3`}>Accès rapide</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {modules.slice(0, 6).map((mod) => (
                    <Link
                      key={mod.id}
                      href={`/modules/${mod.id}`}
                      className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'} hover:bg-green-100 hover:text-green-700 cursor-pointer transition-colors`}
                    >
                      {mod.title}
                    </Link>
                  ))}
                  <Link
                    href="/modules"
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm bg-green-600 text-white hover:bg-green-700 cursor-pointer transition-colors`}
                  >
                    +{modules.length - 6}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3 sm:mb-4`}>
              Actions
            </h2>
            <div className="space-y-2 sm:space-y-3">
              <Link
                href="/modules"
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-colors cursor-pointer`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600`}>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-medium text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Modules</p>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} hidden sm:inline`}>
                      Parcourir les annales
                    </span>
                  </div>
                </div>
                <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/progress"
                className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-colors cursor-pointer`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600`}>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-medium text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Progression</p>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} hidden sm:inline`}>
                      Voir vos statistiques
                    </span>
                  </div>
                </div>
                <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <button
                onClick={handleLogout}
                className={`sm:hidden w-full flex items-center justify-between p-2.5 sm:p-3 rounded-lg ${isDarkMode ? 'bg-red-900/30 hover:bg-red-900/50' : 'bg-red-50 hover:bg-red-100'} transition-colors cursor-pointer`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600`}>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-medium text-sm sm:text-base ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Déconnexion</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className={`rounded-lg sm:rounded-xl p-4 sm:p-6 bg-gradient-to-r from-green-600 to-green-700 text-white`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
            <div>
              <h2 className="text-lg sm:text-xl font-bold mb-1">Prêt à commencer ?</h2>
              <p className="text-sm sm:text-base text-green-100">Explorez les modules et testez vos connaissances.</p>
            </div>
            <Link
              href="/modules"
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white text-green-700 font-semibold text-sm sm:text-base rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors shadow-lg whitespace-nowrap"
            >
              Explorer
            </Link>
          </div>
        </div>
      </main>

      <footer className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t py-4 sm:py-6 mt-4 sm:mt-8`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              © 2024 LearnFMPA
            </p>
            <div className="flex space-x-4 sm:space-x-6">
              <a href="#" className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Contact</a>
              <a href="#" className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>FAQ</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
