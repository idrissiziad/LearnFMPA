'use client';

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getModuleById, getModuleQuestions, getModuleChapters, preloadModuleData, Question, Chapter, JsonQuestion, extractChaptersFromQuestions } from '@/data/modules';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import UpgradePrompt from '@/components/UpgradePrompt';
import ImageViewer, { MODULE_IMAGE_CONFIGS, extractPageFromImagePath } from '@/components/ImageViewer';
import TutorialOverlay, { MODULE_TUTORIAL_STEPS, shouldShowModuleTutorial } from '@/components/TutorialOverlay';
const ChapterNavigation = lazy(() => import('@/components/ChapterNavigation'));
const Warp = lazy(() => import('@paper-design/shaders-react').then(mod => ({ default: mod.Warp })));
const GrainGradient = lazy(() => import('@paper-design/shaders-react').then(mod => ({ default: mod.GrainGradient })));

export interface ExtendedQuestion extends Question {
  isMultipleChoice: boolean;
  correctAnswers: number[];
  answerExplanations: string[];
  overallExplanation: string;
  questionImage?: string;
  optionImages?: string[];
}

export default function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const { user, isLoading: authLoading, submitAnswer, getProgress, invalidateProgressCache, clearProgressAndStats, flushAnswers } = useAuth();
  const isDarkMode = theme === 'dark';
  const isFreeUser = user?.subscription_status === 'free';
  const FREE_DAILY_LIMIT = 200;
  const FREE_DISPLAY_LIMIT = 10;
  const FREE_DAILY_WINDOW_MS = 24 * 60 * 60 * 1000;

  const initialFreeAnswersCount = (() => {
    if (!user) return 0;
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`learnfmpa_free_cache_${user.id}`);
        if (cached) {
          const { count, resetTime } = JSON.parse(cached);
          if (resetTime && Date.now() - resetTime >= FREE_DAILY_WINDOW_MS) {
            localStorage.removeItem(`learnfmpa_free_cache_${user.id}`);
          } else {
            return count || 0;
          }
        }
      } catch {}
    }
    const resetTime = user.daily_answer_reset ? new Date(user.daily_answer_reset).getTime() : 0;
    if (resetTime && Date.now() - resetTime >= FREE_DAILY_WINDOW_MS) {
      return 0;
    }
    return user.daily_answer_count || 0;
  })();

  const [freeAnswersCount, setFreeAnswersCount] = useState(initialFreeAnswersCount);
  const showExplanations = !isFreeUser || freeAnswersCount <= FREE_DAILY_LIMIT;

  const updateFreeAnswerCache = useCallback((count: number) => {
    if (!user) return;
    try {
      const resetTime = user.daily_answer_reset ? new Date(user.daily_answer_reset).getTime() : Date.now();
      localStorage.setItem(`learnfmpa_free_cache_${user.id}`, JSON.stringify({ count, resetTime }));
    } catch {}
  }, [user]);
  const [allQuestions, setAllQuestions] = useState<ExtendedQuestion[]>([]);
  const [questions, setQuestions] = useState<ExtendedQuestion[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [showChapters, setShowChapters] = useState(false);
  const [shaderEnabled, setShaderEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shaderEnabled');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [sessionFilter, setSessionFilter] = useState('Toutes les sessions');
  const [chapterFilter, setChapterFilter] = useState<string | null>(null);
  const [showAnsweredQuestions, setShowAnsweredQuestions] = useState(false);
  const [availableSessions, setAvailableSessions] = useState<string[]>([]);
  const [isCorrectlyAnswered, setIsCorrectlyAnswered] = useState(false);
  const [correctlyAnsweredQuestions, setCorrectlyAnsweredQuestions] = useState<{ [key: string]: boolean }>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[][]>([]);
  const [optionMapping, setOptionMapping] = useState<number[][]>([]);
  const [shuffledCorrectAnswers, setShuffledCorrectAnswers] = useState<number[][]>([]);
  const [shuffledAnswerExplanations, setShuffledAnswerExplanations] = useState<string[][]>([]);
  const [shuffledOptionImages, setShuffledOptionImages] = useState<string[][]>([]);
  const [originalSelectedAnswers, setOriginalSelectedAnswers] = useState<number[]>([]);
  const [strikethroughOptions, setStrikethroughOptions] = useState<{ [key: string]: Set<number> }>({});
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [initialQuestionSet, setInitialQuestionSet] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerPage, setImageViewerPage] = useState<number>(1);
  const [collapsedChoices, setCollapsedChoices] = useState<Set<number>>(new Set());
  const [questionStats, setQuestionStats] = useState<{
    total_answers: number;
    correct_answers: number;
    option_counts: { [optionIndex: string]: number };
  } | null>(null);

  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [randomizerEnabled, setRandomizerEnabled] = useState(false);
  const [examMode, setExamMode] = useState(false);
  const [gdrMode, setGdrMode] = useState(true);
  const [examTimeLeft, setExamTimeLeft] = useState(3600);
  const [examAnswers, setExamAnswers] = useState<Record<number, number[]>>({});
  const [examFinished, setExamFinished] = useState(false);
  const [examQuestions, setExamQuestions] = useState<ExtendedQuestion[]>([]);
  const [examCorrectCount, setExamCorrectCount] = useState(0);
  const [examIncorrectCount, setExamIncorrectCount] = useState(0);
  const [examUnansweredCount, setExamUnansweredCount] = useState(0);
  const [showExamGdrPrompt, setShowExamGdrPrompt] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSuggestedCorrect, setReportSuggestedCorrect] = useState<number[]>([]);
  const [reportSuggestedIncorrect, setReportSuggestedIncorrect] = useState<number[]>([]);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [pendingReportCount, setPendingReportCount] = useState<{ [key: string]: number }>({});
  const [showModuleTutorial, setShowModuleTutorial] = useState(false);
  const [showChapterName, setShowChapterName] = useState(false);
  const examTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handleShowAnswerRef = useRef<() => void>(() => {});

  const moduleId = parseInt(params.id as string);
  const module = getModuleById(moduleId);
  const questionParam = searchParams.get('q');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user && shouldShowModuleTutorial()) {
      const timer = setTimeout(() => setShowModuleTutorial(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user) return;
    const resetTime = user.daily_answer_reset ? new Date(user.daily_answer_reset).getTime() : 0;
    if (resetTime && Date.now() - resetTime >= FREE_DAILY_WINDOW_MS) {
      setFreeAnswersCount(0);
      updateFreeAnswerCache(0);
      try { localStorage.removeItem(`learnfmpa_free_cache_${user.id}`); } catch {}
    } else {
      setFreeAnswersCount((prev: number) => {
        const serverCount = user.daily_answer_count || 0;
        const newCount = Math.max(prev, serverCount);
        updateFreeAnswerCache(newCount);
        return newCount;
      });
    }
  }, [user?.daily_answer_count, user?.daily_answer_reset, updateFreeAnswerCache]);

  useEffect(() => {
    if (!isFreeUser || !user?.daily_answer_reset) return;
    const resetTime = new Date(user.daily_answer_reset).getTime();
    const msUntilReset = resetTime + FREE_DAILY_WINDOW_MS - Date.now();
    if (msUntilReset <= 0) return;
    const timer = setTimeout(() => {
      setFreeAnswersCount(0);
      updateFreeAnswerCache(0);
      try { localStorage.removeItem(`learnfmpa_free_cache_${user.id}`); } catch {}
    }, msUntilReset);
    return () => clearTimeout(timer);
  }, [isFreeUser, user?.daily_answer_reset, updateFreeAnswerCache]);

  useEffect(() => {
    return () => {
      flushAnswers();
    };
  }, [flushAnswers]);

  useEffect(() => {
    if (moduleId) {
      preloadModuleData(moduleId).then(async ({ questions: allQuestions }) => {
        const extendedQuestions = allQuestions.map(q => ({
          ...q,
          isMultipleChoice: q.isMultipleChoice || q.options.length > 2,
          correctAnswers: q.correctAnswers || [q.correctAnswer],
          answerExplanations: q.answerExplanations || Array(q.options.length).fill(''),
          overallExplanation: q.overallExplanation || q.explanation,
          questionImage: q.questionImage,
          optionImages: q.optionImages || Array(q.options.length).fill('')
        }));
        
        if (isFreeUser) {
          setCorrectlyAnsweredQuestions({});
        } else {
          let localProgress: { [key: string]: boolean } = {};
          if (typeof window !== 'undefined') {
            const storageKey = `learnfmpa_answered_${moduleId}`;
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              try {
                localProgress = JSON.parse(stored);
                setCorrectlyAnsweredQuestions(localProgress);
              } catch (e) {}
            }
          }

          if (user && typeof window !== 'undefined') {
            try {
              const dbProgress = await getProgress(moduleId);
              const serverProgress: { [key: string]: boolean } = {};
              Object.entries(dbProgress).forEach(([key, value]: [string, any]) => {
                if (value?.is_correct) {
                  serverProgress[`${moduleId}_${key}`] = true;
                }
              });
              setCorrectlyAnsweredQuestions(serverProgress);
              const storageKey = `learnfmpa_answered_${moduleId}`;
              localStorage.setItem(storageKey, JSON.stringify(serverProgress));
              localProgress = serverProgress;
            } catch (e) {
              setCorrectlyAnsweredQuestions(localProgress);
            }
          } else {
            setCorrectlyAnsweredQuestions(localProgress);
          }
        }

        setAllQuestions(extendedQuestions);
        
        const sessions = [...new Set(extendedQuestions.map(q => q.year).filter(Boolean) as string[])]
          .sort((a, b) => {
            const months: { [key: string]: number } = {
              'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
              'juillet': 7, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
            };
            
            const parseSession = (session: string) => {
              const lower = session.toLowerCase();
              const parts = lower.split(' ');
              const month = months[parts[0] as keyof typeof months] || 0;
              const year = parseInt(parts[1]) || 0;
              let type = 0;
              if (lower.includes('(rattrapage)')) type = 1;
              return { month, year, type };
            };
            
            const sessionA = parseSession(a);
            const sessionB = parseSession(b);
            
            if (sessionA.year !== sessionB.year) return sessionB.year - sessionA.year;
            if (sessionA.month !== sessionB.month) return sessionB.month - sessionA.month;
            return sessionA.type - sessionB.type;
          });
        setAvailableSessions(sessions);
        
        filterQuestionsBySession(extendedQuestions, sessionFilter, isFreeUser ? {} : undefined);
      });
    }
  }, [moduleId, user?.id]);

  useEffect(() => {
    if (!user) return;
    const fetchPendingReports = async () => {
      try {
        const token = localStorage.getItem('learnfmpa_token');
        const res = await fetch(`/api/report-community?user_id=${user.id}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success) return;
        const counts: { [key: string]: number } = {};
        for (const moduleGroup of data.data) {
          if (moduleGroup.module_id === moduleId) {
            for (const report of moduleGroup.reports) {
              if (report.status === 'pending') {
                counts[report.question_id] = (counts[report.question_id] || 0) + 1;
              }
            }
          }
        }
        setPendingReportCount(counts);
      } catch {}
    };
    fetchPendingReports();
  }, [moduleId, user?.id]);

  useEffect(() => {
    if (allQuestions.length > 0) {
      filterQuestionsBySession(allQuestions, sessionFilter);
    }
  }, [sessionFilter, allQuestions]);

  useEffect(() => {
    if (allQuestions.length > 0) {
      applyAnsweredQuestionsFilter();
    }
  }, [showAnsweredQuestions, allQuestions, sessionFilter, chapterFilter]);

  useEffect(() => {
    if (questions.length > 0 && questionParam && !initialQuestionSet) {
      const questionIndex = parseInt(questionParam, 10);
      if (!isNaN(questionIndex) && questionIndex >= 0 && questionIndex < questions.length) {
        setCurrentQuestionIndex(questionIndex);
      }
      setInitialQuestionSet(true);
    }
  }, [questions, questionParam, initialQuestionSet]);

  const activeQuestions = examMode ? examQuestions : questions;
  const currentQuestion = activeQuestions[currentQuestionIndex];
  const currentQuestionHasGDR = !!(currentQuestion?.answerExplanations?.some(expl => expl?.includes('[GDR]')));
  const currentQuestionHasGDR1 = !!(currentQuestion?.answerExplanations?.some(expl => expl?.includes('[GDR1]')));
  const currentQuestionHasAnyGDR = currentQuestionHasGDR || currentQuestionHasGDR1;
  const effectiveGdrMode = gdrMode && currentQuestionHasAnyGDR;
  const showSimpleResult = !effectiveGdrMode;
  

  

  useEffect(() => {
    if (currentQuestion) {
      const isTwoChoiceQuestion = currentQuestion.options.length === 2;
      
      if (isTwoChoiceQuestion) {
        const originalOptions = [...currentQuestion.options];
        const originalCorrectAnswers = [...currentQuestion.correctAnswers];
        const originalAnswerExplanations = [...currentQuestion.answerExplanations];
        const originalOptionImages = currentQuestion.optionImages ? [...currentQuestion.optionImages] : Array(currentQuestion.options.length).fill('');
        
        const indices = originalOptions.map((_, index) => index);
        
        setShuffledOptions(prev => {
          const newShuffled = [...prev];
          newShuffled[currentQuestionIndex] = originalOptions;
          return newShuffled;
        });
        
        setOptionMapping(prev => {
          const newMapping = [...prev];
          newMapping[currentQuestionIndex] = indices;
          return newMapping;
        });
        
        setShuffledCorrectAnswers(prev => {
          const newCorrect = [...prev];
          newCorrect[currentQuestionIndex] = originalCorrectAnswers;
          return newCorrect;
        });
        
        setShuffledAnswerExplanations(prev => {
          const newExplanations = [...prev];
          newExplanations[currentQuestionIndex] = originalAnswerExplanations;
          return newExplanations;
        });
        
        setShuffledOptionImages(prev => {
          const newImages = [...prev];
          newImages[currentQuestionIndex] = originalOptionImages;
          return newImages;
        });
      } else {
        const originalOptions = [...currentQuestion.options];
        const originalCorrectAnswers = [...currentQuestion.correctAnswers];
        const originalAnswerExplanations = [...currentQuestion.answerExplanations];
        const originalOptionImages = currentQuestion.optionImages ? [...currentQuestion.optionImages] : Array(currentQuestion.options.length).fill('');
        
        const indices = originalOptions.map((_, index) => index);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        const newShuffledOptions = indices.map(i => originalOptions[i]);
        const newShuffledCorrectAnswers = originalCorrectAnswers.map(originalIndex => indices.indexOf(originalIndex));
        const newShuffledAnswerExplanations = indices.map(i => originalAnswerExplanations[i]);
        const newShuffledOptionImages = indices.map(i => originalOptionImages[i]);
        const newOptionMapping = indices.map((originalIndex) => originalIndex);
        
        setShuffledOptions(prev => {
          const newShuffled = [...prev];
          newShuffled[currentQuestionIndex] = newShuffledOptions;
          return newShuffled;
        });
        
        setOptionMapping(prev => {
          const newMapping = [...prev];
          newMapping[currentQuestionIndex] = newOptionMapping;
          return newMapping;
        });
        
        setShuffledCorrectAnswers(prev => {
          const newCorrect = [...prev];
          newCorrect[currentQuestionIndex] = newShuffledCorrectAnswers;
          return newCorrect;
        });
        
        setShuffledAnswerExplanations(prev => {
          const newExplanations = [...prev];
          newExplanations[currentQuestionIndex] = newShuffledAnswerExplanations;
          return newExplanations;
        });
        
        setShuffledOptionImages(prev => {
          const newImages = [...prev];
          newImages[currentQuestionIndex] = newShuffledOptionImages;
          return newImages;
        });
      }
    }
  }, [currentQuestionIndex, currentQuestion, showAnswer]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    if (!timerEnabled || showAnswer || examMode) return;

    let seconds = 60;
    setTimerSeconds(seconds);

    const interval = setInterval(() => {
      seconds -= 1;
      setTimerSeconds(seconds);
      if (seconds <= 0) {
        clearInterval(interval);
        handleShowAnswerRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentQuestionIndex, timerEnabled, showAnswer, examMode]);

  useEffect(() => {
    if (!examMode || examFinished) {
      if (examTimerRef.current) {
        clearInterval(examTimerRef.current);
        examTimerRef.current = null;
      }
      return;
    }
    examTimerRef.current = setInterval(() => {
      setExamTimeLeft(prev => {
        if (prev <= 1) {
          if (examTimerRef.current) clearInterval(examTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (examTimerRef.current) {
        clearInterval(examTimerRef.current);
        examTimerRef.current = null;
      }
    };
  }, [examMode, examFinished]);

  const finishExam = useCallback(() => {
    if (examTimerRef.current) {
      clearInterval(examTimerRef.current);
      examTimerRef.current = null;
    }
    const eq = examQuestions;
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;
    eq.forEach((q, i) => {
      const userAnswers = examAnswers[i];
      if (!userAnswers || userAnswers.length === 0) {
        unanswered++;
      } else {
        const correctSet = new Set(q.correctAnswers);
        const allCorrect = q.correctAnswers.every(a => userAnswers.includes(a));
        const allSelected = userAnswers.every(a => correctSet.has(a));
        if (allCorrect && allSelected) {
          correct++;
        } else {
          incorrect++;
        }
      }
    });
    setExamCorrectCount(correct);
    setExamIncorrectCount(incorrect);
    setExamUnansweredCount(unanswered);
    setExamFinished(true);
  }, [examQuestions, examAnswers]);

  useEffect(() => {
    if (examMode && examTimeLeft === 0 && !examFinished) {
      finishExam();
    }
  }, [examTimeLeft, examMode, examFinished, finishExam]);

  const handleToggleTimer = () => {
    if (examMode) return;
    setTimerEnabled(prev => !prev);
    setTimerSeconds(60);
  };

  const handleToggleRandomizer = () => {
    if (examMode) return;
    if (!randomizerEnabled) {
      setRandomizerEnabled(true);
      setQuestions(prev => shuffleArray(prev));
      setCurrentQuestionIndex(0);
      setSelectedAnswers([]);
      setShowAnswer(false);
      setIsCorrectlyAnswered(false);
      setOriginalSelectedAnswers([]);
      setCollapsedChoices(new Set());
      setQuestionStats(null);
      setShowChapterName(false);
    } else {
      setRandomizerEnabled(false);
      applyAnsweredQuestionsFilter();
    }
  };

  const handleToggleExam = () => {
    if (examMode) {
      setExamMode(false);
      setExamFinished(false);
      setExamAnswers({});
      setExamQuestions([]);
      setExamTimeLeft(3600);
      setCurrentQuestionIndex(0);
      setSelectedAnswers([]);
      setShowAnswer(false);
      setIsCorrectlyAnswered(false);
      setOriginalSelectedAnswers([]);
      setCollapsedChoices(new Set());
      setQuestionStats(null);
      setShowChapterName(false);
      applyAnsweredQuestionsFilter();
      return;
    }
    const gdrQuestions = allQuestions.filter(q => q.answerExplanations?.some(expl => expl?.includes('[GDR]') || expl?.includes('[GDR1]')));
    if (gdrQuestions.length === 0) {
      startExam(false);
    } else {
      setShowExamGdrPrompt(true);
    }
  };

  const startExam = (withGdr: boolean) => {
    setShowExamGdrPrompt(false);
    setGdrMode(withGdr);
    const sourceQuestions = withGdr ? allQuestions.filter(q => q.answerExplanations?.some(expl => expl?.includes('[GDR]') || expl?.includes('[GDR1]'))) : allQuestions;
    const pool = sourceQuestions.length >= 50 ? shuffleArray(sourceQuestions).slice(0, 50) : shuffleArray(sourceQuestions);
    setExamQuestions(pool);
    setExamMode(true);
    setExamFinished(false);
    setExamAnswers({});
    setExamTimeLeft(3600);
    setTimerEnabled(false);
    setRandomizerEnabled(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowAnswer(false);
    setIsCorrectlyAnswered(false);
    setOriginalSelectedAnswers([]);
    setCollapsedChoices(new Set());
    setQuestionStats(null);
    setShowChapterName(false);
  };

  const handleToggleGdrMode = () => {
    if (examMode) return;
    setGdrMode(prev => !prev);
  };

  const formatExamTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatExamTimeTaken = () => {
    const elapsed = 3600 - examTimeLeft;
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    return `${m} min ${s} sec`;
  };

  const filterQuestionsBySession = (questionsToFilter: ExtendedQuestion[], session: string, answeredProgress?: { [key: string]: boolean }) => {
    setChapterFilter(null);
    
    if (session === 'Toutes les sessions') {
      if (chapters.length === 0) {
        getModuleChapters(moduleId).then(setChapters);
      }
    } else {
      const filteredQuestions = questionsToFilter.filter(q => q.year === session);
      
      const filteredJsonQuestions = filteredQuestions.map(q => ({
        YearAsked: q.year || '',
        Subtopic: q.chapter || '',
        QuestionText: q.question,
        QuestionImage: q.questionImage,
        Choice_A_Text: q.options[0] || '',
        Choice_A_isCorrect: q.correctAnswers?.includes(0) || false,
        Choice_A_Explanation: q.answerExplanations?.[0] || '',
        Choice_A_Image: q.optionImages?.[0] || '',
        Choice_B_Text: q.options[1] || '',
        Choice_B_isCorrect: q.correctAnswers?.includes(1) || false,
        Choice_B_Explanation: q.answerExplanations?.[1] || '',
        Choice_B_Image: q.optionImages?.[1] || '',
        Choice_C_Text: q.options[2] || '',
        Choice_C_isCorrect: q.correctAnswers?.includes(2) || false,
        Choice_C_Explanation: q.answerExplanations?.[2] || '',
        Choice_C_Image: q.optionImages?.[2] || '',
        Choice_D_Text: q.options[3] || '',
        Choice_D_isCorrect: q.correctAnswers?.includes(3) || false,
        Choice_D_Explanation: q.answerExplanations?.[3] || '',
        Choice_D_Image: q.optionImages?.[3] || '',
        Choice_E_Text: q.options[4] || '',
        Choice_E_isCorrect: q.correctAnswers?.includes(4) || false,
        Choice_E_Explanation: q.answerExplanations?.[4] || '',
        Choice_E_Image: q.optionImages?.[4] || '',
        OverallExplanation: q.overallExplanation || '',
        IsChapterStart: false,
        ChapterName: q.chapter || '',
        ChapterColor: '#3B82F6',
        Confirmed: q.confirmed
      } as JsonQuestion));
      
      const chaptersFromFiltered = extractChaptersFromQuestions(filteredJsonQuestions);
      setChapters(chaptersFromFiltered);
    }
    
    applyAnsweredQuestionsFilter(answeredProgress);
    setStrikethroughOptions({});
  };

  const applyAnsweredQuestionsFilter = (answeredProgress?: { [key: string]: boolean }) => {
    const answered = answeredProgress || correctlyAnsweredQuestions;
    let baseQuestions: ExtendedQuestion[];
    if (sessionFilter === 'Toutes les sessions') {
      baseQuestions = allQuestions;
    } else {
      baseQuestions = allQuestions.filter(q => q.year === sessionFilter);
    }

    const months: { [key: string]: number } = {
      'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
      'juillet': 7, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
    };
    
    const parseYear = (year: string | undefined) => {
      if (!year) return { month: 0, year: 0, type: 0 };
      const lower = year.toLowerCase();
      const parts = lower.split(' ');
      const month = months[parts[0] as keyof typeof months] || 0;
      const yearNum = parseInt(parts[1]) || 0;
      let type = 0;
      if (lower.includes('(rattrapage)')) type = 1;
      return { month, year: yearNum, type };
    };
    
    baseQuestions.sort((a, b) => {
      const yearA = parseYear(a.year);
      const yearB = parseYear(b.year);
      
      if (yearA.year !== yearB.year) return yearB.year - yearA.year;
      if (yearA.month !== yearB.month) return yearB.month - yearA.month;
      return yearA.type - yearB.type;
    });

    if (chapterFilter) {
      baseQuestions = baseQuestions.filter(q => q.chapter === chapterFilter);
    }

    if (showAnsweredQuestions || isFreeUser) {
      setQuestions(baseQuestions);
    } else {
      const unansweredQuestions = baseQuestions.filter(q => {
        const questionKey = `${moduleId}_${q.id}`;
        return !answered[questionKey];
      });
      setQuestions(unansweredQuestions);
    }

    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowAnswer(false);
    setIsCorrectlyAnswered(false);
    setOriginalSelectedAnswers([]);
    setCollapsedChoices(new Set());
    setShowChapterName(false);
  };

  if (authLoading || !user) {
    return (
      <div className={`min-h-screen relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center`}>
        <div className={`absolute inset-0 ${isDarkMode ? 'opacity-30' : 'opacity-50'}`}>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="w-20 h-20 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-6 shadow-lg shadow-green-500/25"></div>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} font-medium`}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className={`min-h-screen relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center`}>
        <div className={`absolute inset-0 ${isDarkMode ? 'opacity-30' : 'opacity-50'}`}>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
        </div>
        <div className={`${isDarkMode ? 'bg-gray-800/60' : 'bg-white/80'} backdrop-blur-xl rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl text-center border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'} relative z-10`}>
          <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Module non trouvé</h1>
          <Link href="/dashboard" className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/25">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswer) return;
    
    if (currentQuestion.isMultipleChoice) {
      if (selectedAnswers.includes(answerIndex)) {
        setSelectedAnswers(selectedAnswers.filter(i => i !== answerIndex));
      } else {
        setSelectedAnswers([...selectedAnswers, answerIndex]);
      }
    } else {
      if (selectedAnswers.includes(answerIndex)) {
        setSelectedAnswers([]);
      } else {
        setSelectedAnswers([answerIndex]);
      }
    }
  };

  const handleOptionRightClick = (e: React.MouseEvent, optionIndex: number) => {
    e.preventDefault();
    
    const questionKey = `${moduleId}_${currentQuestionIndex}`;
    const currentStrikethrough = strikethroughOptions[questionKey] || new Set();
    
    const originalIndex = showAnswer
      ? optionIndex
      : (optionMapping[currentQuestionIndex]?.[optionIndex] ?? optionIndex);
    
    const newStrikethrough = new Set(currentStrikethrough);
    if (newStrikethrough.has(originalIndex)) {
      newStrikethrough.delete(originalIndex);
    } else {
      newStrikethrough.add(originalIndex);
    }
    
    setStrikethroughOptions(prev => ({
      ...prev,
      [questionKey]: newStrikethrough
    }));
  };

  const handleShowAnswer = async () => {
    if (!currentQuestion) return;

    if (examMode) {
      const mapping = optionMapping[currentQuestionIndex] || [];
      const mappedSelectedAnswers = selectedAnswers.map(selectedIndex => mapping[selectedIndex] ?? selectedIndex);
      setExamAnswers(prev => ({ ...prev, [currentQuestionIndex]: mappedSelectedAnswers }));
      if (currentQuestionIndex < examQuestions.length - 1) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedAnswers([]);
          setShowAnswer(false);
          setIsCorrectlyAnswered(false);
          setOriginalSelectedAnswers([]);
          setCollapsedChoices(new Set());
          setQuestionStats(null);
          setShowChapterName(false);
          setIsTransitioning(false);
        }, 150);
      } else {
        finishExam();
      }
      return;
    }

    const mapping = optionMapping[currentQuestionIndex] || [];
    const mappedSelectedAnswers = selectedAnswers.map(selectedIndex => mapping[selectedIndex]);
    setOriginalSelectedAnswers(mappedSelectedAnswers);

    const correctAnswersSet = new Set(effectiveGdrMode
      ? currentQuestionHasGDR1
        ? currentQuestion.correctAnswers
        : (currentQuestion.answerExplanations || []).reduce((acc: number[], expl: string, i: number) => expl && expl.includes('[GDR]') ? [...acc, i] : acc, [])
      : currentQuestion.correctAnswers
    );
    const selectedAnswersSet = new Set(mappedSelectedAnswers);
    
    const defaultCollapsed = new Set<number>();
    currentQuestion.options.forEach((_, i) => {
      if (!correctAnswersSet.has(i) && !selectedAnswersSet.has(i)) {
        defaultCollapsed.add(i);
      }
    });
    setCollapsedChoices(defaultCollapsed);

    const allSelectedAreCorrect = mappedSelectedAnswers.every(answer => correctAnswersSet.has(answer));
    const allCorrectAreSelected = Array.from(correctAnswersSet).every(answer => selectedAnswersSet.has(answer));
    const isCorrect = allSelectedAreCorrect && allCorrectAreSelected;
    
    setIsCorrectlyAnswered(isCorrect);
    
    if (isCorrect) {
      setScore(score + 1);
    }

    setShowAnswer(true);
    setAnsweredQuestions(new Set([...answeredQuestions, currentQuestionIndex]));
    
    if (currentQuestion) {
      if (isFreeUser) {
        if (user) {
          const newCount = freeAnswersCount + 1;
          if (newCount <= FREE_DAILY_LIMIT) {
            submitAnswer(moduleId, currentQuestion.id.toString(), isCorrect, mappedSelectedAnswers);
          }
          setFreeAnswersCount(newCount);
          updateFreeAnswerCache(newCount);
        }
      } else if (typeof window !== 'undefined') {
        const storageKey = `learnfmpa_answered_${moduleId}`;
        const questionKey = `${moduleId}_${currentQuestion.id}`;
        const newAnsweredQuestions = { ...correctlyAnsweredQuestions, [questionKey]: isCorrect };
        setCorrectlyAnsweredQuestions(newAnsweredQuestions);
        localStorage.setItem(storageKey, JSON.stringify(newAnsweredQuestions));
        
        if (user) {
          submitAnswer(moduleId, currentQuestion.id.toString(), isCorrect, mappedSelectedAnswers);
          const flushResult = await flushAnswers();
          if (flushResult?.statistics) {
            setQuestionStats(flushResult.statistics);
          } else {
            setQuestionStats(null);
          }
        }
      }
    }
  };

  handleShowAnswerRef.current = handleShowAnswer;

  const handleNextQuestion = () => {
    const totalQ = examMode ? examQuestions.length : questions.length;
    if (currentQuestionIndex < totalQ - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswers([]);
        setShowAnswer(false);
        setIsCorrectlyAnswered(false);
        setOriginalSelectedAnswers([]);
        setCollapsedChoices(new Set());
        setQuestionStats(null);
        setIsTransitioning(false);
        setShowChapterName(false);
        const newQuestionKey = `${moduleId}_${currentQuestionIndex + 1}`;
        setStrikethroughOptions(prev => {
          const newStrikethrough = { ...prev };
          delete newStrikethrough[newQuestionKey];
          return newStrikethrough;
        });
      }, 150);
    } else if (examMode) {
      finishExam();
    } else {
      router.push('/dashboard');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
        setSelectedAnswers([]);
        setShowAnswer(false);
        setIsCorrectlyAnswered(false);
        setOriginalSelectedAnswers([]);
        setCollapsedChoices(new Set());
        setQuestionStats(null);
        setIsTransitioning(false);
        setShowChapterName(false);
        const newQuestionKey = `${moduleId}_${currentQuestionIndex - 1}`;
        setStrikethroughOptions(prev => {
          const newStrikethrough = { ...prev };
          delete newStrikethrough[newQuestionKey];
          return newStrikethrough;
        });
      }, 150);
    }
  };

  const handleChapterSelect = (chapterName: string) => {
    if (chapterFilter === chapterName) {
      setChapterFilter(null);
    } else {
      setChapterFilter(chapterName);
    }
    applyAnsweredQuestionsFilter();
    setStrikethroughOptions({});
  };

  const handleClearChapterFilter = () => {
    setChapterFilter(null);
    applyAnsweredQuestionsFilter();
    setStrikethroughOptions({});
  };

  const handleSessionFilterChange = (newSession: string) => {
    setSessionFilter(newSession);
  };

  const handleResetProgress = () => {
    setShowResetConfirm(true);
  };

  const confirmResetProgress = async () => {
    setCorrectlyAnsweredQuestions({});
    if (typeof window !== 'undefined' && moduleId) {
      const storageKey = `learnfmpa_answered_${moduleId}`;
      localStorage.removeItem(storageKey);
    }
    if (user) {
      try {
        clearProgressAndStats();
        const token = localStorage.getItem('learnfmpa_token');
        await fetch(`/api/progress?user_id=${user.id}&module_id=${moduleId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.error('Failed to reset server progress:', e);
      }
    }
    setScore(0);
    setAnsweredQuestions(new Set());
    setShowResetConfirm(false);
    applyAnsweredQuestionsFilter({});
  };

  const cancelResetProgress = () => {
    setShowResetConfirm(false);
  };

  if (activeQuestions.length === 0) {
    return (
      <div className={`min-h-screen relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
        <div className={`absolute inset-0 ${isDarkMode ? 'opacity-30' : 'opacity-50'}`}>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>
        <header className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl border-b sticky top-0 z-10 shadow-sm`}>
          <div className="px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <ThemeToggle />
                <Link
                  href="/dashboard"
                  className={`p-1.5 sm:p-2.5 rounded-xl ${isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'} transition-all shadow-sm`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                {module.icon ? (
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg shadow-green-500/20">
                    <Image src={module.icon} alt={module.title} width={44} height={44} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br ${module.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20`}>
                    <span className="text-white font-bold text-sm sm:text-lg">{module.title.charAt(0)}</span>
                  </div>
                )}
                <h1 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{module.title}</h1>
              </div>
              {!isFreeUser && (
              <button
                onClick={() => setShowAnsweredQuestions(!showAnsweredQuestions)}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-sm ${showAnsweredQuestions ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/25' : isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'}`}
              >
                {showAnsweredQuestions ? 'Masquer' : 'Voir répondues'}
              </button>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-8 sm:py-12 relative z-10">
          <div className={`${isDarkMode ? 'bg-gray-800/60' : 'bg-white/80'} backdrop-blur-xl rounded-2xl sm:rounded-3xl p-8 sm:p-16 shadow-2xl text-center border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`}>
            <div className="w-20 h-20 sm:w-28 sm:h-28 bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl shadow-green-500/30">
              <svg className="w-10 h-10 sm:w-14 sm:h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4 sm:mb-5`}>
              Félicitations !
            </h2>
            <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-8 sm:mb-10 max-w-md mx-auto`}>
              Vous avez complété toutes les questions de ce module.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-5">
              <button
                onClick={() => setShowAnsweredQuestions(true)}
                className="px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl sm:rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-xl shadow-green-500/25 text-sm sm:text-base"
              >
                Voir toutes les questions
              </button>
              <Link
                href="/dashboard"
                className={`px-8 sm:px-10 py-4 sm:py-5 ${isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-white text-gray-700 hover:bg-gray-50'} font-semibold rounded-xl sm:rounded-2xl transition-all shadow-lg border ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200'} text-sm sm:text-base`}
              >
                Retour
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
      {shaderEnabled && !gdrMode && (
        <div className="absolute inset-0 z-0">
          <Suspense fallback={null}>
            <Warp
              width={1920}
              height={1080}
              colors={["#a7e58b", "#324471", "#0b190e"]}
              proportion={0.64}
              softness={1}
              distortion={0.2}
              swirl={0.86}
              swirlIterations={7}
              shape="edge"
              shapeScale={0.6}
              speed={10}
              scale={0.9}
              rotation={160}
              style={{ width: '100%', height: '100%' }}
            />
          </Suspense>
        </div>
      )}
      {shaderEnabled && gdrMode && (
        <div className="absolute inset-0 z-0">
          <Suspense fallback={null}>
            <GrainGradient
              width={1280}
              height={720}
              colors={["#7300ff", "#eba8ff", "#00bfff", "#2b00ff"]}
              colorBack="#000000"
              softness={0.5}
              intensity={0.5}
              noise={0.25}
              shape="corners"
              speed={1}
              style={{ width: '100%', height: '100%' }}
            />
          </Suspense>
        </div>
      )}
      <div className={`absolute inset-0 ${isDarkMode ? 'opacity-30' : 'opacity-50'}`}>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>
      
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} transform animate-pulse`}>
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} text-center mb-3`}>
              Réinitialiser la progression ?
            </h3>
            <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
              Cette action supprimera toutes vos réponses correctes. Elle ne peut pas être annulée.
            </p>
            <div className="flex gap-4">
              <button
                onClick={cancelResetProgress}
                className={`flex-1 px-6 py-4 rounded-2xl font-semibold ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all`}
              >
                Annuler
              </button>
              <button
                onClick={confirmResetProgress}
                className="flex-1 px-6 py-4 rounded-2xl font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-500/25"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {showExamGdrPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800/95' : 'bg-white/95'} backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} text-center mb-3`}>
              Mode d&apos;examen
            </h3>
            <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
              Voulez-vous passer l&apos;examen avec les réponses du professeur (GDR) ou avec toutes les questions ?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => startExam(true)}
                className="px-6 py-4 rounded-2xl font-semibold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all shadow-lg shadow-green-500/25"
              >
                📖 Mode GDR
                <span className={`block text-sm font-normal mt-1 ${isDarkMode ? 'text-green-200' : 'text-green-100'}`}>
                  Questions avec réponses du professeur uniquement
                </span>
              </button>
              <button
                onClick={() => startExam(false)}
                className={`px-6 py-4 rounded-2xl font-semibold ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all`}
              >
                📝 Toutes les questions
                <span className={`block text-sm font-normal mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Examen avec toutes les questions disponibles
                </span>
              </button>
              <button
                onClick={() => setShowExamGdrPrompt(false)}
                className={`px-6 py-3 rounded-2xl font-medium ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-all`}
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <header className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl border-b sticky top-0 z-10 shadow-sm`}>
        <div className="px-2 sm:px-4 py-1.5 sm:py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div data-tutorial="module-header" className="flex justify-between items-center">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <ThemeToggle />
                <button
                  onClick={() => setShowModuleTutorial(true)}
                  className={`p-1.5 sm:p-2 rounded-xl transition-all ${isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-green-400' : 'bg-gray-100/80 text-gray-600 hover:bg-green-50 hover:text-green-600'} shadow-sm`}
                  title="Tutoriel"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.36-2 4.272-2C14.528 7 16 8.153 16 9.5c0 1.657-1.623 2.417-3.176 3.01-.842.326-1.475.77-1.475 1.49v.5M12 17h.01M9 12h6" />
                  </svg>
                </button>
                <Link
                  href="/dashboard"
                  className={`p-1.5 sm:p-2.5 rounded-xl ${isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'} transition-all shadow-sm`}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                {module.icon ? (
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg shadow-green-500/20">
                    <Image src={module.icon} alt={module.title} width={44} height={44} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br ${module.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20`}>
                    <span className="text-white font-bold text-sm sm:text-lg">{module.title.charAt(0)}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>{module.title}</h1>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{examMode ? `${examQuestions.length} questions` : `${questions.length} questions`}</p>
                </div>
              </div>
            </div>
            <div data-tutorial="module-toolbar" className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
              {examMode && (
                <div className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-sm sm:text-base font-bold flex items-center gap-1.5 flex-shrink-0 ${examTimeLeft <= 300 ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse shadow-lg shadow-red-500/25' : isDarkMode ? 'bg-gradient-to-r from-amber-700/60 to-amber-600/60 text-amber-200' : 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-800'} shadow-sm`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatExamTime(examTimeLeft)}
                </div>
              )}
              <button
                onClick={handleToggleTimer}
                title="Chronomètre 60s"
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0 shadow-sm flex items-center gap-1 ${timerEnabled ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-blue-500/25' : isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-white/80 text-gray-700 hover:bg-gray-200/80'}`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">60s</span>
              </button>
              <button
                onClick={handleToggleRandomizer}
                title="Aléatoire"
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0 shadow-sm flex items-center gap-1 ${randomizerEnabled ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-500/25' : isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-white/80 text-gray-700 hover:bg-gray-200/80'}`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">Aléatoire</span>
              </button>
              <button
                onClick={handleToggleExam}
                title="Mode Examen"
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0 shadow-sm flex items-center gap-1 ${examMode ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-amber-500/25' : isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-white/80 text-gray-700 hover:bg-gray-200/80'}`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
<span className="hidden sm:inline">Examen</span>
              </button>
{!examMode && (
                <button
                  onClick={currentQuestionHasAnyGDR ? handleToggleGdrMode : undefined}
                  disabled={!currentQuestionHasAnyGDR}
                  title={currentQuestionHasAnyGDR ? "Mode GDR - Réponse du professeur" : "GDR non disponible pour cette question"}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0 shadow-sm flex items-center gap-1 ${!currentQuestionHasAnyGDR ? 'bg-gray-400/50 text-gray-400 cursor-not-allowed opacity-50' : gdrMode ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25' : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-red-500/25'}`}
                >
                  <span className="text-sm sm:text-base">📖</span>
                </button>
                )}
               <button
                 onClick={() => setShaderEnabled(prev => { const next = !prev; localStorage.setItem('shaderEnabled', String(next)); return next; })}
                 title="Shader"
                 className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0 shadow-sm flex items-center gap-1 ${shaderEnabled ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/25' : isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-white/80 text-gray-700 hover:bg-gray-200/80'}`}
               >
                 <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                 </svg>
                 <span className="hidden sm:inline">Shader</span>
               </button>
{!examMode && (
                  <>
                  <select
                    data-tutorial="module-filters"
                    className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border text-xs sm:text-sm flex-shrink-0 ${isDarkMode ? 'bg-gray-700/50 border-gray-600/50 text-white' : 'bg-white/80 border-gray-200/50 text-gray-700'} cursor-pointer shadow-sm backdrop-blur-sm`}
                    value={sessionFilter}
                    onChange={(e) => handleSessionFilterChange(e.target.value)}
                  >
                    <option value="Toutes les sessions">Toutes</option>
                    {availableSessions.map(session => (
                      <option key={session} value={session}>{session}</option>
                    ))}
                  </select>
                  {!isFreeUser && (
                    <button
                      onClick={() => setShowAnsweredQuestions(!showAnsweredQuestions)}
                      className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0 shadow-sm ${showAnsweredQuestions ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/25' : isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-white/80 text-gray-700 hover:bg-gray-200/80'}`}
                    >
                      {showAnsweredQuestions ? 'Répondues' : 'Non répondues'}
                    </button>
                  )}
                  </>
                )}
              {!isFreeUser && (
              <button
                onClick={handleResetProgress}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all flex-shrink-0 shadow-sm shadow-red-500/25"
              >
                Reset
              </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-6 relative z-10">
        {!examMode && sessionFilter === 'Toutes les sessions' && (
          <div data-tutorial="module-chapters" className="mb-3 sm:mb-4">
            <button
              onClick={() => setShowChapters(!showChapters)}
              className={`w-full px-4 sm:px-5 py-3 sm:py-4 rounded-2xl font-medium transition-all flex items-center justify-between text-sm sm:text-base ${isDarkMode ? 'bg-gray-800/50 text-white hover:bg-gray-700/50' : 'bg-white/70 text-gray-900 hover:bg-white/90'} border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'} shadow-sm backdrop-blur-sm`}
            >
              <span className="flex items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </div>
                Navigation par sujet
              </span>
              <svg className={`w-5 h-5 sm:w-6 sm:h-6 transform transition-transform ${showChapters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {chapterFilter && (
              <div className="mt-2.5 flex items-center gap-2">
                <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Filtre actif:</span>
                <button
                  onClick={handleClearChapterFilter}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-1.5 shadow-sm shadow-green-500/25"
                >
                  <span className="truncate max-w-[120px] sm:max-w-none">{chapterFilter}</span>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {!examMode && sessionFilter === 'Toutes les sessions' && showChapters && (
          <Suspense fallback={<div className={`mb-6 p-6 rounded-2xl ${isDarkMode ? 'bg-gray-800/50' : 'bg-white/70'} animate-pulse h-32 border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'}`} />}>
            <ChapterNavigation
              chapters={chapters}
              questions={questions}
              currentQuestionIndex={currentQuestionIndex}
              correctlyAnsweredQuestions={correctlyAnsweredQuestions}
              moduleId={moduleId}
              darkMode={isDarkMode}
              activeChapter={chapterFilter}
              onChapterSelect={handleChapterSelect}
            />
          </Suspense>
        )}

        {examFinished ? (
          <div className={`${isDarkMode ? 'bg-gray-800/60' : 'bg-white/80'} backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'} overflow-hidden`}>
            <div className="p-6 sm:p-10 text-center">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-2xl shadow-amber-500/30">
                <svg className="w-12 h-12 sm:w-16 sm:h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                Examen terminé
              </h2>
              <p className={`text-base sm:text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
                Temps: {formatExamTimeTaken()}
              </p>
              
              <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-8 sm:mb-10 max-w-lg mx-auto">
                <div className={`${isDarkMode ? 'bg-green-900/30 border-green-700/30' : 'bg-green-50 border-green-200'} border rounded-2xl p-4 sm:p-5`}>
                  <p className="text-2xl sm:text-3xl font-bold text-green-500">{examCorrectCount}</p>
                  <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-green-400' : 'text-green-700'} mt-1`}>Correctes</p>
                </div>
                <div className={`${isDarkMode ? 'bg-red-900/30 border-red-700/30' : 'bg-red-50 border-red-200'} border rounded-2xl p-4 sm:p-5`}>
                  <p className="text-2xl sm:text-3xl font-bold text-red-500">{examIncorrectCount}</p>
                  <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-red-400' : 'text-red-700'} mt-1`}>Incorrectes</p>
                </div>
                <div className={`${isDarkMode ? 'bg-gray-700/30 border-gray-600/30' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-4 sm:p-5`}>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-500">{examUnansweredCount}</p>
                  <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>Non répondues</p>
                </div>
              </div>

              <div className={`${isDarkMode ? 'bg-gradient-to-r from-gray-700/50 to-gray-600/50' : 'bg-gradient-to-r from-gray-100 to-gray-50'} rounded-2xl p-5 sm:p-6 mb-8`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Score</p>
                <p className={`text-4xl sm:text-5xl font-bold ${examCorrectCount / examQuestions.length >= 0.5 ? 'text-green-500' : 'text-red-500'} mt-2`}>
                  {Math.round((examCorrectCount / examQuestions.length) * 100)}%
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                  {examCorrectCount}/{examQuestions.length} questions
                </p>
              </div>

              {examCorrectCount / examQuestions.length >= 0.5 && (
                <div className={`${isDarkMode ? 'bg-green-900/20 border-green-700/30' : 'bg-green-50 border-green-200'} border rounded-2xl p-5 sm:p-6 mb-8`}>
                  <p className="text-lg sm:text-xl font-bold text-green-500">
                    Félicitations ! Vous avez validé votre module.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                <button
                  onClick={handleToggleExam}
                  className="px-6 sm:px-8 py-3.5 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-xl shadow-green-500/25 text-sm sm:text-base"
                >
                  Retour au mode normal
                </button>
                <Link
                  href="/dashboard"
                  className={`px-6 sm:px-8 py-3.5 sm:py-4 ${isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-white text-gray-700 hover:bg-gray-50'} font-semibold rounded-xl transition-all shadow-lg border ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200'} text-sm sm:text-base`}
                >
                  Tableau de bord
                </Link>
               </div>
             </div>
           </div>
        ) : (
        <div data-tutorial="module-question" className={`${isDarkMode ? 'bg-gray-800/60' : 'bg-white/80'} backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'} overflow-hidden transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}>
          <div className={`p-3 sm:p-8 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-2 sm:mb-6">
              <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
                <span className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl text-sm sm:text-lg font-bold ${isDarkMode ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white' : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900'} shadow-sm`}>
                  {currentQuestionIndex + 1}/{activeQuestions.length}
                </span>
                {timerEnabled && !examMode && (
                  <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-sm sm:text-base font-bold flex items-center gap-1.5 ${timerSeconds <= 10 ? 'bg-gradient-to-r from-red-500 to-red-600 text-white animate-pulse shadow-lg shadow-red-500/25' : isDarkMode ? 'bg-gradient-to-r from-blue-700/60 to-blue-600/60 text-blue-200' : 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800'} shadow-sm`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {timerSeconds}s
                  </span>
                )}
                {currentQuestion && correctlyAnsweredQuestions[`${moduleId}_${currentQuestion.id}`] && (
                  <span className="w-6 h-6 sm:w-9 sm:h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                    <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              <div data-tutorial="module-report" className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
                {currentQuestion?.chapter && (
                  showChapterName ? (
                    <button
                      onClick={() => setShowChapterName(false)}
                      className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium truncate max-w-[140px] sm:max-w-xs ${isDarkMode ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/40 text-green-400 hover:from-green-900/60 hover:to-emerald-900/60' : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 hover:from-green-200 hover:to-emerald-200'} shadow-sm transition-colors`}
                      title={currentQuestion.chapter}
                    >
                      {currentQuestion.chapter}
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowChapterName(true)}
                      className={`shrink-0 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 ${isDarkMode ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/40 text-green-400 hover:from-green-900/60 hover:to-emerald-900/60' : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 hover:from-green-200 hover:to-emerald-200'} shadow-sm transition-colors`}
                      title="Afficher le chapitre"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="hidden sm:inline">Chapitre</span>
                    </button>
                  )
                )}
                {MODULE_IMAGE_CONFIGS[moduleId] && (
                  <button
                    onClick={() => { setImageViewerPage(1); setShowImageViewer(true); }}
                    className={`shrink-0 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 ${isDarkMode ? 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 text-blue-400 hover:from-blue-900/60 hover:to-indigo-900/60' : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 hover:from-blue-200 hover:to-indigo-200'} shadow-sm transition-colors`}
                    title="Ouvrir le cours"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="hidden sm:inline">Cours</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setReportReason('');
                    setReportSuggestedCorrect([]);
                    setReportSuggestedIncorrect([]);
                    setReportSubmitted(false);
                    setShowReportModal(true);
                  }}
                  className={`shrink-0 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 ${isDarkMode ? 'bg-gradient-to-r from-red-900/40 to-orange-900/40 text-red-400 hover:from-red-900/60 hover:to-orange-900/60' : 'bg-gradient-to-r from-red-100 to-orange-100 text-red-600 hover:from-red-200 hover:to-orange-200'} shadow-sm transition-colors`}
                  title="Signaler cette question"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="hidden sm:inline">Signaler</span>
                </button>
                {currentQuestion && pendingReportCount[currentQuestion.id] > 0 && (
                  <Link
                    href={`/dashboard/reports`}
                    className={`shrink-0 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 ${isDarkMode ? 'bg-gradient-to-r from-amber-900/40 to-yellow-900/40 text-amber-400 hover:from-amber-900/60 hover:to-yellow-900/60' : 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 hover:from-amber-200 hover:to-yellow-200'} shadow-sm transition-colors`}
                    title={`${pendingReportCount[currentQuestion.id]} signalement(s) en attente - Voir les détails`}
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="hidden sm:inline">{pendingReportCount[currentQuestion.id]} signalement{pendingReportCount[currentQuestion.id] > 1 ? 's' : ''}</span>
                  </Link>
                )}
              </div>
            </div>
            <p className={`text-sm sm:text-lg sm:text-xl leading-relaxed ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} font-medium`}>
              {currentQuestion?.question}
            </p>
            <p className={`text-xs mt-3 sm:mt-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} flex items-center gap-1.5`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Clic droit sur une option pour la barrer
            </p>
          </div>

          {currentQuestion?.questionImage && (() => {
            const imagePaths = currentQuestion.questionImage.split(',').map(img => img.trim()).filter(img => img);
            if (imagePaths.length === 0) return null;
            return (
              <div className={`p-4 sm:p-5 ${isDarkMode ? 'bg-gray-750/50' : 'bg-gray-50/50'} border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
                <div className={`grid ${imagePaths.length > 1 ? 'grid-cols-2 gap-3' : ''}`}>
                  {imagePaths.map((imgPath, imgIndex) => (
                    <button
                      key={imgIndex}
                      onClick={() => setZoomedImage(imgPath.startsWith('http') ? imgPath : `/images/${imgPath}`)}
                      className="focus:outline-none group"
                    >
                      <Image
                        src={imgPath.startsWith('http') ? imgPath : `/images/${imgPath}`}
                        alt={`Question ${imgIndex + 1}`}
                        width={800}
                        height={400}
                        className="rounded-xl sm:rounded-2xl cursor-pointer hover:opacity-90 transition-all max-h-48 sm:max-h-64 object-contain shadow-lg group-hover:shadow-xl"
                      />
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {showAnswer && currentQuestion && (
            <div className={`px-3 sm:px-8 py-2 sm:py-4 ${isDarkMode ? 'bg-gray-750/50' : 'bg-gray-50/50'} border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
              <div className="flex flex-wrap gap-1.5 sm:gap-2.5">
                {!showSimpleResult && showAnswer && (
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/25">
                    <span>📖</span>
                  </span>
                )}
                {showSimpleResult ? (
                  isCorrectlyAnswered ? (
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center gap-1.5 shadow-lg shadow-green-500/25">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Vrai
                    </span>
                  ) : (
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-red-500 to-red-600 text-white flex items-center gap-1.5 shadow-lg shadow-red-500/25">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Faux
                    </span>
                  )
                ) : (
                  isCorrectlyAnswered && (
                    <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center gap-1.5 shadow-lg shadow-green-500/25">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Correct
                    </span>
                  )
                )}
                {currentQuestion.confirmed && (
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center gap-1.5 shadow-lg shadow-blue-500/25">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Vérifiée
                  </span>
                )}
                {currentQuestion.year && (
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25">
                    {currentQuestion.year}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="p-3 sm:p-5 sm:p-8 space-y-2 sm:space-y-4">
            {(showAnswer ? currentQuestion?.options : (shuffledOptions[currentQuestionIndex] || [])).map((option, index) => {
              const jsonIsCorrect = showAnswer
                ? (currentQuestion?.correctAnswers || []).includes(index)
                : (shuffledCorrectAnswers[currentQuestionIndex] || []).includes(index);
              const answerExplanation = showAnswer
                ? (currentQuestion?.answerExplanations && currentQuestion.answerExplanations[index])
                : (shuffledAnswerExplanations[currentQuestionIndex] && shuffledAnswerExplanations[currentQuestionIndex][index]);
              const hasGDR = answerExplanation && answerExplanation.includes('[GDR]');
              const hasGDR1 = answerExplanation && answerExplanation.includes('[GDR1]');
              const isCorrect = effectiveGdrMode && showAnswer
                ? currentQuestionHasGDR1 ? jsonIsCorrect : !!hasGDR
                : jsonIsCorrect;
              const isSelected = showAnswer
                ? originalSelectedAnswers.includes(index)
                : selectedAnswers.includes(index);
              const showCorrectFeedback = !effectiveGdrMode && showAnswer && isCorrect && isSelected;
              const showMissedCorrectFeedback = !effectiveGdrMode && showAnswer && isCorrect && !isSelected;
              const showIncorrectFeedback = !effectiveGdrMode && showAnswer && !isCorrect && isSelected;
              const optionImage = showAnswer
                ? (currentQuestion?.optionImages && currentQuestion.optionImages[index])
                : (shuffledOptionImages[currentQuestionIndex] && shuffledOptionImages[currentQuestionIndex][index]);
              
              const questionKey = `${moduleId}_${currentQuestionIndex}`;
              let isStrikethrough = false;
              
              if (!showAnswer) {
                const mapping = optionMapping[currentQuestionIndex] || [];
                const originalIndex = mapping[index] !== undefined ? mapping[index] : index;
                isStrikethrough = strikethroughOptions[questionKey]?.has(originalIndex) || false;
              } else {
                isStrikethrough = strikethroughOptions[questionKey]?.has(index) || false;
              }

              const getOptionStyle = () => {
                if (effectiveGdrMode && showAnswer && isCorrect && isSelected) return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-500 shadow-lg shadow-green-500/30';
                if (effectiveGdrMode && showAnswer && isCorrect && !isSelected) return isDarkMode ? 'bg-transparent text-green-400 border-green-500 border-dashed' : 'bg-transparent text-green-700 border-green-500 border-dashed';
                if (effectiveGdrMode && showAnswer && !isCorrect && isSelected) return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500 shadow-lg shadow-red-500/30';
                if (showCorrectFeedback) return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-500 shadow-lg shadow-green-500/30';
                if (showMissedCorrectFeedback) return isDarkMode ? 'bg-transparent text-green-400 border-green-500 border-dashed' : 'bg-transparent text-green-700 border-green-500 border-dashed';
                if (showIncorrectFeedback) return 'bg-gradient-to-r from-red-500 to-red-600 text-white border-red-500 shadow-lg shadow-red-500/30';
                if (isSelected) return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-400';
                return isDarkMode ? 'bg-gray-700/50 text-gray-200 border-gray-600/50 hover:border-gray-500/50 hover:bg-gray-700/70' : 'bg-white/80 text-gray-800 border-gray-200/50 hover:border-gray-300/50 hover:bg-white';
              };

              const isCollapsed = showAnswer && collapsedChoices.has(index);
              const toggleCollapse = (e: React.MouseEvent) => {
                if (!showAnswer) return;
                e.stopPropagation();
                setCollapsedChoices(prev => {
                  const next = new Set(prev);
                  if (next.has(index)) next.delete(index);
                  else next.add(index);
                  return next;
                });
              };

              return (
                <div
                  key={index}
                  className={`rounded-xl sm:rounded-2xl border-2 transition-all duration-200 ${getOptionStyle()} ${!showAnswer && 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]'} ${isStrikethrough ? 'opacity-40' : ''} ${isCollapsed ? 'opacity-70' : ''}`}
                  onContextMenu={(e) => handleOptionRightClick(e, index)}
                  onClick={() => !showAnswer && handleAnswerSelect(index)}
                >
                  <div className="p-3 sm:p-5 flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-xs sm:text-base ${
                      effectiveGdrMode && showAnswer && isCorrect && isSelected ? 'bg-white/20' :
                      effectiveGdrMode && showAnswer && isCorrect && !isSelected ? 'border-2 border-green-500' :
                      effectiveGdrMode && showAnswer && !isCorrect && isSelected ? 'bg-white/20' :
                      showCorrectFeedback ? 'bg-white/20' :
                      showMissedCorrectFeedback ? 'border-2 border-green-500' :
                      showIncorrectFeedback ? 'bg-white/20' :
                      isSelected ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm' :
                      isDarkMode ? 'bg-gray-600/50' : 'bg-gray-100'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className={`flex-1 min-w-0 ${isStrikethrough ? 'line-through' : ''}`}>
                      <p className={`text-xs sm:text-base leading-relaxed break-words ${isCollapsed ? 'line-clamp-1' : ''}`}>{option}</p>
                      {optionImage && MODULE_IMAGE_CONFIGS[moduleId] && (() => {
                        const imgStr = Array.isArray(optionImage) ? optionImage[0] : String(optionImage);
                        const imgPath = imgStr.split(',')[0].trim();
                        const pageNum = extractPageFromImagePath(imgPath);
                        if (!pageNum) return null;
                        return (
                          <button
                            onClick={(e) => { e.stopPropagation(); setImageViewerPage(pageNum); setShowImageViewer(true); }}
                            className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                              isDarkMode
                                ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50'
                                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                            title={`Ouvrir à la page ${pageNum}`}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            p.{pageNum}
                          </button>
                        );
                      })()}
                    </div>
{(effectiveGdrMode && showAnswer && isCorrect && isSelected) && (
                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                           <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                         </svg>
                       </div>
                     )}
{(effectiveGdrMode && showAnswer && isCorrect && !isSelected) && (
                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 sm:w-5 sm:h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                           <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                         </svg>
                       </div>
                     )}
{(effectiveGdrMode && showAnswer && !isCorrect && isSelected) && (
                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                           <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                         </svg>
                       </div>
                     )}
{!effectiveGdrMode && showAnswer && showCorrectFeedback && (
                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                           <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                         </svg>
                       </div>
                     )}
{!effectiveGdrMode && showAnswer && showMissedCorrectFeedback && (
                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 sm:w-5 sm:h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                           <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                         </svg>
                       </div>
                     )}
{showIncorrectFeedback && (
                        <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                           <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                         </svg>
                       </div>
                     )}
{!effectiveGdrMode && showAnswer && hasGDR && (
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700" title="Grille de réponse correcte">
                          📖 GDR ✓
                        </span>
                      )}
                      {!effectiveGdrMode && showAnswer && hasGDR1 && (
                        <span className="flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700" title="Grille de réponse">
                          📖 GDR
                        </span>
                      )}
                    {showAnswer && (
                      <button onClick={toggleCollapse} className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors">
                        <svg className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    {showAnswer && questionStats && questionStats.total_answers > 0 && (() => {
                      const statCount = questionStats.option_counts[index] || 0;
                      const statPct = questionStats.total_answers > 0 ? Math.round((statCount / questionStats.total_answers) * 100) : 0;
const statTextColor = effectiveGdrMode && showAnswer && isCorrect && isSelected ? 'text-white/80' : effectiveGdrMode && showAnswer && isCorrect && !isSelected ? (isDarkMode ? 'text-green-400' : 'text-green-700') : effectiveGdrMode && showAnswer && !isCorrect && isSelected ? 'text-white/80' : showCorrectFeedback ? 'text-white/80' : showMissedCorrectFeedback ? (isDarkMode ? 'text-green-400' : 'text-green-700') : showIncorrectFeedback ? 'text-white/80' : isDarkMode ? 'text-gray-400' : 'text-gray-500';
                       const statBgColor = effectiveGdrMode && showAnswer && isCorrect && isSelected ? 'bg-white/15' : effectiveGdrMode && showAnswer && isCorrect && !isSelected ? (isDarkMode ? 'bg-green-400/10' : 'bg-green-100') : effectiveGdrMode && showAnswer && !isCorrect && isSelected ? 'bg-white/15' : showCorrectFeedback ? 'bg-white/15' : showMissedCorrectFeedback ? (isDarkMode ? 'bg-green-400/10' : 'bg-green-100') : showIncorrectFeedback ? 'bg-white/15' : isDarkMode ? 'bg-gray-600/50' : 'bg-gray-100';
                      return (
                        <span className={`basis-full sm:basis-auto flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold ${statTextColor} ${statBgColor}`}>
                          {statPct}% des réponses
                        </span>
                      );
                    })()}
                  </div>
                  
                  {!isCollapsed && showAnswer && optionImage && showExplanations && (() => {
                    const imagePaths = (Array.isArray(optionImage) ? optionImage.join(',') : String(optionImage)).split(',').map(img => img.trim()).filter(img => img);
                    if (imagePaths.length === 0) return null;
                    return (
                      <div className={`px-4 sm:px-5 pb-4 sm:pb-5 ${imagePaths.length > 1 ? 'grid grid-cols-2 gap-2' : ''}`}>
                        {imagePaths.map((imgPath, imgIndex) => (
                          <button
                            key={imgIndex}
                            onClick={() => setZoomedImage(imgPath.startsWith('http') ? imgPath : `/images/${imgPath}`)}
                            className="focus:outline-none"
                          >
                            <Image
                              src={imgPath.startsWith('http') ? imgPath : `/images/${imgPath}`}
                              alt={`Option ${String.fromCharCode(65 + index)}`}
                              width={400}
                              height={200}
                              className="rounded-lg sm:rounded-xl cursor-pointer hover:opacity-90 transition-opacity max-h-24 sm:max-h-32 object-contain shadow-md"
                            />
                          </button>
                        ))}
                      </div>
                    );
                  })()}

                  {!isCollapsed && showAnswer && answerExplanation && showExplanations && (
                    <div className={`px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t ${effectiveGdrMode && showAnswer && isCorrect && isSelected ? 'border-white/20' : effectiveGdrMode && showAnswer && isCorrect && !isSelected ? 'border-green-500/40' : effectiveGdrMode && showAnswer && !isCorrect && isSelected ? 'border-white/20' : showCorrectFeedback ? 'border-white/20' : showMissedCorrectFeedback ? 'border-green-500/40' : showIncorrectFeedback ? 'border-white/20' : isDarkMode ? 'border-gray-600/50' : 'border-gray-100'}`}>
                      <p className={`text-xs sm:text-sm leading-relaxed ${effectiveGdrMode && showAnswer && isCorrect && isSelected ? 'text-white/90' : effectiveGdrMode && showAnswer && isCorrect && !isSelected ? (isDarkMode ? 'text-green-400/90' : 'text-green-700') : effectiveGdrMode && showAnswer && !isCorrect && isSelected ? 'text-white/90' : showCorrectFeedback ? 'text-white/90' : showMissedCorrectFeedback ? (isDarkMode ? 'text-green-400/90' : 'text-green-700') : showIncorrectFeedback ? 'text-white/90' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {answerExplanation.replace(/\s*\((?:[^()]|\([^()]*\))*\)\.?/g, '').replace(/\s*\[GDR1?\]/g, '')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {showAnswer && currentQuestion?.overallExplanation && showExplanations && (
            <div className={`mx-3 sm:mx-6 sm:mx-8 mb-3 sm:mb-6 p-3 sm:p-5 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gradient-to-r from-gray-50 to-gray-100'} border ${isDarkMode ? 'border-gray-600/30' : 'border-gray-200/50'}`}>
              <h4 className={`font-semibold mb-2 sm:mb-3 text-sm sm:text-base ${isDarkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Explication générale
              </h4>
              <p className={`text-xs sm:text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                dangerouslySetInnerHTML={{ __html: currentQuestion.overallExplanation.replace(/<br\s*\/?>/gi, '\n').replace(/\n/g, '<br>') }}
              />
            </div>
          )}

          {showAnswer && !showExplanations && (
            <div className={`mx-3 sm:mx-6 sm:mx-8 mb-3 sm:mb-6`}>
              <UpgradePrompt
                variant="card"
                title="Explications disponibles avec la version complète"
                message="Soutenez LearnFMPA pour accéder aux explications détaillées illimitées et au suivi de progression complet."
                dailyCount={freeAnswersCount}
                dailyLimit={FREE_DISPLAY_LIMIT}
                resetTime={user?.daily_answer_reset}
              />
            </div>
          )}

          <div data-tutorial="module-actions" className={`p-3 sm:p-5 sm:p-6 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-100'} flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-6`}>
            <div className="w-full sm:w-auto flex justify-between sm:justify-start gap-2 sm:gap-4">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`px-3 sm:px-6 py-2 sm:py-3.5 rounded-xl font-medium transition-all flex items-center gap-1.5 sm:gap-2.5 text-sm sm:text-base ${
                  currentQuestionIndex === 0
                    ? 'opacity-40 cursor-not-allowed'
                    : isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200/50'
                }`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Précédent</span>
              </button>
              
              {!showAnswer ? (
                <div className="flex gap-2 sm:gap-3">
                  {selectedAnswers.length > 0 && (
                    <button
                      onClick={handleShowAnswer}
                      className="px-4 sm:px-7 py-2 sm:py-3.5 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 text-sm sm:text-base"
                    >
                      Valider
                    </button>
                  )}
                  <button
                    onClick={handleNextQuestion}
className={`px-3 sm:px-6 py-2 sm:py-3.5 rounded-xl font-medium transition-all flex items-center gap-1.5 sm:gap-2.5 text-sm sm:text-base ${
                      selectedAnswers.length === 0
                        ? isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200/50'
                        : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                    }`}
                  >
                    {currentQuestionIndex === activeQuestions.length - 1 ? 'Terminer' : 'Passer'}
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-4 sm:px-7 py-2 sm:py-3.5 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 flex items-center gap-1.5 sm:gap-2.5 text-sm sm:text-base"
                >
                  {currentQuestionIndex === activeQuestions.length - 1 ? 'Terminer' : 'Suivant'}
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
            
            <div className="w-full sm:flex-1 sm:max-w-xs order-first sm:order-none">
              <div className={`h-2.5 rounded-full ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200/80'} overflow-hidden`}>
                <div
                  className="h-2.5 rounded-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 transition-all duration-500 ease-out"
                  style={{ width: `${((currentQuestionIndex + 1) / activeQuestions.length) * 100}%` }}
                />
              </div>
              <p className={`text-center text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {Math.round(((currentQuestionIndex + 1) / activeQuestions.length) * 100)}% complété
              </p>
             </div>
           </div>
         </div>
        )}
      </div>

      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-lg flex items-center justify-center z-50 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-6 right-6 p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors shadow-lg"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <Image
            src={zoomedImage}
            alt="Image"
            width={1920}
            height={1080}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {showImageViewer && MODULE_IMAGE_CONFIGS[moduleId] && (
        <ImageViewer
          moduleId={moduleId}
          initialPage={imageViewerPage}
          onClose={() => setShowImageViewer(false)}
        />
      )}

      {showReportModal && currentQuestion && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowReportModal(false)}
        >
          <div
            className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-5 sm:p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Signaler cette question
                </h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className={`p-2 rounded-xl ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'} transition-colors`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Question {currentQuestionIndex + 1} - {module?.title || `Module ${moduleId}`}
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              {reportSubmitted ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Rapport envoyé !
                  </h4>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Merci pour votre signalement. Notre équipe va examiner la question.
                  </p>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <div className={`p-3 rounded-xl text-xs leading-relaxed ${isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
                    <p className={`font-medium mb-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Question :</p>
                    <p className="line-clamp-3">{currentQuestion.question}</p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Quels choix devraient être corrects ?
                    </label>
                    <div className="space-y-1.5">
                      {(showAnswer ? currentQuestion.options : (shuffledOptions[currentQuestionIndex] || [])).map((option, index) => {
                        const originalIdx = showAnswer ? index : (optionMapping[currentQuestionIndex]?.[index] ?? index);
                        const isSuggestedCorrect = reportSuggestedCorrect.includes(originalIdx);
                        return (
                          <button
                            key={index}
                            onClick={() => {
                              if (isSuggestedCorrect) {
                                setReportSuggestedCorrect(prev => prev.filter(i => i !== originalIdx));
                                setReportSuggestedIncorrect(prev => prev.includes(originalIdx) ? prev : [...prev, originalIdx]);
                              } else {
                                setReportSuggestedCorrect(prev => [...prev, originalIdx]);
                                setReportSuggestedIncorrect(prev => prev.filter(i => i !== originalIdx));
                              }
                            }}
                            className={`w-full text-left p-2.5 rounded-xl border-2 transition-all text-xs sm:text-sm ${isSuggestedCorrect ? 'border-green-500 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700' : reportSuggestedIncorrect.includes(originalIdx) ? 'border-red-500 bg-gradient-to-r from-red-50 to-orange-50 text-red-700' : isDarkMode ? 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                          >
                            <span className={`font-bold mr-1.5 ${isSuggestedCorrect ? 'text-green-600' : reportSuggestedIncorrect.includes(originalIdx) ? 'text-red-600' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {String.fromCharCode(65 + index)}
                            </span>
                            {option.length > 80 ? option.substring(0, 80) + '...' : option}
                            {isSuggestedCorrect && <span className="float-right font-semibold text-green-600">✓ Correct</span>}
                            {reportSuggestedIncorrect.includes(originalIdx) && <span className="float-right font-semibold text-red-600">✗ Incorrect</span>}
                          </button>
                        );
                      })}
                    </div>
                    <p className={`text-xs mt-1.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Cliquez pour indiquer si un choix devrait être correct (vert) ou incorrect (rouge).
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Justification *
                    </label>
                    <textarea
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Expliquez pourquoi cette question contient une erreur..."
                      rows={4}
                      className={`w-full p-3 rounded-xl border-2 text-sm resize-none ${isDarkMode ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'} focus:outline-none transition-colors`}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowReportModal(false)}
                      className={`flex-1 py-2.5 rounded-xl font-medium text-sm ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-colors`}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={async () => {
                        if (!reportReason.trim()) return;
                        setReportSubmitting(true);
                        try {
                          const res = await fetch('/api/report', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('learnfmpa_token') || ''}`,
                            },
                            body: JSON.stringify({
                              user_id: user?.id,
                              module_id: moduleId,
                              question_id: currentQuestion.id,
                              question_year: currentQuestion.year || '',
                              reason: reportReason,
                              suggested_correct: reportSuggestedCorrect,
                              suggested_incorrect: reportSuggestedIncorrect,
                              original_correct: currentQuestion.correctAnswers,
                              original_options: currentQuestion.options,
                              question_text: currentQuestion.question,
                            }),
                          });
                          if (res.ok) {
                            setReportSubmitted(true);
                          }
                        } catch {
                        } finally {
                          setReportSubmitting(false);
                        }
                      }}
                      disabled={!reportReason.trim() || reportSubmitting}
                      className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-all ${!reportReason.trim() || reportSubmitting ? 'opacity-50 cursor-not-allowed bg-gradient-to-r from-red-400 to-orange-400 text-white' : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 shadow-lg shadow-red-500/30'}`}
                    >
                      {reportSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Envoi...
                        </span>
                      ) : 'Envoyer le signalement'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    {showModuleTutorial && (
        <TutorialOverlay isDarkMode={isDarkMode} onClose={() => setShowModuleTutorial(false)} steps={MODULE_TUTORIAL_STEPS} storageKey="learnfmpa_module_tutorial_done" />
      )}
    </div>
  );
}
