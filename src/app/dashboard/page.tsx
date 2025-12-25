'use client';

import { useState } from 'react';
import Link from 'next/link';
import { modules, moduleQuestionsCache, moduleChaptersCache, preloadModuleData } from '@/data/modules';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import DesktopNavDashboard from '@/components/DesktopNavDashboard';

export default function Dashboard() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // Implement search functionality here
  };

  const handleLogout = () => {
    console.log('Logging out...');
    // Implement logout functionality here
    // Redirect to login page after logout
    router.push('/login');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-blue-50'} flex flex-col`}>
      {/* Header Section */}
      <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xl lg:text-2xl font-bold text-gray-800">LearnFMPA</span>
            </div>
            
            {/* Desktop Navigation - Only show on large screens */}
            <div className="hidden lg:flex items-center space-x-6">
              <DesktopNavDashboard />
            </div>
            
            {/* User Account Options */}
            <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6">
              <Link
                href="/profile"
                className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'} transition-colors text-sm sm:text-base font-medium hover:text-blue-600`}
              >
                Profil
              </Link>
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className={`px-3 sm:px-4 lg:px-5 py-2 rounded-lg transition-all font-medium text-sm sm:text-base hover:shadow-md ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:-translate-y-0.5'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300 hover:-translate-y-0.5'
                }`}
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 flex-grow">
        {/* Search Section */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4 lg:mb-6`}>
            Réussissez vos examens de médecine
          </h1>
          <p className={`text-base sm:text-lg lg:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6 sm:mb-8 lg:mb-10 max-w-2xl lg:max-w-3xl mx-auto`}>
            Accédez à des milliers de QCMs d'annales classés par année et par matière.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl lg:max-w-3xl mx-auto">
            <div className={`flex items-center rounded-full shadow-lg border overflow-hidden hover:shadow-xl transition-shadow ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="pl-3 sm:pl-4">
                <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une question, une matière..."
                className={`flex-1 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 outline-none text-sm sm:text-base lg:text-lg ${
                  isDarkMode ? 'text-gray-300 bg-gray-800' : 'text-gray-700 bg-white'
                }`}
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 hover:bg-blue-700 transition-all font-medium text-sm sm:text-base lg:text-lg hover:shadow-md"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Module Exploration Section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6 sm:mb-8 lg:mb-10`}>Explorer par module</h2>
          
          {/* Module Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
            {modules.map((module) => (
              <Link
                key={module.id}
                href={`/modules/${module.id}`}
                className="group cursor-pointer"
                onMouseEnter={() => {
                  // Only prefetch if not already cached to reduce edge requests
                  if (!moduleQuestionsCache.has(module.id) || !moduleChaptersCache.has(module.id)) {
                    preloadModuleData(module.id);
                  }
                }}
              >
                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer group`}>
                  {/* Thumbnail Image with Gradient */}
                  <div className={`h-24 sm:h-32 lg:h-40 bg-gradient-to-br ${module.gradient}`}></div>
                  
                  {/* Module Info */}
                  <div className="p-3 sm:p-4 lg:p-5">
                    <h3 className={`font-bold mb-1 group-hover:text-blue-600 transition-colors text-sm sm:text-base lg:text-lg ${
                      isDarkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>
                      {module.title}
                    </h3>
                    <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {module.subtitle}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <footer className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t py-6 sm:py-8 mt-auto`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Footer Links */}
          <div className="flex flex-wrap justify-center space-x-4 sm:space-x-8 mb-4 sm:mb-6">
            <a href="#" className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} transition-colors text-sm sm:text-base`}>
              Contact
            </a>
            <a href="#" className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} transition-colors text-sm sm:text-base`}>
              FAQ
            </a>
            <a href="#" className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} transition-colors text-sm sm:text-base`}>
              Terms of Service
            </a>
            <a href="#" className={`${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'} transition-colors text-sm sm:text-base`}>
              Privacy Policy
            </a>
          </div>
          
          {/* Copyright Notice */}
          <div className="text-center">
            <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              © 2024 LearnFMPA. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}