'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { modules, getModuleQuestions, getModuleChapters, Module, Question, Chapter } from '@/data/modules';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

interface ModuleStats {
  questionCount: number;
  chapterCount: number;
  loaded: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleStats, setModuleStats] = useState<Map<number, ModuleStats>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

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
    console.log('Logging out...');
    router.push('/login');
  };

  const quickStats = [
    { label: 'Modules disponibles', value: modules.length, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { label: 'Questions totales', value: totalQuestions || '...', icon: 'M8.228 9c.549-1.165 2.36-2 4.272-2C14.528 7 16 8.153 16 9.5c0 1.657-1.623 2.417-3.176 3.01-.842.326-1.475.77-1.475 1.49v.5M12 17h.01M9 12h6' },
    { label: 'Chapitres', value: totalChapters || '...', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { label: 'Années couvertes', value: '2024', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  ];

  const getYearBadgeColor = (year: string) => {
    const colors: { [key: string]: string } = {
      '1A': 'bg-blue-100 text-blue-700',
      '2A': 'bg-purple-100 text-purple-700',
      '3A': 'bg-green-100 text-green-700',
      '4A': 'bg-amber-100 text-amber-700',
      '5A': 'bg-rose-100 text-rose-700',
      '6A': 'bg-cyan-100 text-cyan-700',
      '7A': 'bg-indigo-100 text-indigo-700',
    };
    return colors[year] || 'bg-gray-100 text-gray-700';
  };

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
              <Link href="/dashboard" className={`${isDarkMode ? 'text-green-400' : 'text-green-600'} font-medium`}>
                Tableau de bord
              </Link>
              <Link href="/modules" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium`}>
                Modules
              </Link>
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
            Bonjour, Étudiant
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Explorez les modules et commencez à réviser les annales.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 sm:p-6 shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>
                  <svg className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
              </div>
              <div className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                {isLoading ? '...' : stat.value}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Recherche rapide
                </h2>
              </div>
              <form onSubmit={handleSearch}>
                <div className={`flex items-center rounded-xl border ${isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'} overflow-hidden`}>
                  <div className="pl-4">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une question, un module..."
                    className={`flex-1 px-4 py-4 outline-none ${isDarkMode ? 'text-white bg-gray-700 placeholder-gray-400' : 'text-gray-800 bg-gray-50 placeholder-gray-500'}`}
                  />
                  <button
                    type="submit"
                    className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium hover:from-green-700 hover:to-green-800 transition-all"
                  >
                    Rechercher
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>Modules disponibles</h3>
                <div className="flex flex-wrap gap-2">
                  {modules.map((mod) => (
                    <Link
                      key={mod.id}
                      href={`/modules/${mod.id}`}
                      className={`px-3 py-1.5 rounded-lg text-sm ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'} hover:bg-green-100 hover:text-green-700 cursor-pointer transition-colors`}
                    >
                      {mod.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Aperçu des modules
            </h2>
            <div className="space-y-3">
              {modules.map((module) => {
                const stats = moduleStats.get(module.id);
                return (
                  <Link
                    key={module.id}
                    href={`/modules/${module.id}`}
                    className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'} transition-colors cursor-pointer`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-10 rounded-full bg-gradient-to-b ${module.gradient}`}></div>
                      <div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{module.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getYearBadgeColor(module.year)}`}>
                            {module.year}
                          </span>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {stats ? `${stats.questionCount} questions` : '...'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Tous les modules
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => {
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
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getYearBadgeColor(module.year)}`}>
                          {module.year}
                        </span>
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
        </div>

        <div className={`rounded-xl p-6 bg-gradient-to-r from-green-600 to-green-700 text-white`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-1">Prêt à commencer ?</h2>
              <p className="text-green-100">Explorez les modules et testez vos connaissances avec les annales.</p>
            </div>
            <Link
              href={`/modules/${modules[0]?.id || 1}`}
              className="px-6 py-3 bg-white text-green-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-lg whitespace-nowrap"
            >
              Commencer à réviser
            </Link>
          </div>
        </div>
      </main>

      <footer className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t py-6 mt-8`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              © 2024 LearnFMPA. Tous droits réservés.
            </p>
            <div className="flex space-x-6">
              <a href="#" className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Contact</a>
              <a href="#" className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>FAQ</a>
              <a href="#" className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>Confidentialité</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
