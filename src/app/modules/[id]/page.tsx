'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getModuleById, getModuleQuestions, getModuleChapters, preloadModuleData, Question, Chapter, JsonQuestion, extractChaptersFromQuestions } from '@/data/modules';
import { useTheme } from '@/contexts/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';

// Lazy load the chapter navigation component
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

  const moduleId = parseInt(params.id as string);
  const module = getModuleById(moduleId);

  useEffect(() => {
    if (moduleId) {
      // Use optimized preload function to minimize edge requests
      preloadModuleData(moduleId).then(({ questions: allQuestions }) => {
        // Convert to ExtendedQuestion format
        const extendedQuestions = allQuestions.map(q => ({
          ...q,
          // Automatically enable multiple choice for questions with more than 2 options
          isMultipleChoice: q.isMultipleChoice || q.options.length > 2,
          correctAnswers: q.correctAnswers || [q.correctAnswer],
          answerExplanations: q.answerExplanations || Array(q.options.length).fill(''),
          overallExplanation: q.overallExplanation || q.explanation,
          questionImage: q.questionImage,
          optionImages: q.optionImages || Array(q.options.length).fill('')
        }));
        
        setAllQuestions(extendedQuestions);
        
        // Extract available sessions from questions and sort from newest to oldest
        const sessions = [...new Set(extendedQuestions.map(q => q.year).filter(Boolean) as string[])]
          .sort((a, b) => {
            // Parse session names to sort them chronologically (newest first)
            // Assuming format like "Février 2024", "Octobre 2023", etc.
            const months = {
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
              // Fallback for other formats (e.g., just a year)
              return { month: 0, year: parseInt(session) || 0 };
            };
            
            const sessionA = parseSession(a);
            const sessionB = parseSession(b);
            
            // Sort by year first (newest first), then by month (newest first)
            if (sessionA.year !== sessionB.year) {
              return sessionB.year - sessionA.year;
            }
            return sessionB.month - sessionA.month;
          });
        setAvailableSessions(sessions);
        
        // Apply initial session filter
        filterQuestionsBySession(extendedQuestions, sessionFilter);
      });
    }
  }, [moduleId]);

  useEffect(() => {
    if (allQuestions.length > 0) {
      filterQuestionsBySession(allQuestions, sessionFilter);
    }
  }, [sessionFilter, allQuestions]);

  // Load correctly answered questions from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && moduleId) {
      const storageKey = `learnfmpa_answered_${moduleId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCorrectlyAnsweredQuestions(parsed);
        } catch (e) {
          console.error('Error parsing answered questions from localStorage:', e);
        }
      }
    }
  }, [moduleId]);

  const filterQuestionsBySession = (questionsToFilter: ExtendedQuestion[], session: string) => {
    // Reset chapter filter when session changes
    setChapterFilter(null);
    
    if (session === 'Toutes les sessions') {
      setQuestions(questionsToFilter);
      // Use cached chapters to avoid redundant imports
      getModuleChapters(moduleId).then(setChapters);
    } else {
      const filteredQuestions = questionsToFilter.filter(q => q.year === session);
      setQuestions(filteredQuestions);
      
      // Derive chapters from already loaded questions to avoid redundant imports
      const filteredJsonQuestions = filteredQuestions.map(q => {
        // Convert ExtendedQuestion back to JsonQuestion format for chapter extraction
        return {
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
        } as JsonQuestion;
      });
      
      const chaptersFromFiltered = extractChaptersFromQuestions(filteredJsonQuestions);
      setChapters(chaptersFromFiltered);
    }
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowAnswer(false);
    // Clear all strikethrough options when changing session filter
    setStrikethroughOptions({});
  };

  if (!module) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Module non trouvé</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  // Initialize shuffled options for the current question
  useEffect(() => {
    if (currentQuestion) {
      // Check if this is a two-choice question
      const isTwoChoiceQuestion = currentQuestion.options.length === 2;
      
      if (isTwoChoiceQuestion) {
        // For two-choice questions, don't shuffle and use original options
        const originalOptions = [...currentQuestion.options];
        const originalCorrectAnswers = [...currentQuestion.correctAnswers];
        const originalAnswerExplanations = [...currentQuestion.answerExplanations];
        const originalOptionImages = currentQuestion.optionImages ? [...currentQuestion.optionImages] : Array(currentQuestion.options.length).fill('');
        
        // Create identity mapping (no shuffling)
        const indices = originalOptions.map((_, index) => index);
        const newOptionMapping = indices;
        
        // Update the state with original data (no shuffling)
        setShuffledOptions(prev => {
          const newShuffled = [...prev];
          newShuffled[currentQuestionIndex] = originalOptions;
          return newShuffled;
        });
        
        setOptionMapping(prev => {
          const newMapping = [...prev];
          newMapping[currentQuestionIndex] = newOptionMapping;
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
        // Create a shuffled version of the options for questions with more than 2 choices
        const originalOptions = [...currentQuestion.options];
        const originalCorrectAnswers = [...currentQuestion.correctAnswers];
        const originalAnswerExplanations = [...currentQuestion.answerExplanations];
        const originalOptionImages = currentQuestion.optionImages ? [...currentQuestion.optionImages] : Array(currentQuestion.options.length).fill('');
        
        // Create an array of indices and shuffle it
        const indices = originalOptions.map((_, index) => index);
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        
        // Create the shuffled arrays using the shuffled indices
        const newShuffledOptions = indices.map(i => originalOptions[i]);
        const newShuffledCorrectAnswers = originalCorrectAnswers.map(originalIndex =>
          indices.indexOf(originalIndex)
        );
        const newShuffledAnswerExplanations = indices.map(i => originalAnswerExplanations[i]);
        const newShuffledOptionImages = indices.map(i => originalOptionImages[i]);
        
        // Create the mapping from shuffled to original indices
        const newOptionMapping = indices.map((originalIndex, shuffledIndex) => originalIndex);
        
        // Update the state
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
      // Toggle selection for multiple choice questions
      if (selectedAnswers.includes(answerIndex)) {
        setSelectedAnswers(selectedAnswers.filter(i => i !== answerIndex));
      } else {
        setSelectedAnswers([...selectedAnswers, answerIndex]);
      }
    } else {
      // Toggle selection for single choice questions
      if (selectedAnswers.includes(answerIndex)) {
        // Deselect if clicking the same option
        setSelectedAnswers([]);
      } else {
        // Select the new option
        setSelectedAnswers([answerIndex]);
      }
    }
  };

  const handleOptionRightClick = (e: React.MouseEvent, optionIndex: number) => {
    e.preventDefault(); // Prevent context menu
    
    const questionKey = `${moduleId}_${currentQuestionIndex}`;
    const currentStrikethrough = strikethroughOptions[questionKey] || new Set();
    
    // Toggle strikethrough for this option
    const newStrikethrough = new Set(currentStrikethrough);
    if (newStrikethrough.has(optionIndex)) {
      newStrikethrough.delete(optionIndex);
    } else {
      newStrikethrough.add(optionIndex);
    }
    
    setStrikethroughOptions(prev => ({
      ...prev,
      [questionKey]: newStrikethrough
    }));
  };

  const handleShowAnswer = () => {
    if (selectedAnswers.length === 0 || !currentQuestion) return;

    // Map selected answers back to original positions for validation
    const mapping = optionMapping[currentQuestionIndex] || [];
    const mappedSelectedAnswers = selectedAnswers.map(selectedIndex => mapping[selectedIndex]);
    // Store the original indices for display when showing answer
    setOriginalSelectedAnswers(mappedSelectedAnswers);

    // Map correct answers to original positions for comparison
    const correctAnswersSet = new Set(currentQuestion.correctAnswers);
    const selectedAnswersSet = new Set(mappedSelectedAnswers);
    
    // Check if all selected answers are correct and all correct answers are selected
    const allSelectedAreCorrect = mappedSelectedAnswers.every(answer => correctAnswersSet.has(answer));
    const allCorrectAreSelected = currentQuestion.correctAnswers.every(answer => selectedAnswersSet.has(answer));
    const isCorrect = allSelectedAreCorrect && allCorrectAreSelected;
    
    setIsCorrectlyAnswered(isCorrect);
    
    if (isCorrect) {
      setScore(score + 1);
    }

    setShowAnswer(true);
    setAnsweredQuestions(new Set([...answeredQuestions, currentQuestionIndex]));
    
    // Save correctly answered question to localStorage
    if (isCorrect && currentQuestion && typeof window !== 'undefined') {
      const storageKey = `learnfmpa_answered_${moduleId}`;
      const questionKey = `${moduleId}_${currentQuestion.id}`;
      const newAnsweredQuestions = { ...correctlyAnsweredQuestions, [questionKey]: true };
      setCorrectlyAnsweredQuestions(newAnsweredQuestions);
      localStorage.setItem(storageKey, JSON.stringify(newAnsweredQuestions));
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswers([]);
      setShowAnswer(false);
      setIsCorrectlyAnswered(false);
      setOriginalSelectedAnswers([]);
      // Clear strikethrough for the new question
      const newQuestionKey = `${moduleId}_${currentQuestionIndex + 1}`;
      setStrikethroughOptions(prev => {
        const newStrikethrough = { ...prev };
        delete newStrikethrough[newQuestionKey];
        return newStrikethrough;
      });
    } else {
      // End of questions
      router.push('/dashboard');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setSelectedAnswers([]);
      setShowAnswer(false);
      setIsCorrectlyAnswered(false);
      setOriginalSelectedAnswers([]);
      // Clear strikethrough for the new question
      const newQuestionKey = `${moduleId}_${currentQuestionIndex - 1}`;
      setStrikethroughOptions(prev => {
        const newStrikethrough = { ...prev };
        delete newStrikethrough[newQuestionKey];
        return newStrikethrough;
      });
    }
  };

  const handleChapterSelect = (chapterName: string) => {
    // Toggle chapter filter: if clicking the same chapter, clear the filter
    if (chapterFilter === chapterName) {
      setChapterFilter(null);
      // Restore all questions for the current session
      if (sessionFilter === 'Toutes les sessions') {
        setQuestions(allQuestions);
        getModuleChapters(moduleId).then(setChapters);
      } else {
        const filteredQuestions = allQuestions.filter(q => q.year === sessionFilter);
        setQuestions(filteredQuestions);
      }
      setCurrentQuestionIndex(0);
    } else {
      // Set the chapter filter
      setChapterFilter(chapterName);
      // Filter questions by chapter
      const filteredQuestions = allQuestions.filter(q => {
        const matchesSession = sessionFilter === 'Toutes les sessions' || q.year === sessionFilter;
        const matchesChapter = q.chapter === chapterName;
        return matchesSession && matchesChapter;
      });
      setQuestions(filteredQuestions);
      setCurrentQuestionIndex(0);
    }
    setSelectedAnswers([]);
    setShowAnswer(false);
    setIsCorrectlyAnswered(false);
    // Clear all strikethrough options when changing chapter filter
    setStrikethroughOptions({});
  };

  const handleClearChapterFilter = () => {
    setChapterFilter(null);
    // Restore all questions for the current session
    if (sessionFilter === 'Toutes les sessions') {
      setQuestions(allQuestions);
      getModuleChapters(moduleId).then(setChapters);
    } else {
      const filteredQuestions = allQuestions.filter(q => q.year === sessionFilter);
      setQuestions(filteredQuestions);
    }
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowAnswer(false);
    setIsCorrectlyAnswered(false);
    // Clear all strikethrough options when clearing chapter filter
    setStrikethroughOptions({});
  };

  const handleSessionFilterChange = (newSession: string) => {
    setSessionFilter(newSession);
  };

  const handleResetProgress = () => {
    setShowResetConfirm(true);
  };

  const confirmResetProgress = () => {
    // Clear the correctly answered questions state
    setCorrectlyAnsweredQuestions({});
    // Clear from localStorage
    if (typeof window !== 'undefined' && moduleId) {
      const storageKey = `learnfmpa_answered_${moduleId}`;
      localStorage.removeItem(storageKey);
    }
    setShowResetConfirm(false);
  };

  const cancelResetProgress = () => {
    setShowResetConfirm(false);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg p-4 sm:p-6 max-w-md w-full border`}>
            <h3 className={`text-base sm:text-lg font-bold mb-2 sm:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Réinitialiser la progression ?
            </h3>
            <p className={`mb-4 sm:mb-6 text-xs sm:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Êtes-vous sûr de vouloir réinitialiser toutes les réponses correctes pour ce module ? Cette action ne peut pas être annulée.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={cancelResetProgress}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={confirmResetProgress}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors bg-red-500 hover:bg-red-600 text-xs sm:text-sm`}
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-10 shadow-sm`}>
        <div className="max-w-4xl lg:max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-4 lg:py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 w-full sm:w-auto">
              <Link
                href="/dashboard"
                className={`p-1.5 sm:p-2 lg:p-2.5 rounded-lg ${isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-all hover:shadow-md flex-shrink-0`}
                aria-label="Retour au tableau de bord"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
              </Link>
              <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-blue-500 flex-shrink-0`}>
                <span className="text-white font-bold text-xs sm:text-base">{module.title.charAt(0)}</span>
              </div>
              <h1 className={`text-sm sm:text-lg lg:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} hidden sm:block truncate`}>{module.title}</h1>
              <h1 className={`text-sm sm:text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} sm:hidden truncate`}>{module.title.length > 20 ? module.title.substring(0, 20) + '...' : module.title}</h1>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-3 lg:space-x-4 w-full sm:w-auto justify-end">
              <select
                className={`px-2 py-1.5 sm:px-3 lg:px-4 lg:py-2 rounded-lg border text-[10px] sm:text-xs lg:text-sm cursor-pointer hover:border-blue-500 transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'} max-w-[120px] sm:max-w-none`}
                value={sessionFilter}
                onChange={(e) => handleSessionFilterChange(e.target.value)}
              >
                <option value="Toutes les sessions">Toutes</option>
                {availableSessions.map(session => (
                  <option key={session} value={session}>{session.length > 15 ? session.substring(0, 15) + '...' : session}</option>
                ))}
              </select>
              <button
                onClick={handleResetProgress}
                className={`px-2 py-1.5 sm:px-3 lg:px-4 lg:py-2 rounded-lg text-[10px] sm:text-xs lg:text-sm font-medium transition-all flex-shrink-0 hover:shadow-md ${
                  isDarkMode
                    ? 'bg-red-900 text-red-300 hover:bg-red-800 hover:-translate-y-0.5'
                    : 'bg-red-100 text-red-700 hover:bg-red-200 hover:-translate-y-0.5'
                }`}
                aria-label="Réinitialiser la progression"
              >
                <span className="hidden sm:inline">Réinitialiser</span>
                <span className="sm:hidden">Reset</span>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl lg:max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6 lg:py-8">
        {/* Chapter Navigation Toggle Button - Only show when "Toutes les sessions" is selected */}
        {sessionFilter === 'Toutes les sessions' && (
          <div className="mb-3 sm:mb-4 lg:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => setShowChapters(!showChapters)}
                className={`px-2.5 py-2 sm:px-4 lg:px-5 lg:py-2.5 rounded-lg font-medium transition-all flex items-center text-xs sm:text-sm lg:text-base hover:shadow-md ${
                  isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700 hover:-translate-y-0.5' : 'bg-white text-gray-900 hover:bg-gray-50 hover:-translate-y-0.5'
                } border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 transform transition-transform ${showChapters ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="hidden sm:inline">Navigation par sujet</span>
                <span className="sm:hidden">Sujets</span>
              </button>
              {chapterFilter && (
                <button
                  onClick={handleClearChapterFilter}
                  className={`px-2.5 py-2 sm:px-4 lg:px-5 lg:py-2.5 rounded-lg font-medium transition-all flex items-center text-xs sm:text-sm lg:text-base hover:shadow-md ${
                    isDarkMode ? 'bg-blue-900 text-blue-300 hover:bg-blue-800 hover:-translate-y-0.5' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:-translate-y-0.5'
                  } border ${isDarkMode ? 'border-blue-700' : 'border-blue-300'}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden sm:inline">Effacer le filtre</span>
                  <span className="sm:hidden">Effacer</span>
                </button>
              )}
            </div>
            <span className={`text-[10px] sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Session: {sessionFilter}
            </span>
          </div>
        )}

        {/* Chapter Navigation - Only show when "Toutes les sessions" is selected and chapters are toggled */}
        {sessionFilter === 'Toutes les sessions' && showChapters && (
          <Suspense fallback={
            <div className={`mb-6 p-3 sm:p-4 lg:p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            </div>
          }>
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

        {/* Session info when not showing chapter navigation */}
        {sessionFilter !== 'Toutes les sessions' && (
          <div className="mb-4 flex justify-end">
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Session: {sessionFilter}
            </span>
          </div>
        )}

        {/* Question Section */}
        <div className={`p-3 sm:p-6 lg:p-8 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
          <div className="mb-3 sm:mb-6 lg:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-4 lg:mb-6 gap-1 sm:gap-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3">
                <h2 className={`text-base sm:text-xl md:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Q{currentQuestionIndex + 1}/{questions.length}
                </h2>
                {chapterFilter && (
                  <span className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'} truncate max-w-[100px] sm:max-w-none`}>
                    {chapterFilter}
                  </span>
                )}
                {currentQuestion && correctlyAnsweredQuestions[`${moduleId}_${currentQuestion.id}`] && (
                  <span className="inline-flex items-center">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
            <p className={`text-sm sm:text-lg lg:text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{currentQuestion?.question}</p>
            <p className={`text-[10px] sm:text-sm lg:text-sm mt-1.5 sm:mt-2 lg:mt-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} italic`}>
              💡 Clic droit pour barrer
            </p>
          </div>

          {/* Question Image */}
          {currentQuestion?.questionImage && (
            <div className="mb-3 sm:mb-4 relative">
              <Image
                src={currentQuestion.questionImage.startsWith('http')
                  ? currentQuestion.questionImage
                  : `/images/${currentQuestion.questionImage}`}
                alt="Question image"
                width={800}
                height={600}
                className={`rounded-lg ${isDarkMode ? 'border border-gray-600' : ''}`}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          )}

          {/* Feedback Tags */}
          {showAnswer && currentQuestion && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              {currentQuestion.confirmed && (
                <div className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium flex items-center ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline">Confirmée</span>
                  <span className="sm:hidden">Confirmée</span>
                </div>
              )}
              {isCorrectlyAnswered && (
                <div className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium flex items-center ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Correct
                </div>
              )}
              {sessionFilter === 'Toutes les sessions' && currentQuestion?.year && (
                <div className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-sm font-medium flex items-center ${isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  {currentQuestion.year}
                </div>
              )}
            </div>
          )}

          {/* Answer Options */}
          <div className="space-y-1.5 sm:space-y-3 lg:space-y-4 mb-3 sm:mb-6 lg:mb-8">
            {(showAnswer ? currentQuestion?.options : (shuffledOptions[currentQuestionIndex] || [])).map((option, index) => {
              // When showing answer, use original options and correct answers
              // When not showing answer, use shuffled options
              const isCorrect = showAnswer
                ? (currentQuestion?.correctAnswers || []).includes(index)
                : (shuffledCorrectAnswers[currentQuestionIndex] || []).includes(index);
              const isSelected = showAnswer
                ? originalSelectedAnswers.includes(index)
                : selectedAnswers.includes(index);
              // When answer is shown:
              // - Correct AND selected = green (correctly chosen)
              // - Correct AND NOT selected = red (missed correct answer)
              // - Incorrect AND selected = red (wrongly chosen)
              // - Incorrect AND NOT selected = white (stays white)
              const showCorrectFeedback = showAnswer && isCorrect && isSelected;
              const showMissedCorrectFeedback = showAnswer && isCorrect && !isSelected;
              const showIncorrectFeedback = showAnswer && !isCorrect && isSelected;
              const optionImage = showAnswer
                ? (currentQuestion?.optionImages && currentQuestion.optionImages[index])
                : (shuffledOptionImages[currentQuestionIndex] && shuffledOptionImages[currentQuestionIndex][index]);
              const answerExplanation = showAnswer
                ? (currentQuestion?.answerExplanations && currentQuestion.answerExplanations[index])
                : (shuffledAnswerExplanations[currentQuestionIndex] && shuffledAnswerExplanations[currentQuestionIndex][index]);
              
              // Check if this option is marked for strikethrough
              // When showing answer, we need to map the original index to the shuffled index for strikethrough
              const questionKey = `${moduleId}_${currentQuestionIndex}`;
              let isStrikethrough = false;
              if (!showAnswer) {
                isStrikethrough = strikethroughOptions[questionKey]?.has(index) || false;
              } else {
                // When showing answer, check if any shuffled position that maps to this original index is struck
                const mapping = optionMapping[currentQuestionIndex] || [];
                isStrikethrough = mapping.some((originalIndex, shuffledIndex) =>
                  originalIndex === index && strikethroughOptions[questionKey]?.has(shuffledIndex)
                );
              }
              
              return (
                <div
                  key={index}
                  className={`w-full p-2 sm:p-4 lg:p-5 rounded-lg border transition-all hover:shadow-sm ${
                    showCorrectFeedback
                      ? isDarkMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-500'
                      : showMissedCorrectFeedback
                      ? isDarkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-500'
                      : showIncorrectFeedback
                      ? isDarkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-500'
                      : isSelected
                      ? isDarkMode ? 'border-blue-500 bg-blue-900' : 'border-blue-500 bg-blue-50'
                      : isDarkMode
                      ? 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                  onContextMenu={(e) => handleOptionRightClick(e, index)}
                >
                  <button
                    onClick={() => handleAnswerSelect(index)}
                    className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                    disabled={showAnswer}
                  >
                    <div className="flex items-start">
                      <div className={`w-4 h-4 sm:w-6 sm:h-6 rounded border-2 mr-1.5 sm:mr-3 mt-0.5 flex-shrink-0 flex items-center justify-center ${
                        currentQuestion.isMultipleChoice
                          ? 'rounded'
                          : 'rounded-full'
                      } ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : showCorrectFeedback
                          ? 'border-green-500 bg-green-500'
                          : isDarkMode
                          ? 'border-gray-500'
                          : 'border-gray-400'
                      }`}>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded bg-white"></div>
                        )}
                        {showCorrectFeedback && !isSelected && (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded bg-white"></div>
                        )}
                      </div>
                      <div className={`text-left text-xs sm:text-base lg:text-lg ${isSelected && !showAnswer ? (isDarkMode ? 'text-white' : 'text-gray-900') : (isDarkMode ? 'text-gray-100' : 'text-gray-900')} ${isStrikethrough ? 'line-through opacity-60' : ''}`}>
                        <span className="font-semibold">{String.fromCharCode(65 + index)}. </span>
                        {option}
                      </div>
                    </div>
                  </button>
                  
                  {/* Option Image (shown after answer is revealed) */}
                  {showAnswer && optionImage && (
                    <div className="mt-2 sm:mt-3 relative">
                      <Image
                        src={optionImage.startsWith('http')
                          ? optionImage
                          : `/images/${optionImage}`}
                        alt={`Option ${String.fromCharCode(65 + index)} image`}
                        width={600}
                        height={400}
                        className={`rounded-lg ${isDarkMode ? 'border border-gray-600' : ''}`}
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    </div>
                  )}
                  
                  {/* Answer Explanation */}
                  {showAnswer && answerExplanation && (
                    <div className={`mt-1.5 sm:mt-3 pt-1.5 sm:pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className={`text-[10px] sm:text-sm ${
                        showCorrectFeedback
                          ? isDarkMode ? 'text-green-300' : 'text-green-700'
                          : showMissedCorrectFeedback
                          ? isDarkMode ? 'text-red-300' : 'text-red-700'
                          : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <span className="font-semibold">
                          {showCorrectFeedback ? 'Correct. ' : showMissedCorrectFeedback ? 'Manquée. ' : 'Incorrect. '}
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: answerExplanation.replace(/<br\s*\/?>/gi, '\n').replace(/\n/g, '<br>') }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* General Explanation Section */}
          {showAnswer && currentQuestion && currentQuestion.overallExplanation && (
            <div className={`p-2 sm:p-4 lg:p-6 rounded-lg mb-3 sm:mb-6 lg:mb-8 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border shadow-sm`}>
              <h3 className={`font-bold mb-1.5 sm:mb-2 lg:mb-3 text-xs sm:text-base lg:text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Explication Générale</h3>
              <p className={`text-[10px] sm:text-sm lg:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                 dangerouslySetInnerHTML={{ __html: currentQuestion.overallExplanation.replace(/<br\s*\/?>/gi, '\n').replace(/\n/g, '<br>') }}>
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-3 py-2 sm:px-6 lg:px-8 lg:py-4 rounded-lg font-medium transition-all flex items-center justify-center text-xs sm:text-base lg:text-lg ${
                currentQuestionIndex === 0
                  ? isDarkMode ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'
                  : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:shadow-md hover:-translate-y-0.5' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md hover:-translate-y-0.5'
              }`}
            >
              <span className="hidden sm:inline">← Précédent</span>
              <span className="sm:hidden">←</span>
            </button>
            
            <div className="flex gap-2 sm:gap-3 lg:gap-4">
              {!showAnswer && (
                <button
                  onClick={handleNextQuestion}
                  className={`px-3 py-2 sm:px-6 lg:px-8 lg:py-4 rounded-lg font-medium text-white bg-gray-500 hover:bg-gray-600 transition-all flex items-center text-xs sm:text-base lg:text-lg hover:shadow-md hover:-translate-y-0.5`}
                >
                  {currentQuestionIndex === questions.length - 1 ? <span className="hidden sm:inline">Terminer</span> : <span className="hidden sm:inline">Suivant →</span>}
                  <span className="sm:hidden">{currentQuestionIndex === questions.length - 1 ? 'Fin' : '→'}</span>
                </button>
              )}
              
              {!showAnswer ? (
                <button
                  onClick={handleShowAnswer}
                  disabled={selectedAnswers.length === 0}
                  className={`px-3 py-2 sm:px-6 lg:px-8 lg:py-4 rounded-lg font-medium text-xs sm:text-base lg:text-lg ${
                    selectedAnswers.length === 0
                      ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                      : isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5' : 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md hover:-translate-y-0.5'
                  } transition-all`}
                >
                  <span className="hidden sm:inline">Voir la réponse</span>
                  <span className="sm:hidden">Réponse</span>
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className={`px-3 py-2 sm:px-6 lg:px-8 lg:py-4 rounded-lg font-medium text-white bg-blue-500 hover:bg-blue-600 transition-all flex items-center text-xs sm:text-base lg:text-lg hover:shadow-md hover:-translate-y-0.5`}
                >
                  {currentQuestionIndex === questions.length - 1 ? <span className="hidden sm:inline">Terminer</span> : <span className="hidden sm:inline">Suivant →</span>}
                  <span className="sm:hidden">{currentQuestionIndex === questions.length - 1 ? 'Fin' : '→'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`mt-3 sm:mt-6 lg:mt-8 p-2 sm:p-4 lg:p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
          <div className="flex justify-between items-center mb-1.5 sm:mb-2 lg:mb-3">
            <span className={`text-[10px] sm:text-sm lg:text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Progression</span>
            <span className={`text-[10px] sm:text-sm lg:text-base font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{currentQuestionIndex + 1} / {questions.length}</span>
          </div>
          <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-1.5 sm:h-2 lg:h-3`}>
            <div
              className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}