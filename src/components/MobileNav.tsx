'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';

export default function MobileNav() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="sm:hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        aria-expanded="false"
      >
        <span className="sr-only">Open main menu</span>
        {/* Icon when menu is closed */}
        <svg
          className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        {/* Icon when menu is open */}
        <svg
          className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isOpen ? 'block' : 'hidden'} absolute top-16 left-0 right-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-lg z-50 border-b`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}
            onClick={() => setIsOpen(false)}
          >
            Accueil
          </Link>
          <Link
            href="/dashboard"
            className={`block px-3 py-2 rounded-md text-base font-medium ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}
            onClick={() => setIsOpen(false)}
          >
            Tableau de bord
          </Link>
          <Link
            href="/login"
            className={`block px-3 py-2 rounded-md text-base font-medium ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}
            onClick={() => setIsOpen(false)}
          >
            Se connecter
          </Link>
          <Link
            href="/signup"
            className={`block px-3 py-2 rounded-md text-base font-medium ${isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'}`}
            onClick={() => setIsOpen(false)}
          >
            S'inscrire
          </Link>
        </div>
      </div>
    </div>
  );
}