'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { modules, getModuleQuestions, Question } from '@/data/modules';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import UpgradePrompt from '@/components/UpgradePrompt';

interface ChapterProgress {
  name: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  blank: number;
}

interface ModuleProgressDetail {
  totalQuestions: number;
  correct: number;
  wrong: number;
  blank: number;
  chapters: ChapterProgress[];
  chaptersWithMistakes: ChapterProgress[];
}

export default function ProgressPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user, isLoading: authLoading, logout, getAllProgress, invalidateProgressCache, clearProgressAndStats } = useAuth();
  const isFreeUser = user?.subscription_status === 'free';
  const isDarkMode = theme === 'dark';
  const [progress, setProgress] = useState<{ [key: string]: any }>({});
  const [moduleData, setModuleData] = useState<{ [moduleId: number]: Question[] }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadProgress = async () => {
      if (user) {
        if (isFreeUser) {
          const localProgress: { [key: string]: any } = {};
          if (typeof window !== 'undefined') {
            for (const module of modules) {
              const storageKey = `learnfmpa_answered_${module.id}`;
              const stored = localStorage.getItem(storageKey);
              if (stored) {
                try {
                  const parsed = JSON.parse(stored);
                  const moduleProgress: { [key: string]: any } = {};
                  Object.entries(parsed).forEach(([key, value]: [string, any]) => {
                    moduleProgress[key.replace(`${module.id}_`, '')] = { is_correct: value, answered_at: new Date().toISOString() };
                  });
                  if (Object.keys(moduleProgress).length > 0) {
                    localProgress[`module_${module.id}`] = moduleProgress;
                  }
                } catch {}
              }
            }
          }
          setProgress(localProgress);

          const data: { [moduleId: number]: Question[] } = {};
          for (const module of modules) {
            const moduleKey = `module_${module.id}`;
            if (localProgress[moduleKey] && Object.keys(localProgress[moduleKey]).length > 0) {
              const questions = await getModuleQuestions(module.id);
              data[module.id] = questions;
            }
          }
          setModuleData(data);
          setIsLoading(false);
        } else {
          const allProgress = await getAllProgress();
          setProgress(allProgress);

          const data: { [moduleId: number]: Question[] } = {};
          for (const module of modules) {
            const moduleKey = `module_${module.id}`;
            if (allProgress[moduleKey] && Object.keys(allProgress[moduleKey]).length > 0) {
              const questions = await getModuleQuestions(module.id);
              data[module.id] = questions;
            }
          }
          setModuleData(data);
          setIsLoading(false);
        }
      }
    };
    loadProgress();
  }, [user, getAllProgress, isFreeUser]);

  const handleLogout = () => {
    logout();
  };

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const getModuleProgressDetail = (moduleId: number): ModuleProgressDetail => {
    const moduleKey = `module_${moduleId}`;
    const moduleProgress = progress[moduleKey] || {};
    const questions = moduleData[moduleId];

    if (!questions) {
      return { totalQuestions: 0, correct: 0, wrong: 0, blank: 0, chapters: [], chaptersWithMistakes: [] };
    }

    const totalQuestions = questions.length;
    const chapterMap: { [name: string]: { total: number; correct: number; wrong: number } } = {};

    questions.forEach((question) => {
      const chapterName = question.chapter || 'Non classé';
      if (!chapterMap[chapterName]) {
        chapterMap[chapterName] = { total: 0, correct: 0, wrong: 0 };
      }
      chapterMap[chapterName].total++;

      const answer = moduleProgress[question.id];
      if (answer) {
        if (answer.is_correct) {
          chapterMap[chapterName].correct++;
        } else {
          chapterMap[chapterName].wrong++;
        }
      }
    });

    let correct = 0;
    let wrong = 0;
    Object.values(chapterMap).forEach(c => {
      correct += c.correct;
      wrong += c.wrong;
    });
    const blank = totalQuestions - correct - wrong;

    const chapterProgress: ChapterProgress[] = Object.entries(chapterMap).map(([name, data]) => ({
      name,
      totalQuestions: data.total,
      correct: data.correct,
      wrong: data.wrong,
      blank: data.total - data.correct - data.wrong
    }));

    chapterProgress.sort((a, b) => {
      if (a.wrong > 0 && b.wrong === 0) return -1;
      if (a.wrong === 0 && b.wrong > 0) return 1;
      return b.wrong - a.wrong;
    });

    const chaptersWithMistakes = chapterProgress.filter(c => c.wrong > 0);

    return { totalQuestions, correct, wrong, blank, chapters: chapterProgress, chaptersWithMistakes };
  };

  const allModuleDetails = modules
    .map(m => ({ module: m, detail: getModuleProgressDetail(m.id) }))
    .filter(({ detail }) => detail.totalQuestions > 0);

  const grandTotal = allModuleDetails.reduce((s, { detail }) => s + detail.totalQuestions, 0);
  const grandCorrect = allModuleDetails.reduce((s, { detail }) => s + detail.correct, 0);
  const grandWrong = allModuleDetails.reduce((s, { detail }) => s + detail.wrong, 0);
  const grandBlank = allModuleDetails.reduce((s, { detail }) => s + detail.blank, 0);

  const totalAnswered = grandCorrect + grandWrong;
  const overallRate = totalAnswered > 0 ? Math.round((grandCorrect / totalAnswered) * 100) : 0;

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
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <header className={`${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border-gray-700' : 'bg-white/95 backdrop-blur-sm border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-green-800/20">
                <div className="flex space-x-1">
                  <div className="w-1 h-4 bg-white rounded"></div>
                  <div className="w-1 h-4 bg-white rounded"></div>
                </div>
              </div>
              <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>LearnFMPA</span>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium`}>
                Tableau de bord
              </Link>
              <Link href="/modules" className={`${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-800'} transition-colors font-medium`}>
                Modules
              </Link>
              <span className={`${isDarkMode ? 'text-green-400' : 'text-green-600'} font-medium`}>
                Progression
              </span>
            </nav>

            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <button
                onClick={handleLogout}
                className={`hidden sm:flex items-center px-4 py-2 rounded-xl transition-all font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Ma Progression
          </h1>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Suivez vos performances et identifiez vos points à améliorer.
          </p>
          {isFreeUser && (
            <div className="mt-4">
              <UpgradePrompt
                variant="card"
                title="Suivi complet avec la version complète"
                message="Soutenez LearnFMPA pour accéder au suivi de progression détaillé, aux explications et aux questions illimitées."
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Chargement de votre progression...</p>
          </div>
        ) : totalAnswered === 0 ? (
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} p-12 text-center`}>
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              Aucune progression enregistrée
            </h3>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
              Commencez à répondre aux questions pour voir votre progression.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all"
            >
              Explorer les modules
            </Link>
          </div>
        ) : (
          <>
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} mb-8`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Vue d&apos;ensemble
                </h2>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {overallRate}% de réussite
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {grandTotal} questions disponibles
                </span>
              </div>

              <div className={`w-full h-5 rounded-full overflow-hidden flex ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                {grandCorrect > 0 && (
                  <div
                    className="bg-green-500 transition-all duration-500"
                    style={{ width: `${(grandCorrect / grandTotal) * 100}%` }}
                    title={`${grandCorrect} correctes`}
                  />
                )}
                {grandWrong > 0 && (
                  <div
                    className="bg-red-500 transition-all duration-500"
                    style={{ width: `${(grandWrong / grandTotal) * 100}%` }}
                    title={`${grandWrong} incorrectes`}
                  />
                )}
                {grandBlank > 0 && (
                  <div
                    className={isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}
                    style={{ width: `${(grandBlank / grandTotal) * 100}%` }}
                    title={`${grandBlank} non répondues`}
                  />
                )}
              </div>

              <div className="flex items-center gap-6 mt-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="font-semibold text-green-500">{grandCorrect}</span> correctes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="font-semibold text-red-500">{grandWrong}</span> incorrectes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className={`font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{grandBlank}</span> non répondues
                  </span>
                </div>
              </div>
            </div>

            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} overflow-hidden`}>
              <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Progression par module
                </h2>
              </div>

              <div className="divide-y divide-gray-100">
                {allModuleDetails.map(({ module, detail }) => {
                  const isExpanded = expandedModules.has(module.id);
                  const correctPct = detail.totalQuestions > 0 ? (detail.correct / detail.totalQuestions) * 100 : 0;
                  const wrongPct = detail.totalQuestions > 0 ? (detail.wrong / detail.totalQuestions) * 100 : 0;
                  const blankPct = detail.totalQuestions > 0 ? (detail.blank / detail.totalQuestions) * 100 : 0;
                  const hasMistakes = detail.chaptersWithMistakes.length > 0;

                  return (
                    <div key={module.id}>
                      <div
                        className={`p-6 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                        onClick={() => toggleModule(module.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${module.gradient} flex items-center justify-center shrink-0`}>
                              <span className="text-white font-bold text-lg">{module.title.charAt(0)}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                                  {module.title}
                                </h3>
                                {hasMistakes && (
                                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                    {detail.chaptersWithMistakes.length} chapitre{detail.chaptersWithMistakes.length > 1 ? 's' : ''} avec erreurs
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {detail.totalQuestions} questions disponibles
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-5 shrink-0 ml-4">
                            <div className="hidden sm:block w-40">
                              <div className={`w-full h-3 rounded-full overflow-hidden flex ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                {correctPct > 0 && (
                                  <div className="bg-green-500 h-full" style={{ width: `${correctPct}%` }} />
                                )}
                                {wrongPct > 0 && (
                                  <div className="bg-red-500 h-full" style={{ width: `${wrongPct}%` }} />
                                )}
                                {blankPct > 0 && (
                                  <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} h-full`} style={{ width: `${blankPct}%` }} />
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-sm">
                              <span className="font-semibold text-green-500">{detail.correct}</span>
                              <span className="font-semibold text-red-500">{detail.wrong}</span>
                              <span className={`font-semibold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{detail.blank}</span>
                            </div>

                            <svg
                              className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        <div className="sm:hidden mt-3">
                          <div className={`w-full h-3 rounded-full overflow-hidden flex ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            {correctPct > 0 && (
                              <div className="bg-green-500 h-full" style={{ width: `${correctPct}%` }} />
                            )}
                            {wrongPct > 0 && (
                              <div className="bg-red-500 h-full" style={{ width: `${wrongPct}%` }} />
                            )}
                            {blankPct > 0 && (
                              <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} h-full`} style={{ width: `${blankPct}%` }} />
                            )}
                          </div>
                        </div>

                        <div className="sm:hidden flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                            <span className="text-xs text-green-500 font-medium">{detail.correct}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <span className="text-xs text-red-500 font-medium">{detail.wrong}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
                            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{detail.blank}</span>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'} px-6 pb-6`}>
                          <div className={`pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}></div>

                          {hasMistakes && (
                            <div className="mt-4 mb-4">
                              <div className="flex items-center gap-2 mb-3">
                                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <h4 className="text-sm font-semibold text-red-500">
                                  Chapitres avec erreurs
                                </h4>
                              </div>
                              <div className="space-y-2">
                                {detail.chaptersWithMistakes.map((chapter) => {
                                  const cPct = (chapter.correct / chapter.totalQuestions) * 100;
                                  const wPct = (chapter.wrong / chapter.totalQuestions) * 100;
                                  const bPct = (chapter.blank / chapter.totalQuestions) * 100;

                                  return (
                                    <Link
                                      key={chapter.name}
                                      href={`/modules/${module.id}`}
                                      className={`block rounded-lg p-3 transition-colors ${isDarkMode ? 'bg-red-900/20 hover:bg-red-900/30 border border-red-800/30' : 'bg-red-50 hover:bg-red-100 border border-red-200'}`}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm font-medium ${isDarkMode ? 'text-red-300' : 'text-red-800'} truncate`}>
                                          {chapter.name}
                                        </span>
                                        <span className="text-xs font-semibold text-red-500 shrink-0 ml-2">
                                          {chapter.wrong} erreur{chapter.wrong > 1 ? 's' : ''}
                                        </span>
                                      </div>
                                      <div className={`w-full h-2 rounded-full overflow-hidden flex ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        {cPct > 0 && <div className="bg-green-500 h-full" style={{ width: `${cPct}%` }} />}
                                        {wPct > 0 && <div className="bg-red-500 h-full" style={{ width: `${wPct}%` }} />}
                                        {bPct > 0 && <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} h-full`} style={{ width: `${bPct}%` }} />}
                                      </div>
                                      <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-xs text-green-500 font-medium">{chapter.correct} correctes</span>
                                        <span className="text-xs text-red-500 font-medium">{chapter.wrong} incorrectes</span>
                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{chapter.blank} non répondues</span>
                                      </div>
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          <div className="mt-4">
                            <h4 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              Tous les chapitres
                            </h4>
                            <div className="space-y-1.5">
                              {detail.chapters.map((chapter) => {
                                const cPct = (chapter.correct / chapter.totalQuestions) * 100;
                                const wPct = (chapter.wrong / chapter.totalQuestions) * 100;
                                const bPct = (chapter.blank / chapter.totalQuestions) * 100;
                                const hasError = chapter.wrong > 0;

                                return (
                                  <Link
                                    key={chapter.name}
                                    href={`/modules/${module.id}`}
                                    className={`block rounded-lg p-3 transition-colors ${hasError
                                      ? isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
                                      : isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className={`text-sm ${hasError ? 'font-medium' : ''} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} truncate`}>
                                        {chapter.name}
                                      </span>
                                      <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <span className="text-xs text-green-500 font-medium">{chapter.correct}</span>
                                        <span className="text-xs text-red-500 font-medium">{chapter.wrong}</span>
                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{chapter.blank}</span>
                                      </div>
                                    </div>
                                    <div className={`w-full h-1.5 rounded-full overflow-hidden flex ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                      {cPct > 0 && <div className="bg-green-500 h-full" style={{ width: `${cPct}%` }} />}
                                      {wPct > 0 && <div className="bg-red-500 h-full" style={{ width: `${wPct}%` }} />}
                                      {bPct > 0 && <div className={`${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'} h-full`} style={{ width: `${bPct}%` }} />}
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t flex justify-between items-center" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Correctes</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Incorrectes</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className={`w-3 h-3 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`}></div>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Non répondues</span>
                              </div>
                            </div>
                            <Link
                              href={`/modules/${module.id}`}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all"
                            >
                              Pratiquer
                              <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {totalAnswered > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={async () => {
                if (confirm('Êtes-vous sûr de vouloir réinitialiser toute votre progression ?')) {
                  try {
                    const token = localStorage.getItem('learnfmpa_token');
                    await fetch(`/api/progress?user_id=${user.id}`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    clearProgressAndStats();
                    for (let i = localStorage.length - 1; i >= 0; i--) {
                      const key = localStorage.key(i);
                      if (key?.startsWith('learnfmpa_answered_')) {
                        localStorage.removeItem(key);
                      }
                    }
                    setProgress({});
                    setModuleData({});
                  } catch (error) {
                    console.error('Failed to reset progress:', error);
                  }
                }
              }}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${isDarkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
            >
              Réinitialiser ma progression
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
