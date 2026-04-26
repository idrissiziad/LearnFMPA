'use client';

import Link from 'next/link';
import MobileNav from "@/components/MobileNav";
import DesktopNav from "@/components/DesktopNav";
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function Pricing() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const paperProblems = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      title: 'Chercher les examens pendant des heures',
      description: 'Vous passez plus de temps à chercher les annales sur WhatsApp, Facebook et les groupes qu\'à réviser réellement.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      title: 'Réponses incorrectes non vérifiées',
      description: 'Les corrections partagées sont souvent fausses, rédigées par des étudiants et non par des experts. Vous apprenez des erreurs.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Temps perdu à organiser au lieu d\'apprendre',
      description: 'Trier, classer et organiser des centaines de PDF et photos prend un temps précieux que vous pourriez consacrer à la révision.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Aucun suivi de progression',
      description: 'Impossible de savoir quels modules vous maîtrisez et où sont vos lacunes. Vous révisez à l\'aveugle.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      title: 'Contenu incomplet et obsolète',
      description: 'Les annales partagées manquent souvent de questions, les images sont illisibles, et certains modules sont tout simplement absents.',
    },
  ];

  const platformAdvantages = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Tout est déjà organisé',
      description: 'Accédez instantanément à +10 000 questions classées par module, faculté et année. Zéro temps perdu à chercher.',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Corrections vérifiées par des experts',
      description: 'Chaque réponse est corrigée et vérifiée par des enseignants. Apprenez juste du premier coup.',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Suivi de progression intelligent',
      description: 'Visualisez vos forces et lacunes en temps réel. Révisez stratégiquement, pas au hasard.',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Étudiez partout, tout le temps',
      description: 'Sur téléphone, tablette ou PC. Dans le bus, à la fac ou chez vous. Vos annales sont toujours avec vous.',
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: 'Explications détaillées',
      description: 'Pas seulement la bonne réponse — comprenez pourquoi. Chaque question inclut une explication complète pour un apprentissage profond.',
    },
  ];

  const comparisonRows = [
    {
      feature: 'Accès aux annales',
      paper: false,
      platform: true,
      free: true,
      paid: true,
    },
    {
      feature: 'Questions illimitées',
      paper: false,
      platform: true,
      free: true,
      paid: true,
    },
    {
      feature: 'Voir les bonnes/mauvaises réponses',
      paper: false,
      platform: true,
      free: true,
      paid: true,
    },
    {
      feature: '10 explications/jour gratuites',
      paper: false,
      platform: true,
      free: true,
      paid: true,
    },
    {
      feature: 'Explications détaillées illimitées',
      paper: false,
      platform: true,
      free: false,
      paid: true,
    },
    {
      feature: 'Corrections vérifiées par des experts',
      paper: false,
      platform: true,
      free: false,
      paid: true,
    },
    {
      feature: 'Suivi de progression',
      paper: false,
      platform: true,
      free: false,
      paid: true,
    },
    {
      feature: 'Accessible sur mobile',
      paper: false,
      platform: true,
      free: true,
      paid: true,
    },
    {
      feature: 'Toujours à jour',
      paper: false,
      platform: true,
      free: true,
      paid: true,
    },
    {
      feature: 'Gratuit',
      paper: true,
      platform: false,
      free: true,
      paid: false,
    },
  ];

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

      <main className="pt-16">
        <section className="relative py-20 sm:py-28 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-600/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-full ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'} text-sm font-medium mb-6`}>
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              Investissez dans votre réussite
            </div>
            
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 leading-tight`}>
              Un semestre de réussite pour{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700">
                50 MAD
              </span>
            </h1>
            
            <p className={`text-lg sm:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-12 max-w-2xl mx-auto`}>
              Moins qu\'un café par semaine pour accéder à tout ce dont vous avez besoin pour réussir vos examens.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <div className={`relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full border-2 border-green-500 overflow-hidden`}>
                <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                  POPULAIRE
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600"></div>
                <div className="text-center">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Semestriel</h3>
                  <div className="flex items-baseline justify-center mb-1">
                    <span className={`text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700`}>50</span>
                    <span className={`text-2xl font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-2`}>MAD</span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>par semestre &middot; 2 semestres par an</p>
                  
                  <div className={`space-y-3 text-left mb-8`}>
                    {[
                      '+10 000 questions corrigées',
                      'Toutes les facultés & années',
                      'Explications détaillées',
                      'Suivi de progression',
                      'Accès mobile & desktop',
                      'Mises à jour incluses',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/signup" className="block w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white text-lg font-bold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-800/25 hover:shadow-xl hover:-translate-y-0.5">
                    Commencer maintenant
                  </Link>
                </div>
              </div>

              <div className={`relative ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/60'} rounded-3xl p-8 sm:p-10 max-w-md w-full border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} opacity-75`}>
                <div className="text-center">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Annuel</h3>
                  <div className="flex items-baseline justify-center mb-1">
                    <span className={`text-5xl sm:text-6xl font-black ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>100</span>
                    <span className={`text-xl font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} ml-2`}>MAD</span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-6`}>par an &middot; économisez en payant d\'un coup</p>
                  
                  <div className={`space-y-3 text-left mb-8`}>
                    {[
                      '+10 000 questions corrigées',
                      'Toutes les facultés & années',
                      'Explications détaillées',
                      'Suivi de progression',
                      'Accès mobile & desktop',
                      'Mises à jour incluses',
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center">
                        <div className={`w-5 h-5 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} rounded-full flex items-center justify-center mr-3 flex-shrink-0`}>
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'} text-sm`}>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link href="/signup" className={`block w-full py-4 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} text-lg font-bold rounded-xl transition-all hover:-translate-y-0.5`}>
                    Commencer maintenant
                  </Link>
                </div>
              </div>
            </div>

            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              50 MAD = ~6 MAD/mois &middot; Moins qu\'un café par semaine
            </p>
          </div>
        </section>

        <section className={`py-20 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Pourquoi les annales papier vous coûtent plus cher
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
                La méthode traditionnelle n\'est pas seulement gratuite — elle a un coût caché bien plus élevé.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paperProblems.map((problem, i) => (
                <div key={i} className={`group relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border ${isDarkMode ? 'border-red-900/30' : 'border-red-100'}`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full"></div>
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-red-500/25">
                      {problem.icon}
                    </div>
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                      {problem.title}
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm leading-relaxed`}>
                      {problem.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                LearnFMPA change tout
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
                Concentrez-vous sur ce qui compte : apprendre et réussir.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platformAdvantages.map((adv, i) => (
                <div key={i} className={`group relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border ${isDarkMode ? 'border-green-900/30' : 'border-green-100'}`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full"></div>
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-green-500/25">
                      {adv.icon}
                    </div>
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                      {adv.title}
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm leading-relaxed`}>
                      {adv.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`py-20 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Comparaison directe
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Voyez la différence par vous-même.
              </p>
            </div>
            
            <div className={`rounded-2xl overflow-hidden border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} shadow-lg`}>
              <div className="grid grid-cols-4 gap-0">
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} p-4 sm:p-6`}></div>
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} p-4 sm:p-6 text-center`}>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Annales papier</span>
                </div>
                <div className={`${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} p-4 sm:p-6 text-center`}>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Gratuit</span>
                </div>
                <div className={`bg-gradient-to-b ${isDarkMode ? 'from-green-900/50 to-green-800/30' : 'from-green-50 to-green-100'} p-4 sm:p-6 text-center`}>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Complet</span>
                </div>
              </div>
              
              {comparisonRows.map((row, i) => (
                <div key={i} className={`grid grid-cols-4 gap-0 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className={`p-4 sm:p-5 ${i % 2 === 0 ? (isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50/50') : ''}`}>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>{row.feature}</span>
                  </div>
                  <div className={`p-4 sm:p-5 flex items-center justify-center ${i % 2 === 0 ? (isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50/50') : ''}`}>
                    {row.paper ? (
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className={`p-4 sm:p-5 flex items-center justify-center ${i % 2 === 0 ? (isDarkMode ? 'bg-blue-900/10' : 'bg-blue-50/50') : ''}`}>
                    {row.free ? (
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className={`p-4 sm:p-5 flex items-center justify-center ${i % 2 === 0 ? (isDarkMode ? 'bg-green-900/10' : 'bg-green-50/30') : ''}`}>
                    {row.paid ? (
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>50 MAD</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`py-16 ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                50 MAD en perspective
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Ce que 50 MAD représente vraiment.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { emoji: '☕', label: '3 cafés', sublabel: 'au café' },
                { emoji: '🥤', label: '5 jus', sublabel: 'à la fac' },
                { emoji: '📱', label: '1/4 du crédit', sublabel: 'téléphone mensuel' },
                { emoji: '📚', label: '1 semestre', sublabel: 'de réussite assurée' },
              ].map((item, i) => (
                <div key={i} className={`text-center p-6 rounded-2xl ${i === 3 ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl shadow-green-500/25 scale-105' : isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                  <div className="text-3xl mb-3">{item.emoji}</div>
                  <div className={`text-lg font-bold ${i === 3 ? 'text-white' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.label}</div>
                  <div className={`text-sm ${i === 3 ? 'text-green-100' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.sublabel}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`py-20 ${isDarkMode ? 'bg-gradient-to-br from-green-900 via-green-900 to-green-800' : 'bg-gradient-to-br from-green-700 via-green-800 to-green-900'} relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-40 h-40 border border-white rounded-full"></div>
            <div className="absolute bottom-10 right-10 w-60 h-60 border border-white rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white rounded-full"></div>
          </div>
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Arrêtez de chercher. Commencez à apprendre.
            </h2>
            <p className="text-lg sm:text-xl text-green-100 mb-10 max-w-2xl mx-auto">
              Pour seulement 50 MAD par semestre, rejoignez des milliers d\'étudiants qui ont choisi la méthode intelligente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="inline-flex items-center justify-center px-10 py-5 bg-white text-green-800 text-lg font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                Commencer pour 50 MAD
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/" className="inline-flex items-center justify-center px-10 py-5 bg-white/10 text-white text-lg font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20">
                En savoir plus
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} py-12`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center mr-2">
                <div className="flex space-x-0.5">
                  <div className="w-0.5 h-3 bg-white rounded"></div>
                  <div className="w-0.5 h-3 bg-white rounded"></div>
                </div>
              </div>
              <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>LearnFMPA</span>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              © 2026 LearnFMPA. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
