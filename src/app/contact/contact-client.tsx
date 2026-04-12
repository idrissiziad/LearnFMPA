'use client';

import { useState } from 'react';
import Link from 'next/link';
import MobileNav from "@/components/MobileNav";
import DesktopNav from "@/components/DesktopNav";
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function Contact() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:admin@learnfmpa.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(`Nom : ${formData.name}\nEmail : ${formData.email}\n\n${formData.message}`)}`;
    window.location.href = mailtoLink;
    setSubmitted(true);
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Nous contacter
            </div>
            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 leading-tight`}>
              Entrez en{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-700">
                contact
              </span>
            </h1>
            <p className={`text-lg sm:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
              Une question, une suggestion ou un problème ? N&apos;hésitez pas à nous écrire, nous vous répondrons dans les plus brefs délais.
            </p>
          </div>
        </section>

        <section className="pb-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {submitted ? (
                  <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm p-8 sm:p-12 text-center`}>
                    <div className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} flex items-center justify-center mx-auto mb-6`}>
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>Message envoyé !</h3>
                    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Votre client de messagerie a été ouvert avec les informations pré-remplies. Merci de nous avoir contacté !
                    </p>
                  </div>
                ) : (
                  <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm p-8 sm:p-12`}>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-8`}>Envoyez-nous un message</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="name" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Nom</label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-green-500'} focus:ring-2 focus:ring-green-500/20 outline-none transition-colors`}
                            placeholder="Votre nom"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Email</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-green-500'} focus:ring-2 focus:ring-green-500/20 outline-none transition-colors`}
                            placeholder="votre@email.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="subject" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Sujet</label>
                        <select
                          id="subject"
                          name="subject"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500' : 'bg-white border-gray-300 text-gray-900 focus:border-green-500'} focus:ring-2 focus:ring-green-500/20 outline-none transition-colors`}
                        >
                          <option value="">Sélectionnez un sujet</option>
                          <option value="Question générale">Question générale</option>
                          <option value="Problème technique">Problème technique</option>
                          <option value="Abonnement & Paiement">Abonnement & Paiement</option>
                          <option value="Suppression de données">Suppression de données</option>
                          <option value="Suggestion">Suggestion</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="message" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Message</label>
                        <textarea
                          id="message"
                          name="message"
                          required
                          rows={6}
                          value={formData.message}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-green-500'} focus:ring-2 focus:ring-green-500/20 outline-none transition-colors resize-none`}
                          placeholder="Décrivez votre demande..."
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-800/20"
                      >
                        Envoyer le message
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm p-6`}>
                  <div className={`w-12 h-12 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} flex items-center justify-center mb-4`}>
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Email</h3>
                  <a href="mailto:admin@learnfmpa.com" className="text-green-600 hover:text-green-700 transition-colors">
                    admin@learnfmpa.com
                  </a>
                </div>

                <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm p-6`}>
                  <div className={`w-12 h-12 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} flex items-center justify-center mb-4`}>
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Délai de réponse</h3>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
                    Nous nous efforçons de répondre sous 48h ouvrées.
                  </p>
                </div>

                <div className={`rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm p-6`}>
                  <div className={`w-12 h-12 rounded-lg ${isDarkMode ? 'bg-green-900/30' : 'bg-green-100'} flex items-center justify-center mb-4`}>
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>FAQ</h3>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-3`}>
                    Consultez notre FAQ avant de nous contacter, la réponse s&apos;y trouve peut-être.
                  </p>
                  <Link
                    href="/faq"
                    className="text-green-600 hover:text-green-700 font-medium text-sm transition-colors"
                  >
                    Voir la FAQ →
                  </Link>
                </div>
              </div>
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
