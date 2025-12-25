'use client';

import MobileNav from "@/components/MobileNav";
import DesktopNav from "@/components/DesktopNav";
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header Section */}
      <header className={`fixed top-0 w-full ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-800 rounded-full flex items-center justify-center mr-3">
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-white rounded"></div>
                  <div className="w-1 h-4 bg-white rounded"></div>
                </div>
              </div>
              <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>LearnFMPA</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <DesktopNav />
              <ThemeToggle />
            </div>
            
            {/* Theme Toggle and Mobile Menu */}
            <div className="flex items-center space-x-2 lg:hidden">
              <ThemeToggle />
              <div className="sm:hidden">
                <MobileNav />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative mt-16">
        <div className="relative h-80 sm:h-96 md:h-[500px] lg:h-[600px] xl:h-[700px] overflow-hidden rounded-lg bg-gradient-to-r from-gray-900 to-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="text-center max-w-3xl mx-auto px-4 lg:max-w-4xl xl:max-w-5xl">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6">
                Révisez efficacement les annales de médecine au Maroc.
              </h1>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-200 mb-6 sm:mb-8 max-w-2xl mx-auto">
                Accédez à des milliers de questions corrigées de la 1ère à la 7ème année, avec des explications détaillées par des experts et des outils pour suivre votre progression.
              </p>
              <a href="/login" className="inline-block px-6 sm:px-8 py-3 bg-green-800 text-white text-base sm:text-lg font-semibold rounded-lg hover:bg-green-900 transition-colors">
                Se connecter
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
              Pourquoi choisir LearnFMPA?
            </h2>
            <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto`}>
              Notre plateforme est conçue pour vous aider à exceller dans vos études de médecine grâce à des outils ciblés et un contenu de haute qualité.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            {/* Feature Card 1 */}
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 sm:p-8 lg:p-10 rounded-lg border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group`}>
              <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Contenu Complet</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Accédez aux annales de toutes les facultés de médecine du Maroc, de la 1ère à la 7ème année.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 sm:p-8 lg:p-10 rounded-lg border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group`}>
              <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Explications Détaillées</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Chaque question est accompagnée d'une correction détaillée rédigée par des experts pour une compréhension approfondie.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} p-6 sm:p-8 lg:p-10 rounded-lg border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group`}>
              <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-3`}>Suivi de Progression</h3>
              <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Analysez vos performances, identifiez vos points faibles et suivez vos progrès au fil du temps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className={`py-12 sm:py-16 lg:py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>
            Prêt à commencer votre préparation ?
          </h2>
          <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6 sm:mb-8 max-w-2xl mx-auto`}>
            Inscrivez-vous gratuitement et accédez instantanément à des centaines de questions.
          </p>
          <a href="/signup" className="inline-block px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 bg-green-800 text-white text-base sm:text-lg lg:text-xl font-semibold rounded-lg hover:bg-green-900 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
            Commencer à réviser
          </a>
        </div>
      </section>

      {/* Footer Section */}
      <footer className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8 sm:py-12`}>
        <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} mb-6 sm:mb-8`}></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            <nav className="flex flex-wrap justify-center space-x-4 sm:space-x-8 mb-6 sm:mb-8">
              <a href="#" className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} transition-colors text-sm sm:text-base`}>Features</a>
              <a href="#" className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} transition-colors text-sm sm:text-base`}>Pricing</a>
              <a href="#" className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} transition-colors text-sm sm:text-base`}>Contact</a>
              <a href="#" className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} transition-colors text-sm sm:text-base`}>Terms of Service</a>
            </nav>
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              © 2024 LearnFMPA. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
