'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import { modules } from '@/data/modules';

interface Comment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
}

interface CommunityReport {
  id: string;
  module_id: number;
  question_id: string;
  user_id: string;
  reason: string;
  question_text: string;
  suggested_correct: number[];
  suggested_incorrect: number[];
  original_correct: number[];
  original_options: string[];
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
  votes: { [user_id: string]: 1 | -1 };
  comments: Comment[];
}

const MODULE_MAP = new Map(modules.map(m => [m.id, m.title]));

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'à l\'instant';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months}mois`;
  return `il y a ${Math.floor(months / 12)}an`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.substring(0, max) + '...';
}

export default function ReportsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const isDarkMode = theme === 'dark';

  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'votes'>('recent');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
  const [moduleFilter, setModuleFilter] = useState<number | 'all'>('all');
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
  const [voting, setVoting] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchReports = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('learnfmpa_token');
      const res = await fetch(`/api/report-community?user_id=${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.status === 401) {
        router.push('/login?kicked=1');
        return;
      }
      const data = await res.json();
      if (data.success) {
        const allReports: CommunityReport[] = [];
        for (const moduleGroup of data.data) {
          for (const report of moduleGroup.reports) {
            allReports.push(report);
          }
        }
        setReports(allReports);
      } else {
        setError(data.error || 'Erreur de chargement');
      }
    } catch {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (user) fetchReports();
  }, [user, fetchReports]);

  const handleVote = async (report: CommunityReport, value: 1 | -1 | 0) => {
    if (!user) return;
    const key = report.id;
    if (voting[key]) return;

    const currentVote: number = report.votes[user.id] || 0;
    const newValue = currentVote === value ? 0 : value;

    setReports(prev => prev.map(r => {
      if (r.id !== report.id) return r;
      const newVotes = { ...r.votes };
      if (newValue === 0) {
        delete newVotes[user.id];
      } else {
        newVotes[user.id] = newValue;
      }
      return { ...r, votes: newVotes };
    }));

    setVoting(prev => ({ ...prev, [key]: true }));
    try {
      const token = localStorage.getItem('learnfmpa_token');
      const res = await fetch('/api/report-community', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          action: 'vote',
          module_id: report.module_id,
          question_id: report.question_id,
          report_id: report.id,
          value: newValue,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setReports(prev => prev.map(r => {
          if (r.id !== report.id) return r;
          const revertVotes = { ...r.votes };
          if (currentVote === 0) {
            delete revertVotes[user.id];
          } else {
            revertVotes[user.id] = currentVote as 1 | -1;
          }
          return { ...r, votes: revertVotes };
        }));
      }
    } catch {
      setReports(prev => prev.map(r => {
        if (r.id !== report.id) return r;
        const revertVotes = { ...r.votes };
        if (currentVote === 0) {
          delete revertVotes[user.id];
        } else {
          revertVotes[user.id] = currentVote as 1 | -1;
        }
        return { ...r, votes: revertVotes };
      }));
    } finally {
      setVoting(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleComment = async (report: CommunityReport) => {
    if (!user) return;
    const text = commentText[report.id]?.trim();
    if (!text) return;
    const key = `comment-${report.id}`;
    if (submitting[key]) return;

    setSubmitting(prev => ({ ...prev, [key]: true }));
    try {
      const token = localStorage.getItem('learnfmpa_token');
      const res = await fetch('/api/report-community', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          action: 'comment',
          module_id: report.module_id,
          question_id: report.question_id,
          report_id: report.id,
          text,
        }),
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setReports(prev => prev.map(r => {
          if (r.id !== report.id) return r;
          return { ...r, comments: [...r.comments, data.comment] };
        }));
        setCommentText(prev => ({ ...prev, [report.id]: '' }));
      }
    } catch {} finally {
      setSubmitting(prev => ({ ...prev, [key]: false }));
    }
  };

  const filteredReports = reports
    .filter(r => statusFilter === 'all' || r.status === statusFilter)
    .filter(r => moduleFilter === 'all' || r.module_id === moduleFilter)
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      const scoreA = Object.values(a.votes).reduce((s, v) => s + v, 0);
      const scoreB = Object.values(b.votes).reduce((s, v) => s + v, 0);
      return scoreB - scoreA;
    });

  const getStatusColor = (status: string) => {
    if (status === 'pending') return isDarkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700';
    if (status === 'resolved') return isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-700';
    return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'pending') return 'En attente';
    if (status === 'resolved') return 'Résolu';
    return 'Rejeté';
  };

  const getAuthenticatedModules = () => {
    const userYears = user?.years || ['3ème année'];
    return modules.filter(m => m.levels.some(l => userYears.includes(l)));
  };

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
              <Link href="/dashboard/reports" className={`${isDarkMode ? 'text-green-400' : 'text-green-600'} font-medium text-sm relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-green-500 after:rounded-full`}>
                Signalements
              </Link>
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Signalements communautaires
          </h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Consultez les signalements de questions, votez et commentez de manière anonyme. Seul votre identifiant utilisateur est visible.
          </p>
        </div>

        <div className={`flex flex-col sm:flex-row gap-3 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex gap-2 flex-1">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'pending' | 'resolved' | 'dismissed')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-green-500`}
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="resolved">Résolus</option>
              <option value="dismissed">Rejetés</option>
            </select>
            <select
              value={moduleFilter === 'all' ? 'all' : String(moduleFilter)}
              onChange={e => setModuleFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className={`flex-1 px-3 py-2 rounded-lg text-sm border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-green-500`}
            >
              <option value="all">Tous les modules</option>
              {getAuthenticatedModules().map(m => (
                <option key={m.id} value={String(m.id)}>{m.title}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === 'recent'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm'
                  : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Récents
            </button>
            <button
              onClick={() => setSortBy('votes')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                sortBy === 'votes'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm'
                  : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Populaires
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Chargement des signalements...</p>
          </div>
        ) : error ? (
          <div className={`rounded-xl p-6 text-center ${isDarkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
            <svg className="w-10 h-10 mx-auto mb-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`font-medium ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            <button onClick={fetchReports} className="mt-3 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Réessayer
            </button>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className={`rounded-xl p-8 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Aucun signalement trouvé</p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {reports.length === 0 ? 'Aucun signalement n\'a été créé pour le moment.' : 'Aucun signalement ne correspond à vos filtres.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map(report => {
              const upvotes = Object.values(report.votes).filter(v => v === 1).length;
              const downvotes = Object.values(report.votes).filter(v => v === -1).length;
              const userVote = user ? (report.votes[user.id] || 0) : 0;
              const isExpanded = expandedReport === report.id;
              const moduleName = MODULE_MAP.get(report.module_id) || `Module ${report.module_id}`;

              return (
                <div
                  key={report.id}
                  className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-xl border shadow-sm overflow-hidden transition-all`}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleVote(report, 1)}
                          disabled={!!voting[report.id]}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all ${
                            userVote === 1
                              ? 'bg-green-500/20 text-green-500'
                              : isDarkMode
                                ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-green-400'
                                : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {upvotes - downvotes}
                        </span>
                        <button
                          onClick={() => handleVote(report, -1)}
                          disabled={!!voting[report.id]}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all ${
                            userVote === -1
                              ? 'bg-red-500/20 text-red-500'
                              : isDarkMode
                                ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-red-400'
                                : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(report.status)}`}>
                            {getStatusLabel(report.status)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                            {moduleName}
                          </span>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {timeAgo(report.created_at)}
                          </span>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            par {report.user_id.slice(0, 16)}...
                          </span>
                        </div>

                        {report.question_text && (
                          <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Question :</span> {truncate(report.question_text, 150)}
                          </p>
                        )}

                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {truncate(report.reason, isExpanded ? Infinity : 200)}
                        </p>

                        {report.status === 'resolved' && report.resolution_note && (
                          <div className={`mt-2 p-2 rounded-lg text-sm ${isDarkMode ? 'bg-green-900/20 text-green-300' : 'bg-green-50 text-green-700'}`}>
                            <span className="font-medium">Note de résolution :</span> {report.resolution_note}
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3">
                          <button
                            onClick={() => setExpandedReport(isExpanded ? null : report.id)}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${
                              isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            {report.comments.length} commentaire{report.comments.length !== 1 ? 's' : ''}
                          </button>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            {upvotes} pour · {downvotes} contre
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className={`${isDarkMode ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-100'} border-t`}>
                      <div className="p-4 sm:p-5 space-y-3">
                        {report.comments.length === 0 && (
                          <p className={`text-sm text-center py-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            Aucun commentaire pour le moment.
                          </p>
                        )}
                        {report.comments.map(comment => (
                          <div key={comment.id} className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                                {comment.user_id.slice(0, 2).toUpperCase()}
                              </div>
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {comment.user_id.slice(0, 16)}...
                              </span>
                              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {timeAgo(comment.created_at)}
                              </span>
                            </div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ml-8`}>
                              {comment.text}
                            </p>
                          </div>
                        ))}

                        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={commentText[report.id] || ''}
                              onChange={e => setCommentText(prev => ({ ...prev, [report.id]: e.target.value }))}
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey && (commentText[report.id] || '').trim()) {
                                  e.preventDefault();
                                  handleComment(report);
                                }
                              }}
                              placeholder="Ajouter un commentaire..."
                              maxLength={500}
                              className={`flex-1 px-3 py-2 text-sm rounded-lg border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-800 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                            />
                            <button
                              onClick={() => handleComment(report)}
                              disabled={!!submitting[`comment-${report.id}`] || !(commentText[report.id] || '').trim()}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                submitting[`comment-${report.id}`] || !(commentText[report.id] || '').trim()
                                  ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm'
                              }`}
                            >
                              {submitting[`comment-${report.id}`] ? '...' : 'Envoyer'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            {filteredReports.length} signalement{filteredReports.length !== 1 ? 's' : ''} affiché{filteredReports.length !== 1 ? 's' : ''}
          </p>
        </div>
      </main>

      <footer className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t py-6 mt-8`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              © 2026 LearnFMPA
            </p>
            <div className="flex space-x-6">
              <a href="/contact" className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}>Contact</a>
              <a href="/faq" className={`text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}>FAQ</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}