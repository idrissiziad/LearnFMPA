// We'll use dynamic imports for JSON files to avoid bundling issues

// Cache for storing loaded module data
const moduleQuestionsCache = new Map<number, Question[]>();
const moduleChaptersCache = new Map<number, Chapter[]>();

export interface Module {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  year: string;
  gradient: string;
}

export interface JsonQuestion {
  YearAsked: string;
  Subtopic: string;
  QuestionText: string;
  QuestionImage?: string;
  Choice_A_Text: string;
  Choice_A_isCorrect: boolean;
  Choice_A_Explanation: string;
  Choice_A_Image?: string;
  Choice_B_Text: string;
  Choice_B_isCorrect: boolean;
  Choice_B_Explanation: string;
  Choice_B_Image?: string;
  Choice_C_Text: string;
  Choice_C_isCorrect: boolean;
  Choice_C_Explanation: string;
  Choice_C_Image?: string;
  Choice_D_Text: string;
  Choice_D_isCorrect: boolean;
  Choice_D_Explanation: string;
  Choice_D_Image?: string;
  Choice_E_Text: string;
  Choice_E_isCorrect: boolean;
  Choice_E_Explanation: string;
  Choice_E_Image?: string;
  OverallExplanation: string;
  IsChapterStart?: boolean;
  ChapterName?: string;
  ChapterColor?: string;
  Confirmed?: boolean;
}

export interface Question {
  id: string;
  question: string;
  questionImage?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  chapter?: string;
  year?: string;
  isMultipleChoice?: boolean;
  correctAnswers?: number[];
  answerExplanations?: string[];
  overallExplanation?: string;
  confirmed?: boolean;
  optionImages?: string[];
}

export interface Chapter {
  id: number;
  name: string;
  questionCount: number;
  color: string;
  startPosition: number;
}

export interface ModuleWithQuestions extends Module {
  questions: Question[];
}

export const modules: Module[] = [
  {
    id: 1,
    title: 'Pathologie digestive',
    subtitle: '3ème année',
    description: 'Questions d\'annales en pathologie digestive pour les étudiants en médecine',
    year: '3ème année',
    gradient: 'from-teal-400 to-teal-600'
  }
];

export const getModuleById = (id: number): Module | undefined => {
  return modules.find(module => module.id === id);
};

// Function to extract chapters from JSON data
export const extractChaptersFromQuestions = (questions: JsonQuestion[]): Chapter[] => {
  const chapters: Chapter[] = [];
  let currentChapterId = 1;
  let questionCount = 0;
  let startPosition = 0;
  let chapterName = '';
  let chapterColor = '#3B82F6';
  
  questions.forEach((question, index) => {
    if (question.IsChapterStart) {
      // Save the previous chapter if it exists
      if (questionCount > 0) {
        chapters.push({
          id: currentChapterId,
          name: chapterName,
          color: chapterColor,
          startPosition: startPosition,
          questionCount: questionCount
        });
        currentChapterId++;
      }
      
      // Start a new chapter
      chapterName = question.ChapterName || 'Unknown Chapter';
      chapterColor = question.ChapterColor || "#3B82F6";
      startPosition = index;
      questionCount = 1;
    } else {
      questionCount++;
    }
  });
  
  // Add the last chapter
  if (questionCount > 0) {
    chapters.push({
      id: currentChapterId,
      name: chapterName,
      color: chapterColor,
      startPosition: startPosition,
      questionCount: questionCount
    });
  }
  
  return chapters;
};

export const getModuleQuestions = async (moduleId: number): Promise<Question[]> => {
  // Check if data is already cached
  if (moduleQuestionsCache.has(moduleId)) {
    return moduleQuestionsCache.get(moduleId)!;
  }

  // In a real app, this would fetch from an API
  let jsonQuestions: JsonQuestion[] = [];
  
  switch (moduleId) {
    case 1:
      const pathologieModule = await import('./Pathologie digestive.json');
      jsonQuestions = (pathologieModule as any).default as JsonQuestion[];
      break;
    default:
      return [];
  }
  
  // Convert JSON questions to the Question interface
  const questions = jsonQuestions.map((q, index) => {
    // Create arrays of all options, their correctness, explanations, and images
    const allOptions = [
      { text: q.Choice_A_Text, isCorrect: q.Choice_A_isCorrect, explanation: q.Choice_A_Explanation, image: q.Choice_A_Image || '' },
      { text: q.Choice_B_Text, isCorrect: q.Choice_B_isCorrect, explanation: q.Choice_B_Explanation, image: q.Choice_B_Image || '' },
      { text: q.Choice_C_Text, isCorrect: q.Choice_C_isCorrect, explanation: q.Choice_C_Explanation, image: q.Choice_C_Image || '' },
      { text: q.Choice_D_Text, isCorrect: q.Choice_D_isCorrect, explanation: q.Choice_D_Explanation, image: q.Choice_D_Image || '' },
      { text: q.Choice_E_Text, isCorrect: q.Choice_E_isCorrect, explanation: q.Choice_E_Explanation, image: q.Choice_E_Image || '' }
    ];
    
    // Filter out empty options
    const validOptions = allOptions.filter(option => option.text && option.text.trim() !== '');
    
    // Extract the filtered data
    const options = validOptions.map(option => option.text);
    const correctAnswers: number[] = [];
    const answerExplanations: string[] = [];
    const optionImages: string[] = [];
    
    // Collect correct answers, explanations, and images from valid options only
    validOptions.forEach((option, index) => {
      if (option.isCorrect) correctAnswers.push(index);
      answerExplanations.push(option.explanation);
      optionImages.push(option.image);
    });
    
    return {
      id: index.toString(),
      question: q.QuestionText,
      questionImage: q.QuestionImage,
      options,
      correctAnswer: correctAnswers.length > 0 ? correctAnswers[0] : 0,
      explanation: q.OverallExplanation || '',
      chapter: q.Subtopic,
      year: q.YearAsked,
      isMultipleChoice: correctAnswers.length > 1,
      correctAnswers,
      answerExplanations,
      overallExplanation: q.OverallExplanation || '',
      confirmed: q.Confirmed,
      optionImages
    };
  });

  // Cache the result
  moduleQuestionsCache.set(moduleId, questions);
  
  return questions;
};

export const getModuleChapters = async (moduleId: number): Promise<Chapter[]> => {
  // Check if data is already cached
  if (moduleChaptersCache.has(moduleId)) {
    return moduleChaptersCache.get(moduleId)!;
  }

  let jsonQuestions: JsonQuestion[] = [];
  
  switch (moduleId) {
    case 1:
      const pathologieModule = await import('./Pathologie digestive.json');
      jsonQuestions = (pathologieModule as any).default as JsonQuestion[];
      break;
    default:
      return [];
  }
  
  const chapters = extractChaptersFromQuestions(jsonQuestions);
  
  // Cache the result
  moduleChaptersCache.set(moduleId, chapters);
  
  return chapters;
};

export const getAllModules = (): Module[] => {
  return modules;
};