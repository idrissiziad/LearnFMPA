'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { modules, preloadModuleData, Question } from '@/data/modules';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

interface ModuleStats {
  questionCount: number;
  chapterCount: number;
  loaded: boolean;
}

interface SearchResult {
  type: 'module' | 'question';
  moduleId: number;
  moduleTitle: string;
  questionId?: string;
  questionText?: string;
  chapter?: string;
  year?: string;
  questionIndex?: number;
}

export default function Dashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isLoading: authLoading, logout } = useAuth();
  const isDarkMode = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [allModuleQuestions, setAllModuleQuestions] = useState<Map<number, Question[]>>(new Map());
  const [moduleStats, setModuleStats] = useState<Map<number, ModuleStats>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadModuleStats = async () => {
      const statsMap = new Map<number, ModuleStats>();
      const questionsMap = new Map<number, Question[]>();

      const results = await Promise.all(
        modules.map(async (mod) => {
          try {
            const { questions, chapters } = await preloadModuleData(mod.id);
            return {
              id: mod.id,
              stats: { questionCount: questions.length, chapterCount: chapters.length, loaded: true } as ModuleStats,
              questions
            };
          } catch {
            return {
              id: mod.id,
              stats: { questionCount: 0, chapterCount: 0, loaded: false } as ModuleStats,
              questions: [] as Question[]
            };
          }
        })
      );

      for (const result of results) {
        statsMap.set(result.id, result.stats);
        questionsMap.set(result.id, result.questions);
      }

      setModuleStats(statsMap);
      setAllModuleQuestions(questionsMap);
      setIsLoading(false);
    };

    loadModuleStats();
  }, []);

  const totalQuestions = Array.from(moduleStats.values()).reduce((sum, s) => sum + s.questionCount, 0);
  const totalChapters = Array.from(moduleStats.values()).reduce((sum, s) => sum + s.chapterCount, 0);

  const performSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase().trim();

    for (const mod of modules) {
      if (mod.title.toLowerCase().includes(lowerQuery) || 
          mod.description.toLowerCase().includes(lowerQuery)) {
        results.push({
          type: 'module',
          moduleId: mod.id,
          moduleTitle: mod.title
        });
      }

      const questions = allModuleQuestions.get(mod.id) || [];
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (q.question.toLowerCase().includes(lowerQuery) ||
            (q.chapter && q.chapter.toLowerCase().includes(lowerQuery)) ||
            (q.year && q.year.toLowerCase().includes(lowerQuery)) ||
            q.options.some(opt => opt.toLowerCase().includes(lowerQuery))) {
          results.push({
            type: 'question',
            moduleId: mod.id,
            moduleTitle: mod.title,
            questionId: q.id,
            questionText: q.question,
            chapter: q.chapter,
            year: q.year,
            questionIndex: i
          });
        }
      }
    }

    const moduleResults = results.filter(r => r.type === 'module');
    const questionResults = results.filter(r => r.type === 'question').slice(0, 20);
    setSearchResults([...moduleResults, ...questionResults]);
    setShowResults(true);
    setIsSearching(false);
  }, [allModuleQuestions]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchQuery.trim()) {
      debounceRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    performSearch(searchQuery);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'module') {
      router.push(`/modules/${result.moduleId}`);
    } else {
      router.push(`/modules/${result.moduleId}?q=${result.questionIndex}`);
    }
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  };

  const handleLogout = () => {
    logout();
  };

  const quickStats = [
    { label: 'Modules', value: modules.length, icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', gradient: 'from-blue-500 to-blue-600', bgLight: 'bg-blue-50', bgDark: 'bg-blue-900/30' },
    { label: 'Questions', value: totalQuestions || '...', icon: 'M8.228 9c.549-1.165 2.36-2 4.272-2C14.528 7 16 8.153 16 9.5c0 1.657-1.623 2.417-3.176 3.01-.842.326-1.475.77-1.475 1.49v.5M12 17h.01M9 12h6', gradient: 'from-emerald-500 to-emerald-600', bgLight: 'bg-emerald-50', bgDark: 'bg-emerald-900/30' },
    { label: 'Chapitres', value: totalChapters || '...', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', gradient: 'from-purple-500 to-purple-600', bgLight: 'bg-purple-50', bgDark: 'bg-purple-900/30' },
    { label: 'Années', value: '7', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', gradient: 'from-amber-500 to-orange-500', bgLight: 'bg-amber-50', bgDark: 'bg-amber-900/30' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
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
      <header className={`${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md border-gray-700' : 'bg-white/95 backdrop-blur-md border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/dashboard" className="flex items-center min-w-0 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 transition-shadow flex-shrink-0">
                <div className="flex space-x-0.5 sm:space-x-1">
                  <div className="w-0.5 sm:w-1 h-3 sm:h-4 bg-white rounded"></div>
                  <div className="w-0.5 sm:w-1 h-3 sm:h-4 bg-white rounded"></div>
                </div>
              </div>
              <span className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} truncate`}>LearnFMPA</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className={`${isDarkMode ? 'text-green-400' : 'text-green-600'} font-medium text-sm relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-green-500 after:rounded-full`}>
                Tableau de bord
              </Link>
              <Link href="/modules" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium text-sm`}>
                Modules
              </Link>
              <Link href="/progress" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium text-sm`}>
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
                className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        <div className={`relative overflow-hidden rounded-2xl mb-8 ${isDarkMode ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600' : 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500'} p-6 sm:p-8`}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              {getGreeting()}, {user?.name?.replace(/_/g, ' ') || 'Étudiant'}
            </h1>
            <p className="text-green-100 text-sm sm:text-base lg:text-lg max-w-xl">
              Continuez votre progression vers l&apos;excellence. Explorez les modules et testez vos connaissances.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 mb-8">
          {quickStats.map((stat, index) => (
            <div
              key={index}
              className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 sm:p-5 shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}
            >
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-0.5`}>
                {isLoading ? '...' : stat.value}
              </div>
              <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-5 sm:p-6 shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                  <svg className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Recherche rapide
                </h2>
              </div>
              <form onSubmit={handleSearch}>
                <div className={`group flex flex-col sm:flex-row items-stretch sm:items-center rounded-xl border-2 ${isDarkMode ? 'border-gray-600 bg-gray-700/50 focus-within:border-green-500' : 'border-gray-200 bg-gray-50 focus-within:border-green-500'} transition-all`}>
                  <div className={`flex items-center px-4 py-3 border-b sm:border-b-0 sm:border-r ${isDarkMode ? 'border-gray-600 group-focus-within:border-green-500' : 'border-gray-200 group-focus-within:border-green-500'} transition-colors`}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un module, chapitre ou question..."
                    className={`flex-1 px-4 py-3 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-sm sm:text-base ${isDarkMode ? 'text-white bg-transparent placeholder-gray-400' : 'text-gray-800 bg-transparent placeholder-gray-500'}`}
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium text-sm hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm"
                  >
                    Rechercher
                  </button>
                </div>
              </form>

              {showResults && (
                <div className={`mt-4 rounded-xl border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} shadow-lg max-h-96 overflow-y-auto`}>
                  {isSearching ? (
                    <div className="p-4 text-center">
                      <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-gray-600">
                      {searchResults.map((result, index) => (
                        <button
                          key={`${result.type}-${result.moduleId}-${result.questionId || index}`}
                          onClick={() => handleResultClick(result)}
                          className={`w-full text-left p-4 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'} transition-colors`}
                        >
                          {result.type === 'module' ? (
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                                <svg className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                              </div>
                              <div>
                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{result.moduleTitle}</p>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Module</p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
                                <svg className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.36-2 4.272-2C14.528 7 16 8.153 16 9.5c0 1.657-1.623 2.417-3.176 3.01-.842.326-1.475.77-1.475 1.49v.5M12 17h.01M9 12h6" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                                  {(result.questionText && result.questionText.length > 80 ? result.questionText.substring(0, 80) + '...' : result.questionText)}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                    {result.moduleTitle}
                                  </span>
                                  {result.chapter && (
                                    <span className={`text-xs px-2 py-0.5 rounded ${isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-600'}`}>
                                      {result.chapter}
                                    </span>
                                  )}
                                  {result.year && (
                                    <span className={`text-xs px-2 py-0.5 rounded ${isDarkMode ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-600'}`}>
                                      {result.year}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className={`p-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>Aucun résultat trouvé</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6">
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-3`}>Accès rapide</h3>
                <div className="flex flex-wrap gap-2">
                  {modules.slice(0, 5).map((mod) => (
                    <Link
                      key={mod.id}
                      href={`/modules/${mod.id}`}
                      className={`px-3 py-1.5 rounded-lg text-sm ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700'} cursor-pointer transition-all`}
                    >
                      {mod.title}
                    </Link>
                  ))}
                  <Link
                    href="/modules"
                    className="px-3 py-1.5 rounded-lg text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 cursor-pointer transition-all shadow-sm"
                  >
                    +{modules.length - 5} plus
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-5 sm:p-6 shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Actions rapides
            </h2>
            <div className="space-y-3">
              <Link
                href="/modules"
                className={`flex items-center justify-between p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-green-50'} transition-all cursor-pointer group`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Modules</p>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Parcourir les annales
                    </span>
                  </div>
                </div>
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-green-600'} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/progress"
                className={`flex items-center justify-between p-3 rounded-xl ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-purple-50'} transition-all cursor-pointer group`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/25">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Progression</p>
                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Voir vos statistiques
                    </span>
                  </div>
                </div>
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-500 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-purple-600'} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <button
                onClick={handleLogout}
                className={`sm:hidden w-full flex items-center justify-between p-3 rounded-xl ${isDarkMode ? 'bg-red-900/30 hover:bg-red-900/50' : 'bg-red-50 hover:bg-red-100'} transition-all cursor-pointer group`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-500/25">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Déconnexion</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Modules populaires
            </h2>
            <Link href="/modules" className={`text-sm font-medium ${isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'} transition-colors flex items-center gap-1`}>
              Voir tout
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {modules.slice(0, 4).map((module) => {
              const stats = moduleStats.get(module.id);
              return (
                <Link
                  key={module.id}
                  href={`/modules/${module.id}`}
                  className="group"
                >
                  <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className={`h-24 bg-gradient-to-br ${module.gradient} relative overflow-hidden flex items-center justify-center`}>
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                      <div className="relative z-10 text-white text-center">
                        <div className="text-2xl font-bold">{stats?.questionCount || '...'}</div>
                        <div className="text-xs text-white/80">questions</div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className={`font-semibold text-sm group-hover:text-green-600 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                        {module.title}
                      </h3>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                        {module.level} · {stats ? `${stats.chapterCount} chapitres` : '...'}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className={`rounded-xl overflow-hidden bg-gradient-to-r ${isDarkMode ? 'from-green-600 via-emerald-600 to-teal-600' : 'from-green-500 via-emerald-500 to-teal-500'} shadow-lg`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 sm:p-8 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Prêt à commencer ?</h2>
                <p className="text-green-100 text-sm">Explorez les modules et testez vos connaissances.</p>
              </div>
            </div>
            <Link
              href="/modules"
              className="px-6 py-3 bg-white text-green-600 font-semibold text-sm rounded-xl hover:bg-gray-100 transition-colors shadow-lg whitespace-nowrap"
            >
              Explorer les modules
            </Link>
          </div>
        </div>
      </main>

      <footer className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t py-6 mt-8`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              © 2024 LearnFMPA
            </p>
            <div className="flex space-x-6">
              <a href="/contact" className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}>Contact</a>
              <a href="/faq" className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}>FAQ</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
