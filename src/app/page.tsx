'use client';

import { useTheme } from '@/contexts/ThemeContext';

export default function Home() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <nav className={`fixed top-0 w-full ${isDarkMode ? 'bg-gray-900/80' : 'bg-white/80'} backdrop-blur-lg z-50 border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg"></div>
            <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>LearnFMPA</span>
          </div>
          <a href="/login" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
            Connexion
          </a>
        </div>
      </nav>

      <main className="pt-14">
        <section className="min-h-[90vh] flex items-center">
          <div className="max-w-5xl mx-auto px-4 py-20">
            <div className="max-w-2xl">
              <h1 className={`text-4xl sm:text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} leading-tight`}>
                Révisez vos annales de médecine
              </h1>
              <p className={`mt-4 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Accédez à des milliers de questions corrigées, de la 1ère à la 7ème année.
              </p>
              <div className="mt-8 flex gap-3">
                <a href="/login" className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors">
                  Commencer
                </a>
              </div>
            </div>

            <div className={`mt-20 grid grid-cols-2 sm:grid-cols-4 gap-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <div>
                <div className="text-3xl font-bold text-green-600">10000+</div>
                <div className="mt-1 text-sm">Questions</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">7</div>
                <div className="mt-1 text-sm">Années</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">6</div>
                <div className="mt-1 text-sm">Facultés</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">100%</div>
                <div className="mt-1 text-sm">Gratuit</div>
              </div>
            </div>
          </div>
        </section>

        <section className={`py-20 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <div className="max-w-5xl mx-auto px-4">
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Pourquoi LearnFMPA ?
            </h2>
            <div className="mt-8 grid sm:grid-cols-3 gap-6">
              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xl">✓</div>
                <h3 className={`mt-4 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Corrigés détaillés</h3>
                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Chaque question inclut une explication complète.
                </p>
              </div>
              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xl">📊</div>
                <h3 className={`mt-4 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Suivi de progression</h3>
                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Visualisez votre avancement en temps réel.
                </p>
              </div>
              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xl">🎯</div>
                <h3 className={`mt-4 font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Toutes les facultés</h3>
                <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Annales de toutes les facultés de médecine.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={`py-8 border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className={`text-sm ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            © 2024 LearnFMPA
          </p>
          <a href="mailto:admin@learnfmpa.com" className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} hover:text-green-600`}>
            Contact: admin@learnfmpa.com
          </a>
        </div>
      </footer>
    </div>
  );
}
