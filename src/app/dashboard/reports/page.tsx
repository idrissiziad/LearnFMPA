'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import { modules, getModuleQuestions, Question } from '@/data/modules';

interface Comment {
  id: string;
  user_id: string;
  display_name: string | null;
  text: string;
  created_at: string;
}

interface CommunityReport {
  id: string;
  module_id: number;
  question_id: string;
  question_year: string;
  user_id: string;
  display_name: string | null;
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
  if (seconds < 60) return "à l'instant";
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

function hasGdr(explanation: string): boolean {
  return explanation.toUpperCase().includes('[GDR]') || explanation.toUpperCase().includes('[GDR1]');
}

function hasGdr1(explanation: string): boolean {
  return explanation.toUpperCase().includes('[GDR1]');
}

function stripGdr(explanation: string): string {
  return explanation.replace(/\[GDR1?\]/gi, '').trim();
}

const ADMIN_EMAILS = ['idrissiziad7@gmail.com'];

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const { user, isLoading: authLoading } = useAuth();
  const isDarkMode = theme === 'dark';
  const isAdmin = user ? (ADMIN_EMAILS.includes(user.email.toLowerCase()) || user.is_admin) : false;

  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'votes'>('recent');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('pending');
  const [moduleFilter, setModuleFilter] = useState<number | 'all'>('all');
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);
  const [questionData, setQuestionData] = useState<Question | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [voting, setVoting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveNote, setResolveNote] = useState('');
  const [questionYears, setQuestionYears] = useState<Map<string, string>>(new Map());
  const questionCacheRef = useRef<Map<number, Question[]>>(new Map());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadQuestionYears = useCallback(async () => {
    const yearMap = new Map<string, string>();
    const moduleIdsToLoad = new Set<number>();
    for (const report of reports) {
      if (report.question_year) {
        yearMap.set(`${report.module_id}_${report.question_id}`, report.question_year);
      } else {
        moduleIdsToLoad.add(report.module_id);
      }
    }
    const loadPromises = [...moduleIdsToLoad].map(async (moduleId) => {
      try {
        const questions = await getModuleQuestions(moduleId);
        questionCacheRef.current.set(moduleId, questions);
        for (const q of questions) {
          if (q.year) yearMap.set(`${moduleId}_${q.id}`, q.year);
        }
      } catch {}
    });
    await Promise.all(loadPromises);
    setQuestionYears(yearMap);
  }, [reports]);

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

  useEffect(() => {
    if (reports.length > 0) loadQuestionYears();
  }, [reports, loadQuestionYears]);

  useEffect(() => {
    const paramModuleId = searchParams.get('module_id');
    const paramQuestionId = searchParams.get('question_id');
    if (paramModuleId && paramQuestionId && reports.length > 0 && !selectedReport) {
      const match = reports.find(r => r.module_id === parseInt(paramModuleId) && r.question_id === paramQuestionId);
      if (match) loadQuestionDetail(match);
    }
  }, [searchParams, reports]);

  const loadQuestionDetail = useCallback(async (report: CommunityReport) => {
    setSelectedReport(report);
    setCommentText('');
    const findMatchingQuestion = (questions: Question[]): Question | null => {
      const byId = questions.find(q => q.id === report.question_id) || null;
      if (byId && report.question_text) {
        const storedText = report.question_text.trim().substring(0, 60);
        const liveText = byId.question.trim().substring(0, 60);
        if (storedText === liveText) return byId;
      } else if (byId) {
        return byId;
      }
      if (report.question_text) {
        const storedText = report.question_text.trim().substring(0, 60);
        const byText = questions.find(q => q.question.trim().substring(0, 60) === storedText) || null;
        if (byText) return byText;
      }
      return null;
    };
    const cached = questionCacheRef.current.get(report.module_id);
    if (cached) {
      const q = findMatchingQuestion(cached);
      setQuestionData(q);
      setLoadingQuestion(false);
    } else {
      setLoadingQuestion(true);
      try {
        const questions = await getModuleQuestions(report.module_id);
        questionCacheRef.current.set(report.module_id, questions);
        const q = findMatchingQuestion(questions);
        setQuestionData(q);
      } catch {
        setQuestionData(null);
      } finally {
        setLoadingQuestion(false);
      }
    }
  }, []);

  const handleVote = async (report: CommunityReport, value: 1 | -1 | 0) => {
    if (!user || voting) return;
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

    if (selectedReport?.id === report.id) {
      setSelectedReport(prev => {
        if (!prev) return prev;
        const newVotes = { ...prev.votes };
        if (newValue === 0) {
          delete newVotes[user.id];
        } else {
          newVotes[user.id] = newValue;
        }
        return { ...prev, votes: newVotes };
      });
    }

    setVoting(true);
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
      setVoting(false);
    }
  };

  const handleComment = async () => {
    if (!user || !selectedReport || !commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('learnfmpa_token');
      const res = await fetch('/api/report-community', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          action: 'comment',
          module_id: selectedReport.module_id,
          question_id: selectedReport.question_id,
          report_id: selectedReport.id,
          text: commentText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.comment) {
        const updatedReport = { ...selectedReport, comments: [...selectedReport.comments, data.comment] };
        setSelectedReport(updatedReport);
        setReports(prev => prev.map(r => r.id === selectedReport.id ? updatedReport : r));
        setCommentText('');
      }
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (reportIds: { moduleId: number; questionId: string; reportId: string }[], status: 'resolved' | 'dismissed') => {
    if (!user || resolving) return;
    setResolving(true);
    try {
      const token = localStorage.getItem('learnfmpa_token');
      const results = await Promise.all(
        reportIds.map(({ moduleId, questionId, reportId }) =>
          fetch('/api/report', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              admin_secret: 'learnfmpa2024',
              module_id: moduleId,
              question_id: questionId,
              report_id: reportId,
              status,
              resolution_note: resolveNote || undefined,
            }),
          }).then(r => r.json())
        )
      );
      const allSuccess = results.every(r => r.success);
      if (allSuccess) {
        setReports(prev => prev.map(r => {
          if (selectedReport && r.module_id === selectedReport.module_id && r.question_id === selectedReport.question_id) {
            const match = reportIds.find(ri => ri.reportId === r.id);
            if (match) {
              return {
                ...r,
                status,
                resolved_at: new Date().toISOString(),
                resolution_note: resolveNote || null,
              };
            }
          }
          return r;
        }));
        if (selectedReport) {
          setSelectedReport(prev => {
            if (!prev) return prev;
            const match = reportIds.find(ri => ri.reportId === prev.id);
            if (match) {
              return { ...prev, status, resolved_at: new Date().toISOString(), resolution_note: resolveNote || null };
            }
            return prev;
          });
        }
        setResolveNote('');
      }
    } catch {} finally {
      setResolving(false);
    }
  };

  const filteredReports = reports
    .filter(r => statusFilter === 'all' || r.status === statusFilter)
    .filter(r => moduleFilter === 'all' || r.module_id === moduleFilter)
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      const scoreA = Object.values(a.votes).reduce((s, v) => s + v, 0);
      const scoreB = Object.values(b.votes).reduce((s, v) => s + v, 0);
      return scoreB - scoreA;
    });

  const reportGroups = useMemo(() => {
    const groups = new Map<string, CommunityReport[]>();
    const seen = new Set<string>();
    for (const report of filteredReports) {
      if (seen.has(report.id)) continue;
      seen.add(report.id);
      const year = report.question_year || questionYears.get(`${report.module_id}_${report.question_id}`) || '';
      const textKey = (report.question_text || '').trim().substring(0, 80);
      const key = `${report.module_id}_${report.question_id}_${year}_${textKey}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(report);
    }
    for (const [, group] of groups) {
      group.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    return groups;
  }, [filteredReports, questionYears]);

  const allQuestionReports = useMemo(() => {
    if (!selectedReport) return [];
    const year = selectedReport.question_year || questionYears.get(`${selectedReport.module_id}_${selectedReport.question_id}`) || '';
    const textKey = (selectedReport.question_text || '').trim().substring(0, 80);
    const key = `${selectedReport.module_id}_${selectedReport.question_id}_${year}_${textKey}`;
    return reports.filter(r => {
      const rYear = r.question_year || questionYears.get(`${r.module_id}_${r.question_id}`) || '';
      const rTextKey = (r.question_text || '').trim().substring(0, 80);
      return `${r.module_id}_${r.question_id}_${rYear}_${rTextKey}` === key;
    });
  }, [selectedReport, reports, questionYears]);

  const mergedSuggestions = useMemo(() => {
    const correct = new Set<number>();
    const incorrect = new Set<number>();
    for (const r of allQuestionReports) {
      for (const idx of r.suggested_correct || []) correct.add(idx);
      for (const idx of r.suggested_incorrect || []) incorrect.add(idx);
    }
    return { correct, incorrect };
  }, [allQuestionReports]);

  const getPrimaryReport = (group: CommunityReport[]): CommunityReport => {
    const pending = group.filter(r => r.status === 'pending');
    if (pending.length > 0) return pending[0];
    return group[0];
  };

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
              <Link href="/dashboard/reports" className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium text-sm`}>
                Signalements
              </Link>
              {isAdmin && (
                <Link href="/dashboard/admin" className={`${isDarkMode ? 'text-green-400' : 'text-green-600'} font-medium text-sm relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-0.5 after:bg-green-500 after:rounded-full`}>
                  Admin
                </Link>
              )}
            </nav>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {selectedReport ? (
          <div>
            <button
              onClick={() => { setSelectedReport(null); setQuestionData(null); setCommentText(''); }}
              className={`flex items-center gap-2 mb-4 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour aux signalements
            </button>

            {loadingQuestion ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Chargement de la question...</p>
              </div>
            ) : (
              <>
                <div className={`rounded-xl border overflow-hidden mb-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  <div className={`p-4 sm:p-5 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(allQuestionReports.some(r => r.status === 'pending') ? 'pending' : allQuestionReports.some(r => r.status === 'resolved') ? 'resolved' : 'dismissed')}`}>
                        {getStatusLabel(allQuestionReports.some(r => r.status === 'pending') ? 'pending' : allQuestionReports.some(r => r.status === 'resolved') ? 'resolved' : 'dismissed')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                        {MODULE_MAP.get(selectedReport.module_id) || `Module ${selectedReport.module_id}`}
                      </span>
                      {isAdmin && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${isDarkMode ? 'bg-rose-900/40 text-rose-300' : 'bg-rose-100 text-rose-700'}`}>
                          M{selectedReport.module_id}:Q{selectedReport.question_id}
                        </span>
                      )}
                      {allQuestionReports.length > 1 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                          {allQuestionReports.length} signalements
                        </span>
                      )}
                      {questionData?.year && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-700'}`}>
                          {questionData.year}
                        </span>
                      )}
                      {(questionData?.chapter || selectedReport.question_text) && questionData?.chapter && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                          {questionData.chapter}
                        </span>
                      )}
                      <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {timeAgo(allQuestionReports.reduce((max, r) => new Date(r.created_at) > max ? new Date(r.created_at) : max, new Date(0)).toISOString())}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => handleVote(selectedReport, 1)}
                          disabled={voting}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                            (selectedReport.votes[user.id] || 0) === 1
                              ? 'bg-green-500/20 text-green-500'
                              : isDarkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-green-400' : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {Object.values(selectedReport.votes).filter(v => v === 1).length - Object.values(selectedReport.votes).filter(v => v === -1).length}
                        </span>
                        <button
                          onClick={() => handleVote(selectedReport, -1)}
                          disabled={voting}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                            (selectedReport.votes[user.id] || 0) === -1
                              ? 'bg-red-500/20 text-red-500'
                              : isDarkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-red-400' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {Object.values(selectedReport.votes).filter(v => v === 1).length} pour · {Object.values(selectedReport.votes).filter(v => v === -1).length} contre
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 sm:p-6 ${isDarkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
                    <div className="mb-4">
                      <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Question</h3>
                      <p className={`text-base leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {selectedReport.question_text}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className={`flex items-center gap-2 mt-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-rose-900/20 border border-rose-800/50' : 'bg-rose-50 border border-rose-200'}`}>
                        <svg className="w-4 h-4 flex-shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className={`text-xs font-mono font-medium ${isDarkMode ? 'text-rose-300' : 'text-rose-700'}`}>
                          Admin : module_id={selectedReport.module_id} question_id=&quot;{selectedReport.question_id}&quot; · {allQuestionReports.map(r => r.id).join(', ')}
                        </span>
                      </div>
                    )}

                    {(() => {
                      const questionTextMatches = questionData && selectedReport.question_text && questionData.question.trim().substring(0, 60) === selectedReport.question_text.trim().substring(0, 60);
                      const options = questionTextMatches ? (questionData?.options || selectedReport.original_options || []) : (selectedReport.original_options || questionData?.options || []);
                      const explanations = questionTextMatches ? (questionData?.answerExplanations || []) : [];
                      const origCorrectSet = new Set(questionTextMatches && questionData ? (questionData.correctAnswers || []) : (selectedReport.original_correct || []));
                      const suggestedCorrectSet = mergedSuggestions.correct;
                      const suggestedIncorrectSet = mergedSuggestions.incorrect;

                      return options.length > 0 ? (
                        <div className="space-y-2 mb-4">
                          <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Options de réponse</h3>
                          {options.map((option, idx) => {
                            const letter = String.fromCharCode(65 + idx);
                            const isOriginalCorrect = origCorrectSet.has(idx);
                            const isSuggestedCorrect = suggestedCorrectSet.has(idx);
                            const isSuggestedIncorrect = suggestedIncorrectSet.has(idx);
                            const explanation = explanations[idx] || '';
                            const isGdr = hasGdr(explanation);
                            const isGdr1 = hasGdr1(explanation);
                            const cleanExplanation = stripGdr(explanation);

                            let borderColor = isDarkMode ? 'border-gray-700' : 'border-gray-200';
                            let bgColor = isDarkMode ? 'bg-gray-800' : 'bg-white';

                            if (isOriginalCorrect) {
                              borderColor = isDarkMode ? 'border-blue-500/50' : 'border-blue-300';
                              bgColor = isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50';
                            }
                            if (isSuggestedCorrect) {
                              borderColor = isDarkMode ? 'border-green-500/50' : 'border-green-300';
                              bgColor = isDarkMode ? 'bg-green-900/20' : 'bg-green-50';
                            }
                            if (isSuggestedIncorrect) {
                              borderColor = isDarkMode ? 'border-red-500/50' : 'border-red-300';
                              bgColor = isDarkMode ? 'bg-red-900/20' : 'bg-red-50';
                            }
                            if (isSuggestedCorrect && isOriginalCorrect) {
                              borderColor = isDarkMode ? 'border-emerald-500/70' : 'border-emerald-400';
                              bgColor = isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50';
                            }

                            return (
                              <div
                                key={idx}
                                className={`rounded-lg border-2 ${borderColor} ${bgColor} p-3 transition-all`}
                              >
                                <div className="flex items-start gap-2">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                    isOriginalCorrect
                                      ? isDarkMode ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-200 text-blue-800'
                                      : isGdr && !isGdr1
                                        ? isDarkMode ? 'bg-green-500/30 text-green-300' : 'bg-green-200 text-green-800'
                                        : isGdr1
                                          ? isDarkMode ? 'bg-amber-500/30 text-amber-300' : 'bg-amber-200 text-amber-800'
                                          : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
                                  }`}>
                                    {letter}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                      {option}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                      {isOriginalCorrect && (
                                        <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                          Réponse du site
                                        </span>
                                      )}
{isGdr && !isGdr1 && (
                                           <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-700'}`}>
                                             GDR ✓
                                           </span>
                                         )}
                                        {isGdr1 && (
                                          <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                                            GDR
                                          </span>
                                        )}
                                      {isSuggestedCorrect && !isOriginalCorrect && (
                                        <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                                          Suggestion : correct
                                        </span>
                                      )}
                                      {isSuggestedIncorrect && isOriginalCorrect && (
                                        <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-red-500/20 text-red-300' : 'bg-red-100 text-red-700'}`}>
                                          Suggestion : incorrect
                                        </span>
                                      )}
                                      {isSuggestedCorrect && isOriginalCorrect && (
                                        <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                                          Confirmé par le rapport
                                        </span>
                                      )}
                                    </div>
                                    {cleanExplanation && (
                                      <p className={`text-xs mt-1.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {cleanExplanation}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          <div className={`flex flex-wrap gap-3 mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-3 h-3 rounded border-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-400'} ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}></div>
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Réponse du site</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-3 h-3 rounded ${isDarkMode ? 'bg-green-500/30' : 'bg-green-100'} border-2 ${isDarkMode ? 'border-green-500' : 'border-green-500'}`}></div>
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>GDR ✓ (Grille de réponse correcte)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-3 h-3 rounded ${isDarkMode ? 'bg-amber-500/30' : 'bg-amber-100'} border-2 ${isDarkMode ? 'border-amber-500' : 'border-amber-500'}`}></div>
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>GDR (Grille de réponse)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-3 h-3 rounded border-2 ${isDarkMode ? 'border-emerald-500' : 'border-emerald-400'} ${isDarkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}></div>
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Suggestion correct</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className={`w-3 h-3 rounded border-2 ${isDarkMode ? 'border-red-500' : 'border-red-400'} ${isDarkMode ? 'bg-red-900/30' : 'bg-red-50'}`}></div>
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Suggestion incorrect</span>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}

                    {questionData?.overallExplanation && (
                      <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                        <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Explication générale</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {questionData.overallExplanation}
                        </p>
                      </div>
                    )}

                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-amber-900/20 border border-amber-800/50' : 'bg-amber-50 border border-amber-200'}`}>
                      {allQuestionReports.length === 1 ? (
                        <>
                          <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>Raison du signalement</h3>
                          <p className={`text-sm ${isDarkMode ? 'text-amber-200' : 'text-amber-700'}`}>
                            {selectedReport.reason}
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>Raisons des signalements</h3>
                          <div className="space-y-2">
                            {[...allQuestionReports].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((r, idx) => (
                              <div key={r.id} className={`pl-3 border-l-2 ${isDarkMode ? 'border-amber-700' : 'border-amber-300'}`}>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(r.status)}`}>
                                    {getStatusLabel(r.status)}
                                  </span>
                                  <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {r.display_name || `${r.user_id.slice(0, 8)}...`} · {timeAgo(r.created_at)}
                                  </span>
                                  {r.suggested_correct.length > 0 && (
                                    <span className={`text-xs ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                      +{r.suggested_correct.map(i => String.fromCharCode(65 + i)).join(', ')}
                                    </span>
                                  )}
                                  {r.suggested_incorrect.length > 0 && (
                                    <span className={`text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                                      -{r.suggested_incorrect.map(i => String.fromCharCode(65 + i)).join(', ')}
                                    </span>
                                  )}
                                  {isAdmin && r.status === 'pending' && (
                                    <span className="flex gap-1 ml-auto">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleResolve([{ moduleId: r.module_id, questionId: r.question_id, reportId: r.id }], 'resolved'); }}
                                        disabled={resolving}
                                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${isDarkMode ? 'bg-green-900/50 text-green-300 hover:bg-green-900/70' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                      >
                                        Résoudre
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleResolve([{ moduleId: r.module_id, questionId: r.question_id, reportId: r.id }], 'dismissed'); }}
                                        disabled={resolving}
                                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${isDarkMode ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                                      >
                                        Rejeter
                                      </button>
                                    </span>
                                  )}
                                </div>
                                <p className={`text-sm ${isDarkMode ? 'text-amber-200' : 'text-amber-700'}`}>
                                  {r.reason}
                                </p>
                                {r.status === 'resolved' && r.resolution_note && (
                                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                                    Résolu : {r.resolution_note}
                                  </p>
                                )}
                                {r.status === 'dismissed' && r.resolution_note && (
                                  <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Rejeté : {r.resolution_note}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {allQuestionReports.length === 1 && selectedReport.status === 'resolved' && selectedReport.resolution_note && (
                      <div className={`mt-3 p-4 rounded-lg ${isDarkMode ? 'bg-green-900/20 border border-green-800/50' : 'bg-green-50 border border-green-200'}`}>
                        <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-green-300' : 'text-green-800'}`}>Note de résolution</h3>
                        <p className={`text-sm ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>
                          {selectedReport.resolution_note}
                        </p>
                      </div>
                    )}

                    {isAdmin && allQuestionReports.some(r => r.status === 'pending') && (
                      <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-indigo-900/20 border border-indigo-800/50' : 'bg-indigo-50 border border-indigo-200'}`}>
                        <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>Actions administrateur</h3>
                        <div className="mb-3">
                          <textarea
                            value={resolveNote}
                            onChange={e => setResolveNote(e.target.value)}
                            placeholder="Note de résolution (optionnel)..."
                            maxLength={500}
                            rows={2}
                            className={`w-full px-3 py-2 text-sm rounded-lg border resize-none ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-indigo-200 text-gray-800 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                          />
                        </div>
                        <div className="flex gap-2">
                          {(() => {
                            const pendingReports = allQuestionReports.filter(r => r.status === 'pending');
                            const resolvePayloads = pendingReports.map(r => ({ moduleId: r.module_id, questionId: r.question_id, reportId: r.id }));
                            const allPending = allQuestionReports.every(r => r.status === 'pending');
                            return (
                              <>
                                <button
                                  onClick={() => handleResolve(resolvePayloads, 'resolved')}
                                  disabled={resolving}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    resolving
                                      ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                                      : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm'
                                  }`}
                                >
                                  {resolving ? 'Traitement...' : allPending ? 'Résoudre tout' : `Résoudre (${pendingReports.length} en attente)`}
                                </button>
                                <button
                                  onClick={() => handleResolve(resolvePayloads, 'dismissed')}
                                  disabled={resolving}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    resolving
                                      ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                                      : isDarkMode ? 'bg-red-900/40 text-red-300 hover:bg-red-900/60 border border-red-800/50' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                                  }`}
                                >
                                  {resolving ? 'Traitement...' : allPending ? 'Rejeter tout' : `Rejeter (${pendingReports.length} en attente)`}
                                </button>
                              </>
                            );
                          })()}
                        </div>
                        <p className={`text-xs mt-2 ${isDarkMode ? 'text-indigo-400/70' : 'text-indigo-500'}`}>
                          S'applique aux {allQuestionReports.filter(r => r.status === 'pending').length} signalement{allQuestionReports.filter(r => r.status === 'pending').length !== 1 ? 's' : ''} en attente de cette question.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} overflow-hidden`}>
                  <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {allQuestionReports.reduce((sum, r) => sum + r.comments.length, 0)} commentaire{allQuestionReports.reduce((sum, r) => sum + r.comments.length, 0) !== 1 ? 's' : ''}
                    </h3>
                  </div>

                  <div className="p-4 space-y-3">
                    {allQuestionReports.reduce((sum, r) => sum + r.comments.length, 0) === 0 && (
                      <p className={`text-sm text-center py-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Aucun commentaire pour le moment. Soyez le premier !
                      </p>
                    )}
                    {allQuestionReports
                      .flatMap(r => r.comments.map(c => ({ ...c, _reportId: r.id })))
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                      .map(comment => {
                        const displayName = comment.display_name || `${comment.user_id.slice(0, 12)}...`;
                        return (
                          <div key={comment.id} className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-750' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${comment.display_name ? (isDarkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700') : (isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700')}`}>
                                {comment.display_name ? comment.display_name.slice(0, 2).toUpperCase() : comment.user_id.slice(0, 2).toUpperCase()}
                              </div>
                              <span className={`text-sm font-medium ${comment.display_name ? (isDarkMode ? 'text-green-400' : 'text-green-700') : ''} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {displayName}
                              </span>
                              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {timeAgo(comment.created_at)}
                              </span>
                            </div>
                          <p className={`text-sm ml-9 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {comment.text}
                          </p>
                        </div>
                      );
                    })}

                    <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <textarea
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="Ajouter un commentaire..."
                        maxLength={500}
                        rows={2}
                        className={`w-full px-3 py-2 text-sm rounded-lg border resize-none ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-green-500`}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {commentText.length}/500
                        </span>
                        <button
                          onClick={handleComment}
                          disabled={submitting || !commentText.trim()}
                          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            submitting || !commentText.trim()
                              ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-sm'
                          }`}
                        >
                          {submitting ? 'Envoi...' : 'Commenter'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="mb-6 sm:mb-8">
              <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Signalements communautaires
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Consultez les signalements de questions, votez et commentez de manière anonyme. Cliquez sur un signalement pour voir les détails et la comparaison des réponses.
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
                  {reports.length === 0 ? "Aucun signalement n'a été créé pour le moment." : 'Aucun signalement ne correspond à vos filtres.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...reportGroups.entries()].map(([key, group]) => {
                  const primary = getPrimaryReport(group);
                  const moduleName = MODULE_MAP.get(primary.module_id) || `Module ${primary.module_id}`;
                  const worstStatus = group.some(r => r.status === 'pending') ? 'pending' : group.some(r => r.status === 'resolved') ? 'resolved' : 'dismissed';
                  const totalScore = group.reduce((sum, r) => sum + Object.values(r.votes).reduce((s, v) => s + v, 0), 0);
                  const totalComments = group.reduce((sum, r) => sum + r.comments.length, 0);
                  const origCorrect = primary.original_correct || [];
                  const combinedCorrectSet = new Set(group.flatMap(r => r.suggested_correct || []));
                  const combinedIncorrectSet = new Set(group.flatMap(r => r.suggested_incorrect || []));
                  const suggCorrectCount = [...combinedCorrectSet].filter(i => !origCorrect.includes(i)).length;
                  const suggIncorrectCount = combinedIncorrectSet.size;
                  const origCount = origCorrect.length;
                  const reportYear = questionYears.get(`${primary.module_id}_${primary.question_id}`);
                  const userVote = user ? Math.max(...group.map(r => r.votes[user.id] || 0)) : 0;

                  return (
                    <button
                      key={key}
                      onClick={() => loadQuestionDetail(primary)}
                      className={`w-full text-left ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-100 hover:border-gray-300'} rounded-xl border shadow-sm overflow-hidden transition-all cursor-pointer`}
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-0.5">
                            <svg className={`w-5 h-5 ${userVote === 1 ? 'text-green-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill={userVote === 1 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {totalScore}
                            </span>
                            <svg className={`w-5 h-5 ${userVote === -1 ? 'text-red-500' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill={userVote === -1 ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(worstStatus)}`}>
                                {getStatusLabel(worstStatus)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                                {moduleName}
                              </span>
                              {isAdmin && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${isDarkMode ? 'bg-rose-900/40 text-rose-300' : 'bg-rose-100 text-rose-700'}`}>
                                  M{primary.module_id}:Q{primary.question_id}
                                </span>
                              )}
                              {group.length > 1 && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-amber-900/40 text-amber-300' : 'bg-amber-100 text-amber-700'}`}>
                                  {group.length} signalements
                                </span>
                              )}
                              {reportYear && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-700'}`}>
                                  {reportYear}
                                </span>
                              )}
                              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {timeAgo(primary.created_at)}
                              </span>
                            </div>

                            <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} line-clamp-2 mb-1.5`}>
                              {primary.question_text || primary.reason}
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                              {origCount > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                                  Site : {primary.original_options ? primary.original_correct.map(i => String.fromCharCode(65 + i)).join(', ') : '?'}
                                </span>
                              )}
                              {suggCorrectCount > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700'}`}>
                                  Suggéré +{suggCorrectCount}
                                </span>
                              )}
                              {suggIncorrectCount > 0 && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
                                  Suggéré -{suggIncorrectCount}
                                </span>
                              )}
                              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                {totalComments} commentaire{totalComments !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          <svg className={`w-5 h-5 flex-shrink-0 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-8 text-center">
              <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {reportGroups.size} question{reportGroups.size !== 1 ? 's' : ''} · {filteredReports.length} signalement{filteredReports.length !== 1 ? 's' : ''}
              </p>
            </div>
          </>
        )}
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