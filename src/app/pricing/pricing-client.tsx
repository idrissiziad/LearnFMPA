'use client';

import Link from 'next/link';
import MobileNav from "@/components/MobileNav";
import DesktopNav from "@/components/DesktopNav";
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function Pricing() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const whyDonate = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
        </svg>
      ),
      title: 'Serveurs & infrastructure',
      description: 'L\'hébergement, la base de données, la sécurité et la disponibilité 24h/24 coûtent chaque mois.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      title: 'Contenu vérifié par des experts',
      description: 'Chaque correction est rédigée et vérifiée par des enseignants qualifiés. La qualité a un coût.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      title: 'Mises à jour continues',
      description: 'Nouvelles questions, nouveaux modules, corrections améliorées — la plateforme évolue constamment.',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Application mobile & web',
      description: 'Développement et maintenance d\'une plateforme accessible sur tous les appareils.',
    },
  ];

  const comparisonRows = [
    {
      feature: 'Accès aux annales',
      free: true,
      donor: true,
    },
    {
      feature: 'Questions illimitées',
      free: true,
      donor: true,
    },
    {
      feature: 'Voir les bonnes/mauvaises réponses',
      free: true,
      donor: true,
    },
    {
      feature: '10 explications/jour gratuites',
      free: true,
      donor: true,
    },
    {
      feature: 'Explications détaillées illimitées',
      free: false,
      donor: true,
    },
    {
      feature: 'Corrections vérifiées par des experts',
      free: false,
      donor: true,
    },
    {
      feature: 'Suivi de progression',
      free: false,
      donor: true,
    },
    {
      feature: 'Accessible sur mobile',
      free: true,
      donor: true,
    },
    {
      feature: 'Toujours à jour',
      free: true,
      donor: true,
    },
    {
      feature: 'Gratuit',
      free: true,
      donor: false,
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
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Gardez LearnFMPA en vie
            </div>
            
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 leading-tight`}>
              80% gratuits.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700">
                20% solidaires.
              </span>
            </h1>
            
            <p className={`text-lg sm:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-12 max-w-2xl mx-auto`}>
              LearnFMPA coûte de l&apos;argent à faire tourner. Si 20% d&apos;entre vous contribuent, les 80% restants pourront continuer &agrave; s&apos;entra&icirc;ner gratuitement.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto mb-16">
              <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700">80%</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>pratiquent gratuitement</div>
              </div>
              <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700">20%</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>contribuent &agrave; la plateforme</div>
              </div>
              <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700">100%</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>b&eacute;n&eacute;ficient du contenu</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <div className={`relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl p-8 sm:p-10 max-w-md w-full border-2 border-green-500 overflow-hidden`}>
                <div className="absolute top-0 right-0 bg-gradient-to-l from-green-500 to-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl">
                  SOLIDAIRE
                </div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600"></div>
                <div className="text-center">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>Don semestriel</h3>
                  <div className="flex items-baseline justify-center mb-1">
                    <span className={`text-6xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700`}>50</span>
                    <span className={`text-2xl font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-2`}>MAD</span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>par semestre &middot; 2 semestres par an</p>
                  
                  <div className={`space-y-3 text-left mb-8`}>
                    {[
                      'Vous soutenez la plateforme',
                      '+10 000 questions corrigées',
                      'Explications détaillées illimitées',
                      'Suivi de progression complet',
                      'Corrections vérifiées par des experts',
                      'Accès mobile & desktop',
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
                    Contribuer maintenant
                  </Link>
                </div>
              </div>

              <div className={`relative ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/60'} rounded-3xl p-8 sm:p-10 max-w-md w-full border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} opacity-75`}>
                <div className="text-center">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-2`}>Don annuel</h3>
                  <div className="flex items-baseline justify-center mb-1">
                    <span className={`text-5xl sm:text-6xl font-black ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>100</span>
                    <span className={`text-xl font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} ml-2`}>MAD</span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mb-6`}>par an &middot; soutenir la plateforme pour l&apos;ann&eacute;e</p>
                  
                  <div className={`space-y-3 text-left mb-8`}>
                    {[
                      'Vous soutenez la plateforme',
                      '+10 000 questions corrigées',
                      'Explications détaillées illimitées',
                      'Suivi de progression complet',
                      'Corrections vérifiées par des experts',
                      'Accès mobile & desktop',
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
                    Contribuer maintenant
                  </Link>
                </div>
              </div>
            </div>

            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              50 MAD = ~6 MAD/mois &middot; Le prix d&apos;un caf&eacute; par semaine pour garder la plateforme en vie
            </p>
          </div>
        </section>

        <section className={`py-20 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Pourquoi votre don est indispensable
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
                LearnFMPA n&apos;est pas financ&eacute; par des publicit&eacute;s ni par des investisseurs. Il vit gr&acirc;ce &agrave; vous.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {whyDonate.map((item, i) => (
                <div key={i} className={`group relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border ${isDarkMode ? 'border-green-900/30' : 'border-green-100'}`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-green-500/10 to-transparent rounded-bl-full"></div>
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 text-white shadow-lg shadow-green-500/25">
                      {item.icon}
                    </div>
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                      {item.title}
                    </h3>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm leading-relaxed`}>
                      {item.description}
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
                Le mod&egrave;le solidaire
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
                Votre don d&eacute;bloque des fonctionnalit&eacute;s avanc&eacute;es, et rend l&apos;acc&egrave;s de base gratuit pour tous.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className={`text-center p-8 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'} flex items-center justify-center`}>
                  <svg className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">80%</div>
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mt-2 mb-1`}>Acc&egrave;s gratuit</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Questions, r&eacute;ponses et 10 explications/jour — sans payer
                </div>
              </div>

              <div className={`text-center p-8 rounded-2xl border-2 border-green-500 ${isDarkMode ? 'bg-gray-800 shadow-2xl' : 'bg-white shadow-2xl'}`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} flex items-center justify-center`}>
                  <svg className={`w-8 h-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700">20%</div>
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mt-2 mb-1`}>Don solidaires</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Explications illimit&eacute;es, suivi complet — et la plateforme continue d&apos;exister
                </div>
              </div>

              <div className={`text-center p-8 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'} flex items-center justify-center`}>
                  <svg className={`w-8 h-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-700">100%</div>
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mt-2 mb-1`}>B&eacute;n&eacute;ficient</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Tout le monde gagne : les donateurs ont tout, les autres ont l&apos;essentiel
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={`py-20 ${isDarkMode ? 'bg-gray-800/50' : 'bg-white'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Ce que vous obtenez
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                En contribuant, vous d&eacute;bloquez tout et vous permettez aux autres de profiter de l&apos;essentiel gratuitement.
              </p>
            </div>
            
            <div className={`rounded-2xl overflow-hidden border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} shadow-lg`}>
              <div className="grid grid-cols-3 gap-0">
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} p-4 sm:p-6`}></div>
                <div className={`${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-50'} p-4 sm:p-6 text-center`}>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>Gratuit</span>
                </div>
                <div className={`bg-gradient-to-b ${isDarkMode ? 'from-green-900/50 to-green-800/30' : 'from-green-50 to-green-100'} p-4 sm:p-6 text-center`}>
                  <span className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Donateur</span>
                </div>
              </div>
              
              {comparisonRows.map((row, i) => (
                <div key={i} className={`grid grid-cols-3 gap-0 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <div className={`p-4 sm:p-5 ${i % 2 === 0 ? (isDarkMode ? 'bg-gray-800/30' : 'bg-gray-50/50') : ''}`}>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>{row.feature}</span>
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
                    {row.donor ? (
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
                50 MAD, &ccedil;a repr&eacute;sente quoi ?
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Le prix de petites choses ordinaires pour un impact extraordinaire.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { emoji: '☕', label: '3 cafés', sublabel: 'au café' },
                { emoji: '🥤', label: '5 jus', sublabel: 'à la fac' },
                { emoji: '📱', label: '1/4 du crédit', sublabel: 'téléphone mensuel' },
                { emoji: '❤️', label: '1 semestre', sublabel: 'de plateforme en vie' },
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
              Soyez parmi les 20%
            </h2>
            <p className="text-lg sm:text-xl text-green-100 mb-10 max-w-2xl mx-auto">
              Votre contribution de 50 MAD par semestre permet &agrave; des milliers d&apos;&eacute;tudiants de r&eacute;viser gratuitement. Sans vous, la plateforme dispara&icirc;t.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="inline-flex items-center justify-center px-10 py-5 bg-white text-green-800 text-lg font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                Contribuer &agrave; 50 MAD
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </Link>
              <Link href="/" className="inline-flex items-center justify-center px-10 py-5 bg-white/10 text-white text-lg font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20">
                Explorer gratuitement
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
              &copy; 2026 LearnFMPA. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}