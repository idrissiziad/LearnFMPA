'use client';

import Link from 'next/link';
import { useTheme } from '@/contexts/ThemeContext';
import { ReactNode } from 'react';

interface UpgradePromptProps {
  variant?: 'inline' | 'card' | 'banner';
  title?: string;
  message?: ReactNode;
  dailyCount?: number;
  dailyLimit?: number;
}

export default function UpgradePrompt({ variant = 'card', title, message, dailyCount, dailyLimit }: UpgradePromptProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const defaultTitle = 'Soutenez le projet';
  const defaultMessage = 'Vous avez atteint la limite quotidienne d\'explications gratuites. Soutenez LearnFMPA pour accéder aux explications détaillées illimitées et au suivi de progression complet.';

  const displayTitle = title || defaultTitle;
  const displayMessage = message || defaultMessage;

  if (variant === 'banner') {
    return (
      <div className={`w-full ${isDarkMode ? 'bg-green-900/30 border-green-700/50' : 'bg-green-50 border-green-200'} border-b px-4 py-3`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className={`text-sm ${isDarkMode ? 'text-green-200' : 'text-green-800'}`}>
              {displayMessage}
            </p>
          </div>
          <Link
            href="/pricing"
            className="ml-4 px-4 py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all whitespace-nowrap"
          >
            Soutenir le projet
          </Link>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <Link href="/pricing" className="text-sm font-medium hover:underline">
          Soutenir le projet pour débloquer
        </Link>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-800/80 border-green-800/50' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'} rounded-xl p-6 border text-center`}>
      <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
        {displayTitle}
      </h3>
      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4 leading-relaxed`}>
        {displayMessage}
      </p>
      {dailyCount !== undefined && dailyLimit !== undefined && (
        <p className={`text-xs mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {dailyCount}/{dailyLimit} questions aujourd&apos;hui
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg shadow-green-800/25"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Soutenir le projet
        </Link>
      </div>
    </div>
  );
}