'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getModuleById, getModuleQuestions, getModuleChapters, preloadModuleData, Question, Chapter, JsonQuestion, extractChaptersFromQuestions } from '@/data/modules';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

const ChapterNavigation = lazy(() => import('@/components/ChapterNavigation'));

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
  const { user, isLoading: authLoading, syncProgress, getProgress } = useAuth();
  const isDarkMode = theme === 'dark';
  const [allQuestions, setAllQuestions] = useState<ExtendedQuestion[]>([]);
  const [questions, setQuestions] = useState<ExtendedQuestion[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [showChapters, setShowChapters] = useState(false);
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
  const [collapsedChoices, setCollapsedChoices] = useState<Set<number>>(new Set());

  const moduleId = parseInt(params.id as string);
  const module = getModuleById(moduleId);
  const questionParam = searchParams.get('q');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (moduleId) {
      preloadModuleData(moduleId).then(({ questions: allQuestions }) => {
        const extendedQuestions = allQuestions.map(q => ({
          ...q,
          isMultipleChoice: q.isMultipleChoice || q.options.length > 2,
          correctAnswers: q.correctAnswers || [q.correctAnswer],
          answerExplanations: q.answerExplanations || Array(q.options.length).fill(''),
          overallExplanation: q.overallExplanation || q.explanation,
          questionImage: q.questionImage,
          optionImages: q.optionImages || Array(q.options.length).fill('')
        }));
        
        setAllQuestions(extendedQuestions);
        
        const sessions = [...new Set(extendedQuestions.map(q => q.year).filter(Boolean) as string[])]
          .sort((a, b) => {
            const months: { [key: string]: number } = {
              'janvier': 1, 'février': 2, 'mars': 3, 'avril': 4, 'mai': 5, 'juin': 6,
              'juillet': 7, 'août': 8, 'septembre': 9, 'octobre': 10, 'novembre': 11, 'décembre': 12
            };
            
            const parseSession = (session: string) => {
              const parts = session.toLowerCase().split(' ');
              if (parts.length === 2) {
                const month = months[parts[0] as keyof typeof months];
                const year = parseInt(parts[1]);
                return { month, year };
              }
              return { month: 0, year: parseInt(session) || 0 };
            };
            
            const sessionA = parseSession(a);
            const sessionB = parseSession(b);
            
            if (sessionA.year !== sessionB.year) return sessionB.year - sessionA.year;
            return sessionB.month - sessionA.month;
          });
        setAvailableSessions(sessions);
        
        filterQuestionsBySession(extendedQuestions, sessionFilter);
      });
    }
  }, [moduleId]);

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

  useEffect(() => {
    const loadProgress = async () => {
      if (typeof window !== 'undefined' && moduleId && user) {
        const storageKey = `learnfmpa_answered_${moduleId}`;
        
        // Load from localStorage
        let localProgress: { [key: string]: boolean } = {};
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            localProgress = JSON.parse(stored);
          } catch (e) {
            console.error('Error parsing answered questions from localStorage:', e);
          }
        }
        
        // Load from database
        try {
          const dbProgress = await getProgress(moduleId);
          const mergedProgress = { ...localProgress };
          
          // Merge database progress
          Object.entries(dbProgress).forEach(([key, value]: [string, any]) => {
            if (value?.is_correct) {
              mergedProgress[key] = true;
            }
          });
          
          setCorrectlyAnsweredQuestions(mergedProgress);
          localStorage.setItem(storageKey, JSON.stringify(mergedProgress));
        } catch (e) {
          // If database fails, use local progress
          setCorrectlyAnsweredQuestions(localProgress);
        }
      }
    };
    
    loadProgress();
  }, [moduleId, user, getProgress]);

  const currentQuestion = questions[currentQuestionIndex];

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

  const filterQuestionsBySession = (questionsToFilter: ExtendedQuestion[], session: string) => {
    setChapterFilter(null);
    
    if (session === 'Toutes les sessions') {
      getModuleChapters(moduleId).then(setChapters);
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
    
    applyAnsweredQuestionsFilter();
    setStrikethroughOptions({});
  };

  const applyAnsweredQuestionsFilter = () => {
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
      if (!year) return { month: 0, year: 0 };
      const parts = year.toLowerCase().split(' ');
      if (parts.length === 2) {
        const month = months[parts[0] as keyof typeof months];
        const yearNum = parseInt(parts[1]);
        return { month, year: yearNum };
      }
      return { month: 0, year: parseInt(year) || 0 };
    };
    
    baseQuestions.sort((a, b) => {
      const yearA = parseYear(a.year);
      const yearB = parseYear(b.year);
      
      if (yearA.year !== yearB.year) return yearB.year - yearA.year;
      return yearB.month - yearA.month;
    });

    if (chapterFilter) {
      baseQuestions = baseQuestions.filter(q => q.chapter === chapterFilter);
    }

    if (showAnsweredQuestions) {
      setQuestions(baseQuestions);
    } else {
      const unansweredQuestions = baseQuestions.filter(q => {
        const questionKey = `${moduleId}_${q.id}`;
        return !correctlyAnsweredQuestions[questionKey];
      });
      setQuestions(unansweredQuestions);
    }

    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowAnswer(false);
    setIsCorrectlyAnswered(false);
    setOriginalSelectedAnswers([]);
    setCollapsedChoices(new Set());
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
    
    const mapping = optionMapping[currentQuestionIndex] || [];
    const originalIndex = mapping[optionIndex] !== undefined ? mapping[optionIndex] : optionIndex;
    
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

  const handleShowAnswer = () => {
    if (selectedAnswers.length === 0 || !currentQuestion) return;

    const mapping = optionMapping[currentQuestionIndex] || [];
    const mappedSelectedAnswers = selectedAnswers.map(selectedIndex => mapping[selectedIndex]);
    setOriginalSelectedAnswers(mappedSelectedAnswers);

    const correctAnswersSet = new Set(currentQuestion.correctAnswers);
    const selectedAnswersSet = new Set(mappedSelectedAnswers);
    
    const defaultCollapsed = new Set<number>();
    currentQuestion.options.forEach((_, i) => {
      if (!correctAnswersSet.has(i) && !selectedAnswersSet.has(i)) {
        defaultCollapsed.add(i);
      }
    });
    setCollapsedChoices(defaultCollapsed);

    const allSelectedAreCorrect = mappedSelectedAnswers.every(answer => correctAnswersSet.has(answer));
    const allCorrectAreSelected = currentQuestion.correctAnswers.every(answer => selectedAnswersSet.has(answer));
    const isCorrect = allSelectedAreCorrect && allCorrectAreSelected;
    
    setIsCorrectlyAnswered(isCorrect);
    
    if (isCorrect) {
      setScore(score + 1);
    }

    setShowAnswer(true);
    setAnsweredQuestions(new Set([...answeredQuestions, currentQuestionIndex]));
    
    if (currentQuestion && typeof window !== 'undefined') {
      const storageKey = `learnfmpa_answered_${moduleId}`;
      const questionKey = `${moduleId}_${currentQuestion.id}`;
      const newAnsweredQuestions = { ...correctlyAnsweredQuestions, [questionKey]: isCorrect };
      setCorrectlyAnsweredQuestions(newAnsweredQuestions);
      localStorage.setItem(storageKey, JSON.stringify(newAnsweredQuestions));
      
      // Sync progress to database
      if (user) {
        syncProgress(moduleId, currentQuestion.id.toString(), isCorrect);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswers([]);
        setShowAnswer(false);
        setIsCorrectlyAnswered(false);
        setOriginalSelectedAnswers([]);
        setCollapsedChoices(new Set());
        setIsTransitioning(false);
        const newQuestionKey = `${moduleId}_${currentQuestionIndex + 1}`;
        setStrikethroughOptions(prev => {
          const newStrikethrough = { ...prev };
          delete newStrikethrough[newQuestionKey];
          return newStrikethrough;
        });
      }, 150);
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
        setIsTransitioning(false);
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

  const confirmResetProgress = () => {
    setCorrectlyAnsweredQuestions({});
    if (typeof window !== 'undefined' && moduleId) {
      const storageKey = `learnfmpa_answered_${moduleId}`;
      localStorage.removeItem(storageKey);
    }
    setShowResetConfirm(false);
  };

  const cancelResetProgress = () => {
    setShowResetConfirm(false);
  };

  if (questions.length === 0) {
    return (
      <div className={`min-h-screen relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'}`}>
        <div className={`absolute inset-0 ${isDarkMode ? 'opacity-30' : 'opacity-50'}`}>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
        </div>
        <header className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl border-b sticky top-0 z-10 shadow-sm`}>
          <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
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
                <div className={`w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br ${module.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20`}>
                  <span className="text-white font-bold text-sm sm:text-lg">{module.title.charAt(0)}</span>
                </div>
                <h1 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{module.title}</h1>
              </div>
              <button
                onClick={() => setShowAnsweredQuestions(!showAnsweredQuestions)}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-sm ${showAnsweredQuestions ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/25' : isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-gray-100/80 text-gray-700 hover:bg-gray-200/80'}`}
              >
                {showAnsweredQuestions ? 'Masquer' : 'Voir répondues'}
              </button>
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

      <header className={`${isDarkMode ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} backdrop-blur-xl border-b sticky top-0 z-10 shadow-sm`}>
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
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
                <div className={`w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br ${module.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20`}>
                  <span className="text-white font-bold text-sm sm:text-lg">{module.title.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <h1 className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>{module.title}</h1>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{questions.length} questions</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
              <select
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border text-xs sm:text-sm flex-shrink-0 ${isDarkMode ? 'bg-gray-700/50 border-gray-600/50 text-white' : 'bg-white/80 border-gray-200/50 text-gray-700'} cursor-pointer shadow-sm backdrop-blur-sm`}
                value={sessionFilter}
                onChange={(e) => handleSessionFilterChange(e.target.value)}
              >
                <option value="Toutes les sessions">Toutes</option>
                {availableSessions.map(session => (
                  <option key={session} value={session}>{session}</option>
                ))}
              </select>
              <button
                onClick={() => setShowAnsweredQuestions(!showAnsweredQuestions)}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all flex-shrink-0 shadow-sm ${showAnsweredQuestions ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/25' : isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-white/80 text-gray-700 hover:bg-gray-200/80'}`}
              >
                {showAnsweredQuestions ? 'Répondues' : 'Non répondues'}
              </button>
              <button
                onClick={handleResetProgress}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all flex-shrink-0 shadow-sm shadow-red-500/25"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 relative z-10">
        {sessionFilter === 'Toutes les sessions' && (
          <div className="mb-3 sm:mb-4">
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

        {sessionFilter === 'Toutes les sessions' && showChapters && (
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

        <div className={`${isDarkMode ? 'bg-gray-800/60' : 'bg-white/80'} backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'} overflow-hidden transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'}`}>
          <div className={`p-5 sm:p-8 border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2.5 sm:gap-4">
                <span className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-base sm:text-lg font-bold ${isDarkMode ? 'bg-gradient-to-r from-gray-700 to-gray-600 text-white' : 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900'} shadow-sm`}>
                  {currentQuestionIndex + 1}/{questions.length}
                </span>
                {currentQuestion && correctlyAnsweredQuestions[`${moduleId}_${currentQuestion.id}`] && (
                  <span className="w-7 h-7 sm:w-9 sm:h-9 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              {currentQuestion?.chapter && (
                <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium truncate max-w-[50%] ${isDarkMode ? 'bg-gradient-to-r from-green-900/40 to-emerald-900/40 text-green-400' : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'} shadow-sm`}>
                  {currentQuestion.chapter}
                </span>
              )}
            </div>
            <p className={`text-base sm:text-lg sm:text-xl leading-relaxed ${isDarkMode ? 'text-gray-100' : 'text-gray-800'} font-medium`}>
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
            <div className={`px-4 sm:px-8 py-3 sm:py-4 ${isDarkMode ? 'bg-gray-750/50' : 'bg-gray-50/50'} border-b ${isDarkMode ? 'border-gray-700/50' : 'border-gray-100'}`}>
              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                {isCorrectlyAnswered && (
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center gap-1.5 shadow-lg shadow-green-500/25">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Correct
                  </span>
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

          <div className="p-4 sm:p-5 sm:p-8 space-y-3 sm:space-y-4">
            {(showAnswer ? currentQuestion?.options : (shuffledOptions[currentQuestionIndex] || [])).map((option, index) => {
              const isCorrect = showAnswer
                ? (currentQuestion?.correctAnswers || []).includes(index)
                : (shuffledCorrectAnswers[currentQuestionIndex] || []).includes(index);
              const isSelected = showAnswer
                ? originalSelectedAnswers.includes(index)
                : selectedAnswers.includes(index);
              const showCorrectFeedback = showAnswer && isCorrect && isSelected;
              const showMissedCorrectFeedback = showAnswer && isCorrect && !isSelected;
              const showIncorrectFeedback = showAnswer && !isCorrect && isSelected;
              const optionImage = showAnswer
                ? (currentQuestion?.optionImages && currentQuestion.optionImages[index])
                : (shuffledOptionImages[currentQuestionIndex] && shuffledOptionImages[currentQuestionIndex][index]);
              const answerExplanation = showAnswer
                ? (currentQuestion?.answerExplanations && currentQuestion.answerExplanations[index])
                : (shuffledAnswerExplanations[currentQuestionIndex] && shuffledAnswerExplanations[currentQuestionIndex][index]);
              
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
                if (showCorrectFeedback) return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-500 shadow-lg shadow-green-500/30';
                if (showMissedCorrectFeedback) return 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-300';
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
                  <div className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm sm:text-base ${
                      showCorrectFeedback ? 'bg-white/20' :
                      showMissedCorrectFeedback ? 'bg-red-200' :
                      showIncorrectFeedback ? 'bg-white/20' :
                      isSelected ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-sm' :
                      isDarkMode ? 'bg-gray-600/50' : 'bg-gray-100'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className={`flex-1 min-w-0 ${isStrikethrough ? 'line-through' : ''}`}>
                      <p className={`text-sm sm:text-base leading-relaxed break-words ${isCollapsed ? 'line-clamp-1' : ''}`}>{option}</p>
                    </div>
                    {(showCorrectFeedback || showMissedCorrectFeedback) && (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {showIncorrectFeedback && (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {showAnswer && (
                      <button onClick={toggleCollapse} className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 transition-colors">
                        <svg className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {!isCollapsed && showAnswer && optionImage && (() => {
                    const imagePaths = optionImage.split(',').map(img => img.trim()).filter(img => img);
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

                  {!isCollapsed && showAnswer && answerExplanation && (
                    <div className={`px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t ${showCorrectFeedback ? 'border-white/20' : showIncorrectFeedback || showMissedCorrectFeedback ? 'border-red-200' : isDarkMode ? 'border-gray-600/50' : 'border-gray-100'}`}>
                      <p className={`text-xs sm:text-sm leading-relaxed ${showCorrectFeedback ? 'text-white/90' : showMissedCorrectFeedback ? 'text-red-700' : showIncorrectFeedback ? 'text-white/90' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {answerExplanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {showAnswer && currentQuestion?.overallExplanation && (
            <div className={`mx-4 sm:mx-6 sm:mx-8 mb-4 sm:mb-6 p-4 sm:p-5 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-gray-700/50' : 'bg-gradient-to-r from-gray-50 to-gray-100'} border ${isDarkMode ? 'border-gray-600/30' : 'border-gray-200/50'}`}>
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

          <div className={`p-4 sm:p-5 sm:p-6 border-t ${isDarkMode ? 'border-gray-700/50' : 'border-gray-100'} flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6`}>
            <div className="w-full sm:w-auto flex justify-between sm:justify-start gap-3 sm:gap-4">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className={`px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-medium transition-all flex items-center gap-2 sm:gap-2.5 text-sm sm:text-base ${
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
                      className="px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 text-sm sm:text-base"
                    >
                      Valider
                    </button>
                  )}
                  <button
                    onClick={handleNextQuestion}
                    className={`px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-medium transition-all flex items-center gap-2 sm:gap-2.5 text-sm sm:text-base ${
                      selectedAnswers.length === 0
                        ? isDarkMode ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200/50'
                        : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700'
                    }`}
                  >
                    {currentQuestionIndex === questions.length - 1 ? 'Terminer' : 'Passer'}
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl font-semibold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/30 flex items-center gap-2 sm:gap-2.5 text-sm sm:text-base"
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Terminer' : 'Suivant'}
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
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
              <p className={`text-center text-xs sm:text-sm mt-2 sm:mt-2.5 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% complété
              </p>
            </div>
          </div>
        </div>
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
    </div>
  );
}
