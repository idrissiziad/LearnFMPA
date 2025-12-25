'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DesktopNav from "@/components/DesktopNav";
import MobileNav from "@/components/MobileNav";
import ThemeToggle from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

export default function Login() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Login submitted:', formData);
    // Redirect to dashboard after successful login
    router.push('/dashboard');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`fixed top-0 w-full ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-800 rounded-full flex items-center justify-center mr-3">
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-white rounded"></div>
                  <div className="w-1 h-4 bg-white rounded"></div>
                </div>
              </div>
              <span className="text-xl font-bold text-gray-800">LearnFMPA</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6">
              <Link href="/" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors text-sm font-medium hover:text-blue-600`}>
                Accueil
              </Link>
              <Link href="/signup" className="px-5 py-2.5 bg-green-800 text-white text-sm font-semibold rounded-lg hover:bg-green-900 transition-all hover:shadow-lg hover:-translate-y-0.5">
                S'inscrire
              </Link>
              <ThemeToggle />
            </div>
            
            {/* Mobile Navigation */}
            <div className="flex items-center space-x-2 lg:hidden">
              <ThemeToggle />
              <div className="sm:hidden">
                <MobileNav />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16 lg:pt-20 min-h-screen flex">
        {/* Login Form Container */}
        <div className={`w-full max-w-md mx-auto ${isDarkMode ? 'bg-gray-800' : 'bg-white'} flex items-center justify-center p-4 sm:p-6 lg:p-16`}>
          <div className="max-w-md w-full">
            {/* Branding */}
            <div className="text-center mb-6 sm:mb-8 lg:mb-10">
              {/* Icon */}
              <div className={`w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 ${isDarkMode ? 'bg-gray-700' : 'bg-blue-100'} rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4 lg:mb-5`}>
                <svg className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              {/* Logo Text */}
              <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>LearnFMPA</h1>
              
              {/* Tagline */}
              <p className={`text-sm sm:text-base lg:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Révisez. Pratiquez. Réussissez.</p>
            </div>

            {/* Form Header */}
            <div className="mb-6 sm:mb-8 lg:mb-10">
              <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Se connecter</h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 sm:mb-2`}>
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="vous@email.com"
                  className={`w-full px-3 sm:px-4 lg:px-5 py-2 sm:py-3 lg:py-4 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm sm:text-base lg:text-lg hover:border-blue-400`}
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 sm:mb-2`}>
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Entrez votre mot de passe"
                    className={`w-full px-3 sm:px-4 lg:px-5 py-2 sm:py-3 lg:py-4 border ${isDarkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12 text-sm sm:text-base lg:text-lg hover:border-blue-400`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      )}
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="text-right">
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline">
                  Mot de passe oublié ?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-blue-600 text-white font-bold py-2 sm:py-3 lg:py-4 px-4 rounded-lg hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm sm:text-base lg:text-lg"
              >
                Se connecter
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center mt-4 sm:mt-6 lg:mt-8">
              <p className={`text-sm sm:text-base lg:text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Pas encore de compte ?{' '}
                <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                  S'inscrire
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}