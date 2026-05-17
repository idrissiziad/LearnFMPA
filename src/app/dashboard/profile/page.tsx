'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function ProfilePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isLoading: authLoading, logout } = useAuth();
  const isDarkMode = theme === 'dark';

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (authLoading || !user) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Chargement...</p>
        </div>
      </div>
    );
  }

  const subscriptionInfo = (() => {
    switch (user.subscription_status) {
      case 'paid':
        return { label: 'Premium', color: 'from-green-500 to-emerald-600', textColor: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', darkBgColor: 'bg-green-900/30', darkBorderColor: 'border-green-700', darkTextColor: 'text-green-400' };
      case 'free':
        return { label: 'Gratuit', color: 'from-blue-500 to-blue-600', textColor: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', darkBgColor: 'bg-blue-900/30', darkBorderColor: 'border-blue-700', darkTextColor: 'text-blue-400' };
      default:
        return { label: 'Inactif', color: 'from-gray-500 to-gray-600', textColor: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', darkBgColor: 'bg-gray-800', darkBorderColor: 'border-gray-700', darkTextColor: 'text-gray-400' };
    }
  })();

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      const token = localStorage.getItem('learnfmpa_token');
      const response = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error || 'Erreur lors de la suppression du compte');
        setIsDeleting(false);
        return;
      }

      localStorage.removeItem('learnfmpa_user');
      localStorage.removeItem('learnfmpa_token');
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('learnfmpa_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      router.push('/login?deleted=1');
    } catch {
      setDeleteError('Erreur réseau. Veuillez réessayer.');
      setIsDeleting(false);
    }
  };

  return (
    <div className={`min-h-screen overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`${isDarkMode ? 'bg-gray-800/95 backdrop-blur-md border-gray-700' : 'bg-white/95 backdrop-blur-md border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <Link href="/dashboard" className="flex items-center min-w-0 group">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center mr-2 sm:mr-3 shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 transition-shadow flex-shrink-0">
                <div className="flex space-x-0.5 sm:space-x-1">
                  <div className="w-0.5 sm:w-1 h-3 sm:h-4 bg-white rounded"></div>
                  <div className="w-0.5 sm:w-1 h-3 sm:h-4 bg-white rounded"></div>
                </div>
              </div>
              <span className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} truncate`}>LearnFMPA</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium text-sm`}>
                Tableau de bord
              </Link>
              <Link href="/modules" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium text-sm`}>
                Modules
              </Link>
              <Link href="/progress" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium text-sm`}>
                Progression
              </Link>
              <Link href="/dashboard/reports" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium text-sm`}>
                Signalements
              </Link>
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <ThemeToggle />
              <button
                onClick={() => logout()}
                className={`hidden sm:flex items-center px-3 py-1.5 rounded-lg transition-all font-medium text-sm ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden lg:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Mon profil
          </h1>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} overflow-hidden mb-6`}>
          <div className={`bg-gradient-to-r ${subscriptionInfo.color} p-6 sm:p-8`}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white truncate">
                  {user.name?.replace(/_/g, ' ') || 'Étudiant'}
                </h2>
                <p className="text-white/80 text-sm sm:text-base truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Nom</label>
                <p className={`mt-1 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user.name?.replace(/_/g, ' ') || '—'}
                </p>
              </div>
              <div>
                <label className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Email</label>
                <p className={`mt-1 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user.email}
                </p>
              </div>
              <div>
                <label className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Année(s)</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(user.years || []).map((year) => (
                    <span key={year} className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      {year}
                    </span>
                  ))}
                  {(!user.years || user.years.length === 0) && (
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>—</span>
                  )}
                </div>
              </div>
              <div>
                <label className={`text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Abonnement</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? subscriptionInfo.darkBgColor : subscriptionInfo.bgColor} ${isDarkMode ? subscriptionInfo.darkBorderColor : subscriptionInfo.borderColor} border ${isDarkMode ? subscriptionInfo.darkTextColor : subscriptionInfo.textColor}`}>
                    {subscriptionInfo.label}
                  </span>
                </div>
              </div>
            </div>

            {user.subscription_status === 'paid' && user.trial_days_left !== null && user.trial_days_left !== undefined && (
              <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-amber-900/20 border-amber-700/50' : 'bg-amber-50 border-amber-200'}`}>
                <div className="flex items-center gap-2">
                  <svg className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                    Essai Premium : {user.trial_days_left} jour{user.trial_days_left !== 1 ? 's' : ''} restant{user.trial_days_left !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            )}

            {user.subscription_status === 'free' && (
              <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-blue-900/20 border-blue-700/50' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center gap-2">
                  <svg className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                    Plan gratuit : 10 explications détaillées par jour, pratique illimitée sans explications.
                  </p>
                </div>
              </div>
            )}

            {user.is_admin && (
              <div className={`rounded-xl p-4 border ${isDarkMode ? 'bg-purple-900/20 border-purple-700/50' : 'bg-purple-50 border-purple-200'}`}>
                <div className="flex items-center gap-2">
                  <svg className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-800'}`}>
                    Compte administrateur
                  </p>
                  <Link
                    href="/dashboard/admin"
                    className={`ml-auto text-xs font-medium px-2.5 py-1 rounded-lg ${isDarkMode ? 'bg-purple-800/50 text-purple-300 hover:bg-purple-700/50' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'} transition-colors`}
                  >
                    Panneau admin
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/progress"
            className={`${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-100 hover:bg-gray-50'} rounded-xl p-5 border shadow-sm transition-all group`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-50'}`}>
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Progression</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Voir vos statistiques</p>
              </div>
              <svg className={`w-5 h-5 ml-auto ${isDarkMode ? 'text-gray-600 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-purple-600'} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          <Link
            href="/dashboard/reports"
            className={`${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-100 hover:bg-gray-50'} rounded-xl p-5 border shadow-sm transition-all group`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50'}`}>
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Signalements</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Voir et voter</p>
              </div>
              <svg className={`w-5 h-5 ml-auto ${isDarkMode ? 'text-gray-600 group-hover:text-gray-400' : 'text-gray-400 group-hover:text-orange-600'} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800 border-red-900/50' : 'bg-white border-red-200'} rounded-2xl shadow-sm border overflow-hidden`}>
          <div className={`p-6 sm:p-8 border-b ${isDarkMode ? 'border-gray-700' : 'border-red-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
                <svg className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Zone dangereuse</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Actions irréversibles pour votre compte
                </p>
              </div>
            </div>
          </div>

          <div className={`p-6 sm:p-8`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              La suppression de votre compte est permanente. Toutes vos données, y compris votre progression et vos réponses, seront définitivement supprimées. Cette action ne peut pas être annulée.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800/50' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Supprimer mon compte
            </button>
          </div>
        </div>
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteModal(false)}></div>
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 sm:p-8`}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'}`}>
                <svg className={`w-8 h-8 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Supprimer définitivement votre compte ?
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Cette action est irréversible. Toutes vos données seront perdues. Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous.
              </p>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Tapez SUPPRIMER pour confirmer"
                disabled={isDeleting}
                className={`w-full px-4 py-3 rounded-xl border text-sm text-center font-medium ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-red-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500'} outline-none transition-colors disabled:opacity-50`}
              />
            </div>

            {deleteError && (
              <div className={`mb-4 p-3 rounded-lg text-sm ${isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50`}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText !== 'SUPPRIMER'}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${deleteConfirmText === 'SUPPRIMER' && !isDeleting ? 'bg-red-600 text-white hover:bg-red-700' : isDarkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'} disabled:opacity-50`}
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Suppression...
                  </span>
                ) : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}