'use client';

import Link from 'next/link';
import MobileNav from "@/components/MobileNav";
import DesktopNav from "@/components/DesktopNav";
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

const sections = [
  {
    title: '1. Objet',
    content: `Les présentes conditions d'utilisation (ci-après « Conditions ») régissent l'accès et l'utilisation de la plateforme LearnFMPA (ci-après « la Plateforme »). En accédant à la Plateforme, vous acceptez sans réserve les présentes Conditions. Si vous n'acceptez pas ces Conditions, veuillez ne pas utiliser la Plateforme.`,
  },
  {
    title: '2. Respect du travail du créateur',
    content: `LearnFMPA est le fruit d'un travail considérable en termes de temps, d'effort et de dévouement. Chaque question, correction et explication a été rédigée, vérifiée et mise en forme avec soin pour offrir un outil de qualité aux étudiants en médecine. Nous demandons à chaque utilisateur de respecter ce travail et de ne pas : copier, reproduire, distribuer, revendre ou partager de quelque manière que ce soit le contenu de la Plateforme sans autorisation écrite préalable. Toute utilisation non autorisée du contenu constitue une violation des droits de propriété intellectuelle du créateur.`,
  },
  {
    title: '3. Compte utilisateur',
    content: `L'utilisation de certaines fonctionnalités de la Plateforme nécessite la création d'un compte. Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toutes les activités réalisées sous votre compte. Vous vous engagez à fournir des informations exactes lors de votre inscription et à les mettre à jour en cas de changement.`,
  },
  {
    title: '4. Utilisation acceptable',
    content: `Vous vous engagez à utiliser la Plateforme de manière responsable et respectueuse. Sont notamment interdits : l'utilisation de la Plateforme à des fins illégales ou non autorisées, la tentative d'accéder aux comptes d'autres utilisateurs, l'utilisation de robots ou de scripts pour extraire le contenu, le contournement des mesures de sécurité mises en place, toute action visant à surcharger ou perturber le fonctionnement de la Plateforme.`,
  },
  {
    title: '5. Propriété intellectuelle',
    content: `L'ensemble du contenu de la Plateforme — incluant mais non limité aux textes, questions, corrections, explications, graphismes, logos et éléments de design — est la propriété exclusive du créateur de LearnFMPA. Toute reproduction, représentation, modification ou distribution, même partielle, est strictement interdite sans autorisation écrite préalable.`,
  },
  {
    title: '6. Limitation de responsabilité',
    content: `La Plateforme est fournie « en l'état » sans garantie d'aucune sorte. Le créateur ne saurait être tenu responsable des dommages directs ou indirects résultant de l'utilisation ou de l'impossibilité d'utiliser la Plateforme. Le contenu est fourni à des fins purement éducatives et ne doit pas être utilisé à des fins médicales, diagnostiques ou thérapeutiques.`,
  },
  {
    title: '7. Modifications des Conditions',
    content: `Le créateur se réserve le droit de modifier les présentes Conditions à tout moment. Les modifications prennent effet dès leur publication sur la Plateforme. Il est de votre responsabilité de consulter régulièrement les Conditions. L'utilisation continue de la Plateforme après la publication de modifications constitue une acceptation de celles-ci.`,
  },
  {
    title: '8. Résiliation',
    content: `Le créateur se réserve le droit de suspendre ou de résilier votre accès à la Plateforme en cas de non-respect des présentes Conditions, sans préavis ni indemnité.`,
  },
  {
    title: '9. Droit applicable',
    content: `Les présentes Conditions sont régies par le droit marocain. En cas de litige, les tribunaux compétents du Royaume du Maroc seront seuls compétents pour connaître du différend.`,
  },
];

export default function Terms() {
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Mentions légales
            </div>
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 leading-tight`}>
              Conditions{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700">
                d&apos;utilisation
              </span>
            </h1>
            <p className={`text-lg sm:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Veuillez lire attentivement les présentes conditions avant d&apos;utiliser la plateforme LearnFMPA.
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
                Dernière mise à jour : Janvier 2025. Pour toute question concernant ces conditions, veuillez nous contacter via la <Link href="/contact" className="underline font-semibold hover:opacity-80">page de contact</Link>.
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
              © 2024 LearnFMPA. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
