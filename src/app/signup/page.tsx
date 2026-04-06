'use client';

import { useTheme } from '@/contexts/ThemeContext';

export default function SignUp() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center p-4`}>
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl mx-auto flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className={`mt-4 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Inscriptions fermées
        </h1>

        <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Contactez l'administrateur pour obtenir un accès.
        </p>

        <a
          href="mailto:admin@learnfmpa.com?subject=Demande d'accès LearnFMPA&body=Bonjour, je souhaite obtenir un accès à LearnFMPA."
          className="mt-6 inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
        >
          Contacter l'administrateur
        </a>

        <p className={`mt-6 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          admin@learnfmpa.com
        </p>
      </div>
    </div>
  );
}
