'use client';

import { useState } from 'react';
import Link from 'next/link';
import MobileNav from "@/components/MobileNav";
import DesktopNav from "@/components/DesktopNav";
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

const faqCategories = [
  {
    title: 'Général',
    questions: [
      {
        q: "Qu'est-ce que LearnFMPA ?",
        a: "LearnFMPA est une plateforme en ligne conçue pour aider les étudiants en médecine au Maroc à réviser leurs annales d'examen. Elle propose des milliers de questions corrigées avec des explications détaillées, classées par module, faculté et année.",
      },
      {
        q: 'LearnFMPA est-il affilié à la Faculté de Médecine et de Pharmacie d\'Agadir ?',
        a: "Non. LearnFMPA n'est pas affilié, associé ou approuvé par la FMPA. Le contenu est fourni à des fins purement éducatives et ne doit pas être utilisé à des fins médicales, diagnostiques ou thérapeutiques.",
      },
      {
        q: 'À qui s\'adresse LearnFMPA ?',
        a: "LearnFMPA s'adresse aux étudiants en médecine de la 1ère à la 7ème année dans les facultés marocaines. Que vous prépariez un examen de passage ou un concours de résidanat, la plateforme vous accompagne.",
      },
    ],
  },
  {
    title: 'Contenu',
    questions: [
      {
        q: 'Combien de questions sont disponibles sur la plateforme ?',
        a: "La plateforme contient plus de 10 000 questions corrigées couvrant l'ensemble du programme de médecine, de la 1ère à la 7ème année. De nouvelles questions sont ajoutées régulièrement.",
      },
      {
        q: 'Les corrections sont-elles fiables ?',
        a: "Oui. Chaque correction est rédigée et vérifiée par des enseignants et experts. Contrairement aux corrections partagées sur les réseaux sociaux, notre contenu est validé pour garantir la justesse des informations.",
      },
      {
        q: 'Quelles facultés sont couvertes ?',
        a: "LearnFMPA couvre les annales de 6 facultés de médecine au Maroc. Vous pouvez filtrer les questions par faculté pour réviser celles qui vous concernent directement.",
      },
      {
        q: 'Le contenu est-il mis à jour ?',
        a: "Oui, la plateforme est régulièrement mise à jour avec de nouvelles questions et corrections pour rester en phase avec les programmes universitaires.",
      },
    ],
  },
  {
    title: 'Abonnement & Paiement',
    questions: [
      {
        q: 'Combien coûte LearnFMPA ?',
        a: "L'abonnement semestriel coûte 50 MAD et l'abonnement annuel coûte 100 MAD. Cela représente moins de 6 MAD par mois — moins qu'un café par semaine.",
      },
      {
        q: 'Existe-t-il une version gratuite ?',
        a: "Vous pouvez créer un compte gratuitement et explorer la plateforme. L'accès complet à toutes les questions, corrections et fonctionnalités de suivi nécessite un abonnement.",
      },
      {
        q: 'Quels moyens de paiement acceptez-vous ?',
        a: "Nous acceptons les paiements par carte bancaire et les méthodes de paiement locales marocaines. Le processus de paiement est sécurisé et chiffré.",
      },
      {
        q: 'Puis-je annuler mon abonnement ?',
        a: "Oui, vous pouvez annuler votre abonnement à tout moment. L'accès reste actif jusqu'à la fin de la période payée.",
      },
    ],
  },
  {
    title: 'Fonctionnalités',
    questions: [
      {
        q: 'Comment fonctionne le suivi de progression ?',
        a: "La plateforme analyse vos réponses en temps réel et génère des statistiques détaillées : taux de réussite par module, identification de vos lacunes, temps moyen de réponse, et bien plus. Cela vous permet de réviser stratégiquement.",
      },
      {
        q: 'Puis-je utiliser LearnFMPA sur mon téléphone ?',
        a: "Oui, LearnFMPA est entièrement responsive et fonctionne sur téléphone, tablette et ordinateur. Révisez où vous voulez, quand vous voulez.",
      },
      {
        q: 'Puis-je réviser hors ligne ?',
        a: "Actuellement, une connexion internet est nécessaire pour accéder à la plateforme. Nous travaillons sur une fonctionnalité hors ligne pour les prochaines mises à jour.",
      },
    ],
  },
  {
    title: 'Compte & Sécurité',
    questions: [
      {
        q: 'Comment créer un compte ?',
        a: "Cliquez sur « S'inscrire » en haut de la page et remplissez le formulaire d'inscription avec votre email et un mot de passe. L'inscription prend moins d'une minute.",
      },
      {
        q: 'Mes données personnelles sont-elles protégées ?',
        a: "Oui. Nous prenons la protection de vos données très au sérieux. Vos informations personnelles sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers. Consultez notre politique de confidentialité pour plus de détails.",
      },
      {
        q: 'Comment réinitialiser mon mot de passe ?',
        a: "Sur la page de connexion, cliquez sur « Mot de passe oublié » et suivez les instructions. Vous recevrez un email pour réinitialiser votre mot de passe en toute sécurité.",
      },
    ],
  },
];

export default function FAQ() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Questions fréquentes
            </div>

            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 leading-tight`}>
              Vous avez des{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700">
                questions
              </span>
              {' '}?
            </h1>

            <p className={`text-lg sm:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Trouvez les réponses aux questions les plus posées sur LearnFMPA. Si vous ne trouvez pas ce que vous cherchez, n'hésitez pas à nous contacter.
            </p>
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {faqCategories.map((category) => (
              <div key={category.title} className="mb-12">
                <h2 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
                  <div className="w-1.5 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full mr-3"></div>
                  {category.title}
                </h2>

                <div className="space-y-3">
                  {category.questions.map((item, i) => {
                    const id = `${category.title}-${i}`;
                    const isOpen = openItems.has(id);

                    return (
                      <div
                        key={id}
                        className={`rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm overflow-hidden transition-all duration-200`}
                      >
                        <button
                          onClick={() => toggleItem(id)}
                          className={`w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 ${isDarkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'} transition-colors`}
                        >
                          <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} text-base sm:text-lg`}>
                            {item.q}
                          </span>
                          <svg
                            className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <div className={`transition-all duration-200 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                          <div className={`px-5 sm:px-6 pb-5 sm:pb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                            <div className={`pt-0 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                              <p className="pt-4">{item.a}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={`py-20 ${isDarkMode ? 'bg-gradient-to-br from-green-900 via-green-900 to-green-800' : 'bg-gradient-to-br from-green-700 via-green-800 to-green-900'} relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 w-40 h-40 border border-white rounded-full"></div>
            <div className="absolute bottom-10 right-10 w-60 h-60 border border-white rounded-full"></div>
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Vous n'avez pas trouvé votre réponse ?
            </h2>
            <p className="text-lg sm:text-xl text-green-100 mb-10 max-w-2xl mx-auto">
              Contactez-nous directement et nous vous répondrons dans les plus brefs délais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:contact@learnfmpa.com"
                className="inline-flex items-center justify-center px-10 py-5 bg-white text-green-800 text-lg font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Nous contacter
              </a>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-10 py-5 bg-white/10 text-white text-lg font-semibold rounded-xl hover:bg-white/20 transition-all border border-white/20"
              >
                Créer un compte
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
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
              © 2024 LearnFMPA. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
