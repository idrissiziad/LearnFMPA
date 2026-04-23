'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MobileNav from "@/components/MobileNav";
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const VALID_YEARS = [
  '1ère année',
  '2ème année',
  '3ème année',
  '4ème année',
  '5ème année',
  '6ème année',
];

export default function SignUp() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const router = useRouter();
  const { login } = useAuth();

  const [signupOpen, setSignupOpen] = useState<boolean | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    year: '3ème année',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetch('/api/auth/signup-status')
      .then(res => res.json())
      .then(data => {
        setSignupOpen(data.signup_open === true);
        setLoadingStatus(false);
      })
      .catch(() => {
        setSignupOpen(false);
        setLoadingStatus(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          year: formData.year,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue lors de l\'inscription.');
        setIsLoading(false);
        return;
      }

      setSuccess(true);

      const loginResult = await login(formData.email, formData.password);
      if (loginResult.success) {
        router.push('/dashboard');
      } else {
        setIsLoading(false);
      }
    } catch {
      setError('Erreur réseau. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="flex items-center gap-3">
          <svg className="animate-spin w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Chargement...</span>
        </div>
      </div>
    );
  }

  if (signupOpen === false) {
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
                <Link href="/" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium`}>
                  Accueil
                </Link>
                <Link href="/login" className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-800/25 hover:shadow-xl hover:-translate-y-0.5">
                  Se connecter
                </Link>
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

        <div className="pt-16 min-h-screen flex">
          <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
            <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-green-700 via-green-800 to-green-900'}`}></div>

            <div className="absolute top-20 left-20 w-64 h-64 bg-green-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-green-600/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl"></div>

            <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
              <div className="max-w-lg">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>

                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                  Inscriptions fermées temporairement
                </h1>
                <p className="text-lg text-green-100 mb-10">
                  Nous préparons la meilleure expérience possible. En attendant, contactez l&apos;administrateur pour obtenir un accès anticipé.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span>Réponse sous 24-48h ouvrées</span>
                  </div>
                  <div className="flex items-center text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <span>Accès sécurisé et personnalisé</span>
                  </div>
                  <div className="flex items-center text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span>Activation rapide de votre compte</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
            <div className="w-full max-w-md">
              <div className="lg:hidden text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Révisez. Pratiquez. Réussissez.</p>
              </div>

              <div className="mb-8">
                <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Créer un compte
                </h2>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Les inscriptions sont actuellement fermées
                </p>
              </div>

              <div className={`${isDarkMode ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200'} border rounded-xl p-5 mb-6`}>
                <div className="flex items-start gap-3">
                  <svg className={`w-6 h-6 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className={`font-semibold ${isDarkMode ? 'text-amber-300' : 'text-amber-800'} mb-1`}>Inscriptions suspendues</p>
                    <p className={`text-sm ${isDarkMode ? 'text-amber-200/80' : 'text-amber-700'} leading-relaxed`}>
                      Les inscriptions sur LearnFMPA sont actuellement fermées. Pour obtenir un accès, veuillez contacter l&apos;administrateur.
                    </p>
                  </div>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-6 mb-6`}>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-5`}>
                  Contacter l&apos;administrateur
                </h3>

                <div className="space-y-4">
                  <a
                    href="mailto:admin@learnfmpa.com"
                    className={`flex items-center w-full px-5 py-4 ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700 border-gray-600' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'} border rounded-xl transition-all group`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 shadow-md shadow-green-600/20">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Adresse e-mail</p>
                      <p className={`font-medium ${isDarkMode ? 'text-white group-hover:text-green-400' : 'text-gray-800 group-hover:text-green-600'} transition-colors`}>
                        admin@learnfmpa.com
                      </p>
                    </div>
                    <svg className={`w-5 h-5 ml-auto ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} group-hover:translate-x-1 transition-transform`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>

                  <div className={`flex items-center px-5 py-3 rounded-xl ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                    <svg className={`w-5 h-5 mr-3 flex-shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Réponse sous 24-48h ouvrées
                    </span>
                  </div>
                </div>
              </div>

              <p className={`text-sm text-center mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Merci de votre intérêt pour LearnFMPA. Nous vous répondrons dans les plus brefs délais.
              </p>

              <Link
                href="/"
                className="flex items-center justify-center w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-800/25 hover:shadow-xl hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour à l&apos;accueil
              </Link>

              <div className="mt-8 text-center">
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Déjà un compte ?{' '}
                  <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold">
                    Se connecter
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <Link href="/" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium`}>
                Accueil
              </Link>
              <Link href="/login" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium`}>
                Se connecter
              </Link>
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

      <div className="pt-16 min-h-screen flex">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-green-700 via-green-800 to-green-900'}`}></div>

          <div className="absolute top-20 left-20 w-64 h-64 bg-green-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-green-600/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-emerald-400/10 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
            <div className="max-w-lg">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Essai gratuit de 7 jours
              </h1>
              <p className="text-lg text-green-100 mb-8">
                Créez votre compte et accédez immédiatement à toutes les questions corrigées pendant 7 jours. Aucune carte bancaire requise.
              </p>

              <div className="space-y-4">
                <div className="flex items-center text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>+10 000 questions corrigées</span>
                </div>
                <div className="flex items-center text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Suivi de progression détaillé</span>
                </div>
                <div className="flex items-center text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Aucune carte bancaire requise</span>
                </div>
                <div className="flex items-center text-white">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Accès complet à toutes les fonctionnalités</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Essai gratuit de 7 jours</p>
            </div>

            <div className="mb-8">
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Créer un compte
              </h2>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Commencez votre essai gratuit de 7 jours
              </p>
            </div>

            <div className={`${isDarkMode ? 'bg-green-900/20 border-green-700/50' : 'bg-green-50 border-green-200'} border rounded-xl p-4 mb-6`}>
              <div className="flex items-start gap-3">
                <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className={`text-sm ${isDarkMode ? 'text-green-200/80' : 'text-green-700'}`}>
                  Votre essai de 7 jours commence immédiatement après l&apos;inscription. Vous aurez accès à toutes les fonctionnalités.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-xl text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Compte créé avec succès ! Connexion en cours...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Nom complet
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Votre nom complet"
                    className={`w-full pl-12 pr-4 py-3.5 border ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all`}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Adresse e-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.41a.5.5 0 01-1 0V9a.5.5 0 011 0v6.01" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="vous@exemple.com"
                    className={`w-full pl-12 pr-4 py-3.5 border ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all`}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="year" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Année d&apos;étude
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <select
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3.5 border ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white' : 'border-gray-200 bg-white text-gray-900'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all appearance-none`}
                  >
                    {VALID_YEARS.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 caractères"
                    className={`w-full pl-12 pr-12 py-3.5 border ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all`}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirmez votre mot de passe"
                    className={`w-full pl-12 pr-12 py-3.5 border ${isDarkMode ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500' : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all`}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showConfirmPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-xl font-semibold transition-all ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg shadow-green-800/25 hover:shadow-xl hover:-translate-y-0.5'} focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création du compte...
                  </span>
                ) : (
                  'Commencer l\'essai gratuit'
                )}
              </button>
            </form>

            <p className={`text-xs text-center mt-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              En créant un compte, vous acceptez nos{' '}
              <Link href="/terms" className="text-green-600 hover:text-green-700 underline">conditions d&apos;utilisation</Link>
              {' '}et notre{' '}
              <Link href="/privacy" className="text-green-600 hover:text-green-700 underline">politique de confidentialité</Link>.
            </p>

            <div className="mt-8 text-center">
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Déjà un compte ?{' '}
                <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}