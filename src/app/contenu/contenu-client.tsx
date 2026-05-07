'use client';

import Link from 'next/link';
import MobileNav from "@/components/MobileNav";
import DesktopNav from "@/components/DesktopNav";
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import { yearData, totalQuestions, totalModules, totalYears } from './contenu-data';

const YEAR_GRADIENTS: Record<string, string> = {
  "1ère année": 'from-blue-500 to-blue-700',
  "2ème année": 'from-purple-500 to-purple-700',
  "3ème année": 'from-green-500 to-green-700',
  "4ème année": 'from-amber-500 to-amber-700',
  "5ème année": 'from-rose-500 to-rose-700',
  "6ème année": 'from-cyan-500 to-cyan-700',
  "7ème année": 'from-indigo-500 to-indigo-700',
};

export default function ContenuClient() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`fixed top-0 w-full ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border-gray-700' : 'bg-white/95 backdrop-blur-sm border-gray-200'} border-b z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-green-800/20">
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-white rounded"></div>
                  <div className="w-1 h-4 bg-white rounded"></div>
                </div>
              </div>
              <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>LearnFMPA</span>
            </Link>

            <div className="hidden lg:flex items-center space-x-6">
              <DesktopNav />
              <ThemeToggle />
            </div>

            <div className="flex items-center space-x-2 lg:hidden">
              <ThemeToggle />
              <div className="sm:hidden">
                <MobileNav />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="text-center mb-12">
          <h1 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            Contenu disponible
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
            Découvrez l&apos;ensemble des modules et questions disponibles sur LearnFMPA, classés par année universitaire.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
          <div className={`text-center p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700 mb-2">
              {totalQuestions.toLocaleString('fr-FR')}
            </div>
            <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Questions
            </div>
          </div>
          <div className={`text-center p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700 mb-2">
              {totalModules}
            </div>
            <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Modules
            </div>
          </div>
          <div className={`text-center p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700 mb-2">
              {totalYears}
            </div>
            <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Années couvertes
            </div>
          </div>
        </div>

        {yearData.map((yearItem) => {
          const yearGradient = YEAR_GRADIENTS[yearItem.year] || 'from-gray-500 to-gray-700';

          return (
            <div key={yearItem.year} className="mb-14">
              <div className="flex items-center gap-4 mb-6">
                <div className={`px-4 py-2 rounded-xl bg-gradient-to-r ${yearGradient} text-white font-bold text-lg shadow-lg whitespace-nowrap`}>
                  {yearItem.year}
                </div>
                <div className={`h-px flex-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} whitespace-nowrap`}>
                  {yearItem.moduleCount} module{yearItem.moduleCount > 1 ? 's' : ''} · {yearItem.totalQuestions.toLocaleString('fr-FR')} questions
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {yearItem.modules.map((module) => (
                  <div
                    key={module.id}
                    className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
                  >
                    <div className={`h-24 bg-gradient-to-br ${module.gradient} relative overflow-hidden flex items-center justify-center`}>
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="relative z-10 text-white text-center">
                        <div className="text-3xl font-bold">{module.questionCount}</div>
                        <div className="text-sm text-white/80">questions</div>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                        {module.title}
                      </h3>
                      <div className="flex items-center text-sm">
                        <svg className={`w-4 h-4 mr-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {module.chapterCount} chapitre{module.chapterCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </main>

      <footer className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t py-8`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            © {new Date().getFullYear()} LearnFMPA. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}