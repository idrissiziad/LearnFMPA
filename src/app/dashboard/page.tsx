'use client';

import { useState } from 'react';
import Link from 'next/link';
import { modules } from '@/data/modules';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
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
    <div className="min-h-screen bg-blue-50 flex flex-col">
      {/* Header Section */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-800">LearnFMPA</span>
            </div>
            
            {/* User Account Options */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/profile" className="text-gray-700 hover:text-gray-900 transition-colors text-sm sm:text-base">
                Profil
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm sm:text-base"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-grow">
        {/* Search Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Réussissez vos examens de médecine
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Accédez à des milliers de QCMs d'annales classés par année et par matière.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-full shadow-md border border-gray-200 overflow-hidden">
              <div className="pl-3 sm:pl-4">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une question, une matière..."
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 outline-none text-gray-700 text-sm sm:text-base"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Module Exploration Section */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Explorer par module</h2>
          
          {/* Module Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {modules.map((module) => (
              <Link 
                key={module.id} 
                href={`/modules/${module.id}`}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Thumbnail Image with Gradient */}
                  <div className={`h-24 sm:h-32 bg-gradient-to-br ${module.gradient}`}></div>
                  
                  {/* Module Info */}
                  <div className="p-3 sm:p-4">
                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors text-sm sm:text-base">
                      {module.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
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
      <footer className="bg-white border-t border-gray-200 py-6 sm:py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Footer Links */}
          <div className="flex flex-wrap justify-center space-x-4 sm:space-x-8 mb-4 sm:mb-6">
            <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base">
              Contact
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base">
              FAQ
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base">
              Terms of Service
            </a>
            <a href="#" className="text-gray-600 hover:text-gray-800 transition-colors text-sm sm:text-base">
              Privacy Policy
            </a>
          </div>
          
          {/* Copyright Notice */}
          <div className="text-center">
            <p className="text-xs sm:text-sm text-gray-500">
              © 2024 LearnFMPA. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}