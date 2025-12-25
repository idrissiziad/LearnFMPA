'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function DesktopNav() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <nav className="hidden lg:flex items-center space-x-8">
      <Link
        href="/"
        className={`text-sm font-medium transition-colors hover:text-blue-600 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}
      >
        Accueil
      </Link>
      <Link
        href="/dashboard"
        className={`text-sm font-medium transition-colors hover:text-blue-600 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}
      >
        Tableau de bord
      </Link>
      <Link
        href="/login"
        className={`text-sm font-medium transition-colors hover:text-blue-600 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}
      >
        Se connecter
      </Link>
      <Link
        href="/signup"
        className="px-5 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-lg hover:bg-green-900 transition-all hover:shadow-lg hover:-translate-y-0.5"
      >
        S'inscrire
      </Link>
    </nav>
  );
}
