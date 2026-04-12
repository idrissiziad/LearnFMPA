'use client';

import Link from 'next/link';
import MobileNav from "@/components/MobileNav";
import DesktopNav from "@/components/DesktopNav";
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

const sections = [
  {
    title: '1. Collecte des données',
    content: `LearnFMPA collecte uniquement les données strictement nécessaires au fonctionnement de la Plateforme, à savoir : votre adresse électronique (e-mail), votre nom d'utilisateur, et les informations relatives à votre abonnement. Aucune autre donnée personnelle n'est collectée.`,
  },
  {
    title: '2. Utilisation des données',
    content: `Vos données personnelles sont utilisées exclusivement pour : la création et la gestion de votre compte, l'accès aux fonctionnalités de la Plateforme, l'envoi de communications liées à votre abonnement (confirmations, rappels d'expiration). Vos données ne sont en aucun cas utilisées à des fins publicitaires, commerciales ou statistiques non essentielles au service.`,
  },
  {
    title: '3. Non-commercialisation des données',
    content: `LearnFMPA s'engage formellement à ne pas vendre, louer, échanger ou partager vos données personnelles avec des tiers, quelles que soient les circonstances. Vos données restent la propriété exclusive de la Plateforme et ne font l'objet d'aucune monétisation.`,
  },
  {
    title: '4. Suppression des données à l\'expiration de l\'abonnement',
    content: `Conformément à notre engagement de protection de la vie privée, toutes vos données personnelles seront automatiquement supprimées à la date d'expiration de votre abonnement. Cette suppression inclut : votre adresse électronique, votre nom d'utilisateur, votre historique de progression et toute autre donnée associée à votre compte. Après suppression, vos données ne pourront être récupérées. Si vous souhaitez conserver votre compte, il vous appartient de renouveler votre abonnement avant sa date d'expiration.`,
  },
  {
    title: '5. Sécurité des données',
    content: `LearnFMPA met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, toute modification, divulgation ou destruction illicite. Malgré ces précautions, aucune méthode de transmission sur Internet n'est totalement sécurisée, et nous ne pouvons garantir une sécurité absolue.`,
  },
  {
    title: '6. Cookies',
    content: `La Plateforme peut utiliser des cookies techniques nécessaires à son bon fonctionnement (authentification, session). Aucun cookie de traçage ou publicitaire n'est utilisé. Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela pourrait affecter le fonctionnement de la Plateforme.`,
  },
  {
    title: '7. Vos droits',
    content: `Conformément à la législation en vigueur, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, veuillez nous contacter via la page de contact. Vous pouvez également demander la suppression anticipée de votre compte et de vos données à tout moment.`,
  },
  {
    title: '8. Modifications de la politique',
    content: `Le créateur se réserve le droit de modifier la présente politique de confidentialité à tout moment. Les modifications prennent effet dès leur publication sur la Plateforme. Il est de votre responsabilité de consulter régulièrement cette page. L'utilisation continue de la Plateforme après la publication de modifications constitue une acceptation de celles-ci.`,
  },
  {
    title: '9. Contact',
    content: `Pour toute question relative à la présente politique de confidentialité, vous pouvez nous contacter via la page de contact dédiée ou par courrier électronique à l'adresse contact@learnfmpa.com.`,
  },
];

export default function Privacy() {
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

      <main className="pt-16">
        <section className="relative py-20 sm:py-28 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-green-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-full ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'} text-sm font-medium mb-6`}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Protection des données
            </div>
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 leading-tight`}>
              Politique de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700">
                confidentialité
              </span>
            </h1>
            <p className={`text-lg sm:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Nous prenons la protection de vos données personnelles très au sérieux. Cette politique explique comment nous les gérons.
            </p>
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {sections.map((section) => (
              <div key={section.title} className="mb-10">
                <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                  <div className="w-1.5 h-7 bg-gradient-to-b from-green-500 to-green-600 rounded-full mr-3"></div>
                  {section.title}
                </h2>
                <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm p-6 sm:p-8`}>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                    {section.content}
                  </p>
                </div>
              </div>
            ))}

            <div className={`rounded-xl border ${isDarkMode ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'} p-6 sm:p-8 mt-8`}>
              <p className={`${isDarkMode ? 'text-green-300' : 'text-green-700'} text-sm leading-relaxed`}>
                Dernière mise à jour : Janvier 2025. Pour toute question concernant cette politique, veuillez nous contacter via la <Link href="/contact" className="underline font-semibold hover:opacity-80">page de contact</Link>.
              </p>
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
