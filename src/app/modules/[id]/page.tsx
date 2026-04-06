'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

  const moduleId = parseInt(params.id as string);
  const module = getModuleById(moduleId);

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

  if (!module) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`text-center p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl`}>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Module non trouvé</h1>
          <Link href="/dashboard" className="text-green-600 hover:text-green-700 font-medium">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

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
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <header className={`${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border-gray-700' : 'bg-white/95 backdrop-blur-sm border-gray-200'} border-b sticky top-0 z-10`}>
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Link
                  href="/dashboard"
                  className={`p-2 rounded-xl ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div className={`w-10 h-10 bg-gradient-to-br ${module.gradient} rounded-xl flex items-center justify-center`}>
                  <span className="text-white font-bold">{module.title.charAt(0)}</span>
                </div>
                <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{module.title}</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAnsweredQuestions(!showAnsweredQuestions)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${showAnsweredQuestions ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                >
                  {showAnsweredQuestions ? 'Masquer répondues' : 'Voir répondues'}
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-12 shadow-xl text-center border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              Félicitations !
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-8`}>
              Vous avez complété toutes les questions de ce module.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowAnsweredQuestions(true)}
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
              >
                Voir toutes les questions
              </button>
              <Link
                href="/dashboard"
                className={`px-8 py-4 ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} font-semibold rounded-xl transition-all`}
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
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 max-w-md w-full shadow-2xl`}>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} text-center mb-2`}>
              Réinitialiser la progression ?
            </h3>
            <p className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              Cette action supprimera toutes vos réponses correctes. Elle ne peut pas être annulée.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelResetProgress}
                className={`flex-1 px-4 py-3 rounded-xl font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} transition-all`}
              >
                Annuler
              </button>
              <button
                onClick={confirmResetProgress}
                className="flex-1 px-4 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-all"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      <header className={`${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border-gray-700' : 'bg-white/95 backdrop-blur-sm border-gray-200'} border-b sticky top-0 z-10`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard"
                className={`p-2 rounded-xl ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div className={`w-10 h-10 bg-gradient-to-br ${module.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                <span className="text-white font-bold">{module.title.charAt(0)}</span>
              </div>
              <div>
                <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{module.title}</h1>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{questions.length} questions</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                className={`px-3 py-2 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-700'} cursor-pointer`}
                value={sessionFilter}
                onChange={(e) => handleSessionFilterChange(e.target.value)}
              >
                <option value="Toutes les sessions">Toutes les sessions</option>
                {availableSessions.map(session => (
                  <option key={session} value={session}>{session}</option>
                ))}
              </select>
              <button
                onClick={() => setShowAnsweredQuestions(!showAnsweredQuestions)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${showAnsweredQuestions ? 'bg-green-100 text-green-700' : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
              >
                {showAnsweredQuestions ? 'Répondues' : 'Non répondues'}
              </button>
              <button
                onClick={handleResetProgress}
                className="px-3 py-2 rounded-xl text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-all"
              >
                Reset
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {sessionFilter === 'Toutes les sessions' && (
          <div className="mb-4">
            <button
              onClick={() => setShowChapters(!showChapters)}
              className={`w-full px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-900 hover:bg-gray-50'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Navigation par sujet
              </span>
              <svg className={`w-5 h-5 transform transition-transform ${showChapters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {chapterFilter && (
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Filtre actif:</span>
                <button
                  onClick={handleClearChapterFilter}
                  className="px-3 py-1 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-all flex items-center gap-1"
                >
                  {chapterFilter}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {sessionFilter === 'Toutes les sessions' && showChapters && (
          <Suspense fallback={<div className={`mb-6 p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} animate-pulse h-32`} />}>
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

        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} overflow-hidden transition-opacity duration-150 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          <div className={`p-6 sm:p-8 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-xl text-lg font-bold ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                  {currentQuestionIndex + 1}/{questions.length}
                </span>
                {currentQuestion && correctlyAnsweredQuestions[`${moduleId}_${currentQuestion.id}`] && (
                  <span className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              {currentQuestion?.chapter && (
                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                  {currentQuestion.chapter}
                </span>
              )}
            </div>
            <p className={`text-lg sm:text-xl leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
              {currentQuestion?.question}
            </p>
            <p className={`text-xs mt-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Clic droit sur une option pour la barrer
            </p>
          </div>

          {currentQuestion?.questionImage && (() => {
            const imagePaths = currentQuestion.questionImage.split(',').map(img => img.trim()).filter(img => img);
            if (imagePaths.length === 0) return null;
            return (
              <div className={`p-4 ${isDarkMode ? 'bg-gray-750' : 'bg-gray-50'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className={`grid ${imagePaths.length > 1 ? 'grid-cols-2 gap-2' : ''}`}>
                  {imagePaths.map((imgPath, imgIndex) => (
                    <button
                      key={imgIndex}
                      onClick={() => setZoomedImage(imgPath.startsWith('http') ? imgPath : `/images/${imgPath}`)}
                      className="focus:outline-none"
                    >
                      <Image
                        src={imgPath.startsWith('http') ? imgPath : `/images/${imgPath}`}
                        alt={`Question ${imgIndex + 1}`}
                        width={800}
                        height={400}
                        className="rounded-xl cursor-pointer hover:opacity-90 transition-opacity max-h-64 object-contain"
                      />
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {showAnswer && currentQuestion && (
            <div className={`px-6 py-3 ${isDarkMode ? 'bg-gray-750' : 'bg-gray-50'} border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div className="flex flex-wrap gap-2">
                {isCorrectlyAnswered && (
                  <span className="px-3 py-1 rounded-lg text-sm font-medium bg-green-500 text-white flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Correct
                  </span>
                )}
                {currentQuestion.confirmed && (
                  <span className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Vérifiée
                  </span>
                )}
                {currentQuestion.year && (
                  <span className="px-3 py-1 rounded-lg text-sm font-medium bg-purple-100 text-purple-700">
                    {currentQuestion.year}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="p-4 sm:p-6 space-y-3">
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
                if (showCorrectFeedback) return 'bg-green-500 text-white border-green-500';
                if (showMissedCorrectFeedback) return 'bg-red-100 text-red-800 border-red-300';
                if (showIncorrectFeedback) return 'bg-red-500 text-white border-red-500';
                if (isSelected) return 'bg-green-100 text-green-800 border-green-500';
                return isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600 hover:border-gray-500' : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300';
              };

              return (
                <div
                  key={index}
                  className={`rounded-xl border-2 transition-all ${getOptionStyle()} ${!showAnswer && 'cursor-pointer'}`}
                  onContextMenu={(e) => handleOptionRightClick(e, index)}
                  onClick={() => !showAnswer && handleAnswerSelect(index)}
                >
                  <div className="p-4 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                      showCorrectFeedback ? 'bg-white/20' :
                      showMissedCorrectFeedback ? 'bg-red-200' :
                      showIncorrectFeedback ? 'bg-white/20' :
                      isSelected ? 'bg-green-500 text-white' :
                      isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <div className={`flex-1 ${isStrikethrough ? 'line-through opacity-50' : ''}`}>
                      <p className="text-base">{option}</p>
                    </div>
                    {(showCorrectFeedback || showMissedCorrectFeedback) && (
                      <svg className="w-6 h-6 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {showIncorrectFeedback && (
                      <svg className="w-6 h-6 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  
                  {showAnswer && optionImage && (() => {
                    const imagePaths = optionImage.split(',').map(img => img.trim()).filter(img => img);
                    if (imagePaths.length === 0) return null;
                    return (
                      <div className={`px-4 pb-4 ${imagePaths.length > 1 ? 'grid grid-cols-2 gap-2' : ''}`}>
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
                              className="rounded-lg cursor-pointer hover:opacity-90 transition-opacity max-h-32 object-contain"
                            />
                          </button>
                        ))}
                      </div>
                    );
                  })()}

                  {showAnswer && answerExplanation && (
                    <div className={`px-4 pb-4 pt-2 border-t ${showCorrectFeedback ? 'border-white/20' : showIncorrectFeedback || showMissedCorrectFeedback ? 'border-red-200' : isDarkMode ? 'border-gray-600' : 'border-gray-100'}`}>
                      <p className={`text-sm ${showCorrectFeedback ? 'text-white/90' : showMissedCorrectFeedback ? 'text-red-700' : showIncorrectFeedback ? 'text-white/90' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {answerExplanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {showAnswer && currentQuestion?.overallExplanation && (
            <div className={`mx-4 sm:mx-6 mb-4 p-4 rounded-xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Explication générale</h4>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                dangerouslySetInnerHTML={{ __html: currentQuestion.overallExplanation.replace(/<br\s*\/?>/gi, '\n').replace(/\n/g, '<br>') }}
              />
            </div>
          )}

          <div className={`p-4 sm:p-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'} flex justify-between items-center gap-4`}>
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                currentQuestionIndex === 0
                  ? 'opacity-50 cursor-not-allowed'
                  : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Précédent
            </button>
            
            <div className="flex-1 max-w-xs">
              <div className={`h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
              <p className={`text-center text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}% complété
              </p>
            </div>
            
            {!showAnswer ? (
              <div className="flex gap-2">
                {selectedAnswers.length > 0 && (
                  <button
                    onClick={handleShowAnswer}
                    className="px-5 py-3 rounded-xl font-medium bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all shadow-lg"
                  >
                    Valider
                  </button>
                )}
                <button
                  onClick={handleNextQuestion}
                  className={`px-5 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
                    selectedAnswers.length === 0
                      ? isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                >
                  {currentQuestionIndex === questions.length - 1 ? 'Terminer' : 'Passer'}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-5 py-3 rounded-xl font-medium bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all shadow-lg flex items-center gap-2"
              >
                {currentQuestionIndex === questions.length - 1 ? 'Terminer' : 'Suivant'}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
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
            className="max-w-full max-h-[90vh] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
