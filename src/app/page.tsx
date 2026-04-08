'use client';

import MobileNav from "@/components/MobileNav";
import DesktopNav from "@/components/DesktopNav";
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function Home() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const stats = [
    { number: '10 000+', label: 'Questions' },
    { number: '7', label: 'Années couvertes' },
    { number: '6', label: 'Facultés' },
    { number: '95%', label: 'Taux de satisfaction' },
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`fixed top-0 w-full ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border-gray-700' : 'bg-white/95 backdrop-blur-sm border-gray-200'} border-b z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-green-800/20">
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-white rounded"></div>
                  <div className="w-1 h-4 bg-white rounded"></div>
                </div>
              </div>
              <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>LearnFMPA</span>
            </div>
            
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

      <section className="relative mt-16 overflow-hidden">
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} pointer-events-none`}></div>
        
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-green-500/5 to-transparent rounded-full pointer-events-none"></div>
        
        <div className="relative h-[85vh] min-h-[600px] max-h-[900px] flex items-center z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="text-center lg:text-left relative z-20">
                <div className={`inline-flex items-center px-4 py-2 rounded-full ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'} text-sm font-medium mb-6`}>
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                  Plateforme #1 pour les étudiants en médecine
                </div>
                
                <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 leading-tight`}>
                  Révisez{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700">
                    intelligemment
                  </span>{' '}
                  vos annales de médecine
                </h1>
                
                <p className={`text-lg sm:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-8 max-w-xl mx-auto lg:mx-0`}>
                  Accédez à des milliers de questions corrigées de la 1ère à la 7ème année, avec des explications détaillées et un suivi personnalisé de votre progression.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start relative z-30">
                  <a href="/login" className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white text-lg font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-800/25 hover:shadow-xl hover:shadow-green-800/30 hover:-translate-y-0.5 cursor-pointer">
                    Commencer gratuitement
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                  <a href="/login" className={`inline-flex items-center justify-center px-8 py-4 ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50'} text-lg font-semibold rounded-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} transition-all hover:-translate-y-0.5 cursor-pointer`}>
                    Se connecter
                  </a>
                </div>
              </div>
              
              <div className="hidden lg:block relative z-10">
                <div className="relative w-full max-w-lg mx-auto">
                  <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-green-900/40 to-green-800/20' : 'bg-gradient-to-br from-green-100 to-green-50'} rounded-3xl transform rotate-3`}></div>
                  <div className={`relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl p-6 transform -rotate-1`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Module: Cardiologie</span>
                    </div>
                    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
                      <p className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'} font-medium`}>
                        Quels sont les signes cliniques d'une insuffisance cardiaque gauche ?
                      </p>
                    </div>
                    <div className="space-y-2">
                      {['A. Dyspnée d\'effort', 'B. Œdème des membres inférieurs', 'C. Toux nocturne', 'D. Orthopnée'].map((option, i) => (
                        <div key={i} className={`flex items-center p-3 rounded-lg ${i === 0 || i === 2 || i === 3 ? (isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200') : (isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200')}`}>
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${i === 0 || i === 2 || i === 3 ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                            {(i === 0 || i === 2 || i === 3) && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{option}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className={`absolute bottom-0 left-0 right-0 h-24 ${isDarkMode ? 'bg-gradient-to-t from-gray-900' : 'bg-gradient-to-t from-gray-50'}`}></div>
      </section>

      <section className={`py-16 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700 mb-2">
                  {stat.number}
                </div>
                <div className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Pourquoi choisir LearnFMPA ?
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Une plateforme complète conçue pour maximiser votre réussite aux examens de médecine.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`group relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/25">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Contenu exhaustif
                </h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                  Accédez aux annales de toutes les facultés de médecine du Maroc, couvrant l'intégralité du programme de la 1ère à la 7ème année.
                </p>
              </div>
            </div>

            <div className={`group relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/25">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Corrections expertes
                </h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                  Chaque question est accompagnée d'une correction détaillée rédigée par des enseignants et experts pour une compréhension approfondie.
                </p>
              </div>
            </div>

            <div className={`group relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/25">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                  Suivi personnalisé
                </h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                  Analysez vos performances, identifiez vos lacunes et suivez votre progression avec des statistiques détaillées.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`py-20 ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-green-700 via-green-800 to-green-900'} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 border border-white rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-60 h-60 border border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white rounded-full"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Prêt à exceller dans vos études ?
          </h2>
          <p className="text-lg sm:text-xl text-green-100 mb-10 max-w-2xl mx-auto">
            Rejoignez des milliers d'étudiants qui utilisent LearnFMPA pour réussir leurs examens de médecine.
          </p>
          <a href="/login" className="inline-flex items-center justify-center px-10 py-5 bg-white text-green-800 text-lg font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 cursor-pointer relative z-20">
            Commencer gratuitement
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </section>

      <footer className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} py-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center mr-3">
                  <div className="flex space-x-1">
                    <div className="w-1 h-4 bg-white rounded"></div>
                    <div className="w-1 h-4 bg-white rounded"></div>
                  </div>
                </div>
                <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>LearnFMPA</span>
              </div>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} max-w-sm`}>
                La plateforme de référence pour la révision des annales de médecine au Maroc.
              </p>
            </div>
            
             <div>
               <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Navigation</h4>
               <ul className="space-y-2">
                 <li><a href="/login" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>Connexion</a></li>
                 <li><a href="/signup" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>Inscription</a></li>
                 <li><a href="/pricing" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>Tarifs</a></li>
                 <li><a href="/dashboard" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>Tableau de bord</a></li>
               </ul>
             </div>
            
            <div>
              <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-4`}>Légal</h4>
              <ul className="space-y-2">
                <li><a href="#" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>Conditions d'utilisation</a></li>
                <li><a href="#" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>Politique de confidentialité</a></li>
                <li><a href="#" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}>Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className={`border-t ${isDarkMode ? 'border-gray-800' : 'border-gray-200'} pt-8 flex flex-col sm:flex-row justify-between items-center`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              © 2024 LearnFMPA. Tous droits réservés.
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-2 sm:mt-0`}>
              Fait avec ♥ pour les étudiants en médecine
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
