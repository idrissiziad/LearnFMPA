// We'll use dynamic imports for JSON files to avoid bundling issues

// Cache for storing loaded module data
export const moduleQuestionsCache = new Map<number, Question[]>();
export const moduleChaptersCache = new Map<number, Chapter[]>();
const moduleRawJsonCache = new Map<number, JsonQuestion[]>();

export interface Module {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  levels: string[];
  gradient: string;
  json_filename?: string;
  icon?: string;
}

export interface JsonQuestion {
  YearAsked: string;
  Subtopic: string;
  QuestionText: string;
  QuestionImage?: string;
  Choice_A_Text: string;
  Choice_A_isCorrect: boolean;
  Choice_A_Explanation: string;
  Choice_A_Image?: string | string[];
  Choice_B_Text: string;
  Choice_B_isCorrect: boolean;
  Choice_B_Explanation: string;
  Choice_B_Image?: string | string[];
  Choice_C_Text: string;
  Choice_C_isCorrect: boolean;
  Choice_C_Explanation: string;
  Choice_C_Image?: string | string[];
  Choice_D_Text: string;
  Choice_D_isCorrect: boolean;
  Choice_D_Explanation: string;
  Choice_D_Image?: string | string[];
  Choice_E_Text: string;
  Choice_E_isCorrect: boolean;
  Choice_E_Explanation: string;
  Choice_E_Image?: string | string[];
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
    title: 'Pharmacologie',
    subtitle: '189',
    description: 'Phase 1',
    levels: ['2ème année', '3ème année'],
    gradient: 'from-blue-400 to-blue-600',
    json_filename: 'Pharmacologie'
  },
  {
    id: 2,
    title: 'Cardiologie',
    subtitle: 'Cardiologie',
    description: '',
    levels: ['3ème année'],
    gradient: 'from-green-400 to-green-600',
    json_filename: 'Cardiologie'
  },
  {
    id: 3,
    title: 'Anatomo-pathologie 1',
    subtitle: 'Anatomo-pathologie 1',
    description: '',
    levels: ['2ème année', '3ème année'],
    gradient: 'from-purple-400 to-purple-600',
    json_filename: 'Anatomo-pathologie 1'
  },
  {
    id: 4,
    title: 'Sémiologie 2',
    subtitle: 'Sémiologie 2',
    description: '',
    levels: ['2ème année'],
    gradient: 'from-green-400 to-green-600',
    json_filename: 'Sémiologie 2'
  },
  {
    id: 5,
    title: 'Radiologie',
    subtitle: 'Radiologie',
    description: '',
    levels: ['2ème année', '3ème année'],
    gradient: 'from-red-400 to-red-600',
    json_filename: 'Radiologie'
  }
];

export const getModuleById = (id: number): Module | undefined => {
  return modules.find(module => module.id === id);
};

// Function to extract chapters from JSON data
export const extractChaptersFromQuestions = (questions: JsonQuestion[]): Chapter[] => {
  const chapters: Chapter[] = [];
  const subtopicGroups: { [subtopic: string]: { questions: JsonQuestion[], startIndex: number } } = {};
  
  // Group questions by subtopic and track their first occurrence
  questions.forEach((question, index) => {
    const subtopic = question.Subtopic || 'Non classé';
    if (!subtopicGroups[subtopic]) {
      subtopicGroups[subtopic] = {
        questions: [],
        startIndex: index
      };
    }
    subtopicGroups[subtopic].questions.push(question);
  });
  
  // Create chapters from subtopic groups
  Object.entries(subtopicGroups).forEach(([subtopic, group]) => {
    if (group.questions.length > 0) {
      chapters.push({
        id: 0, // Will be assigned after sorting
        name: subtopic,
        color: "#3B82F6", // Default color, could be customized per subtopic if needed
        startPosition: group.startIndex,
        questionCount: group.questions.length
      });
    }
  });
  
  // Sort chapters by question count (descending - most questions first)
  chapters.sort((a, b) => b.questionCount - a.questionCount);
  
  // Assign sequential IDs based on sorted order (subject with most questions is 1)
  chapters.forEach((chapter, index) => {
    chapter.id = index + 1;
  });
  
  return chapters;
};

const getModuleRawJson = async (moduleId: number): Promise<JsonQuestion[]> => {
  if (moduleRawJsonCache.has(moduleId)) {
    return moduleRawJsonCache.get(moduleId)!;
  }

  let jsonQuestions: JsonQuestion[] = [];

  switch (moduleId) {
    case 1:
      const PharmacologieModule = await import('./Pharmacologie.json', { with: { type: 'json' } });
      jsonQuestions = (PharmacologieModule.default as any[]).map((item: any) => ({
        YearAsked: item.YearAsked || '',
        Subtopic: item.Subtopic || '',
        QuestionText: item.QuestionText || '',
        QuestionImage: item.QuestionImage,
        Choice_A_Text: item.Choice_A_Text || '',
        Choice_A_isCorrect: !!item.Choice_A_isCorrect,
        Choice_A_Explanation: item.Choice_A_Explanation || '',
        Choice_A_Image: item.Choice_A_Image,
        Choice_B_Text: item.Choice_B_Text || '',
        Choice_B_isCorrect: !!item.Choice_B_isCorrect,
        Choice_B_Explanation: item.Choice_B_Explanation || '',
        Choice_B_Image: item.Choice_B_Image,
        Choice_C_Text: item.Choice_C_Text || '',
        Choice_C_isCorrect: !!item.Choice_C_isCorrect,
        Choice_C_Explanation: item.Choice_C_Explanation || '',
        Choice_C_Image: item.Choice_C_Image,
        Choice_D_Text: item.Choice_D_Text || '',
        Choice_D_isCorrect: !!item.Choice_D_isCorrect,
        Choice_D_Explanation: item.Choice_D_Explanation || '',
        Choice_D_Image: item.Choice_D_Image,
        Choice_E_Text: item.Choice_E_Text || '',
        Choice_E_isCorrect: !!item.Choice_E_isCorrect,
        Choice_E_Explanation: item.Choice_E_Explanation || '',
        Choice_E_Image: item.Choice_E_Image,
        OverallExplanation: item.OverallExplanation || '',
        IsChapterStart: item.IsChapterStart,
        ChapterName: item.ChapterName,
        ChapterColor: item.ChapterColor,
        Confirmed: item.Confirmed,
      }));
      break;
    case 2:
      const CardiologieModule = await import('./Cardiologie.json', { with: { type: 'json' } });
      jsonQuestions = (CardiologieModule.default as any[]).map((item: any) => ({
        YearAsked: item.YearAsked || '',
        Subtopic: item.Subtopic || '',
        QuestionText: item.QuestionText || '',
        QuestionImage: item.QuestionImage,
        Choice_A_Text: item.Choice_A_Text || '',
        Choice_A_isCorrect: !!item.Choice_A_isCorrect,
        Choice_A_Explanation: item.Choice_A_Explanation || '',
        Choice_A_Image: item.Choice_A_Image,
        Choice_B_Text: item.Choice_B_Text || '',
        Choice_B_isCorrect: !!item.Choice_B_isCorrect,
        Choice_B_Explanation: item.Choice_B_Explanation || '',
        Choice_B_Image: item.Choice_B_Image,
        Choice_C_Text: item.Choice_C_Text || '',
        Choice_C_isCorrect: !!item.Choice_C_isCorrect,
        Choice_C_Explanation: item.Choice_C_Explanation || '',
        Choice_C_Image: item.Choice_C_Image,
        Choice_D_Text: item.Choice_D_Text || '',
        Choice_D_isCorrect: !!item.Choice_D_isCorrect,
        Choice_D_Explanation: item.Choice_D_Explanation || '',
        Choice_D_Image: item.Choice_D_Image,
        Choice_E_Text: item.Choice_E_Text || '',
        Choice_E_isCorrect: !!item.Choice_E_isCorrect,
        Choice_E_Explanation: item.Choice_E_Explanation || '',
        Choice_E_Image: item.Choice_E_Image,
        OverallExplanation: item.OverallExplanation || '',
        IsChapterStart: item.IsChapterStart,
        ChapterName: item.ChapterName,
        ChapterColor: item.ChapterColor,
        Confirmed: item.Confirmed,
      }));
      break;
    case 3:
      const Anatomopathologie1Module = await import('./Anatomo-pathologie 1.json', { with: { type: 'json' } });
      jsonQuestions = (Anatomopathologie1Module.default as any[]).map((item: any) => ({
        YearAsked: item.YearAsked || '',
        Subtopic: item.Subtopic || '',
        QuestionText: item.QuestionText || '',
        QuestionImage: item.QuestionImage,
        Choice_A_Text: item.Choice_A_Text || '',
        Choice_A_isCorrect: !!item.Choice_A_isCorrect,
        Choice_A_Explanation: item.Choice_A_Explanation || '',
        Choice_A_Image: item.Choice_A_Image,
        Choice_B_Text: item.Choice_B_Text || '',
        Choice_B_isCorrect: !!item.Choice_B_isCorrect,
        Choice_B_Explanation: item.Choice_B_Explanation || '',
        Choice_B_Image: item.Choice_B_Image,
        Choice_C_Text: item.Choice_C_Text || '',
        Choice_C_isCorrect: !!item.Choice_C_isCorrect,
        Choice_C_Explanation: item.Choice_C_Explanation || '',
        Choice_C_Image: item.Choice_C_Image,
        Choice_D_Text: item.Choice_D_Text || '',
        Choice_D_isCorrect: !!item.Choice_D_isCorrect,
        Choice_D_Explanation: item.Choice_D_Explanation || '',
        Choice_D_Image: item.Choice_D_Image,
        Choice_E_Text: item.Choice_E_Text || '',
        Choice_E_isCorrect: !!item.Choice_E_isCorrect,
        Choice_E_Explanation: item.Choice_E_Explanation || '',
        Choice_E_Image: item.Choice_E_Image,
        OverallExplanation: item.OverallExplanation || '',
        IsChapterStart: item.IsChapterStart,
        ChapterName: item.ChapterName,
        ChapterColor: item.ChapterColor,
        Confirmed: item.Confirmed,
      }));
      break;
    case 4:
      const Semiologie2Module = await import('./Sémiologie 2.json', { with: { type: 'json' } });
      jsonQuestions = (Semiologie2Module.default as any[]).map((item: any) => ({
        YearAsked: item.YearAsked || '',
        Subtopic: item.Subtopic || '',
        QuestionText: item.QuestionText || '',
        QuestionImage: item.QuestionImage,
        Choice_A_Text: item.Choice_A_Text || '',
        Choice_A_isCorrect: !!item.Choice_A_isCorrect,
        Choice_A_Explanation: item.Choice_A_Explanation || '',
        Choice_A_Image: item.Choice_A_Image,
        Choice_B_Text: item.Choice_B_Text || '',
        Choice_B_isCorrect: !!item.Choice_B_isCorrect,
        Choice_B_Explanation: item.Choice_B_Explanation || '',
        Choice_B_Image: item.Choice_B_Image,
        Choice_C_Text: item.Choice_C_Text || '',
        Choice_C_isCorrect: !!item.Choice_C_isCorrect,
        Choice_C_Explanation: item.Choice_C_Explanation || '',
        Choice_C_Image: item.Choice_C_Image,
        Choice_D_Text: item.Choice_D_Text || '',
        Choice_D_isCorrect: !!item.Choice_D_isCorrect,
        Choice_D_Explanation: item.Choice_D_Explanation || '',
        Choice_D_Image: item.Choice_D_Image,
        Choice_E_Text: item.Choice_E_Text || '',
        Choice_E_isCorrect: !!item.Choice_E_isCorrect,
        Choice_E_Explanation: item.Choice_E_Explanation || '',
        Choice_E_Image: item.Choice_E_Image,
        OverallExplanation: item.OverallExplanation || '',
        IsChapterStart: item.IsChapterStart,
        ChapterName: item.ChapterName,
        ChapterColor: item.ChapterColor,
        Confirmed: item.Confirmed,
      }));
      break;
    case 5:
      const RadiologieModule = await import('./Radiologie.json', { with: { type: 'json' } });
      jsonQuestions = (RadiologieModule.default as any[]).map((item: any) => ({
        YearAsked: item.YearAsked || '',
        Subtopic: item.Subtopic || '',
        QuestionText: item.QuestionText || '',
        QuestionImage: item.QuestionImage,
        Choice_A_Text: item.Choice_A_Text || '',
        Choice_A_isCorrect: !!item.Choice_A_isCorrect,
        Choice_A_Explanation: item.Choice_A_Explanation || '',
        Choice_A_Image: item.Choice_A_Image,
        Choice_B_Text: item.Choice_B_Text || '',
        Choice_B_isCorrect: !!item.Choice_B_isCorrect,
        Choice_B_Explanation: item.Choice_B_Explanation || '',
        Choice_B_Image: item.Choice_B_Image,
        Choice_C_Text: item.Choice_C_Text || '',
        Choice_C_isCorrect: !!item.Choice_C_isCorrect,
        Choice_C_Explanation: item.Choice_C_Explanation || '',
        Choice_C_Image: item.Choice_C_Image,
        Choice_D_Text: item.Choice_D_Text || '',
        Choice_D_isCorrect: !!item.Choice_D_isCorrect,
        Choice_D_Explanation: item.Choice_D_Explanation || '',
        Choice_D_Image: item.Choice_D_Image,
        Choice_E_Text: item.Choice_E_Text || '',
        Choice_E_isCorrect: !!item.Choice_E_isCorrect,
        Choice_E_Explanation: item.Choice_E_Explanation || '',
        Choice_E_Image: item.Choice_E_Image,
        OverallExplanation: item.OverallExplanation || '',
        IsChapterStart: item.IsChapterStart,
        ChapterName: item.ChapterName,
        ChapterColor: item.ChapterColor,
        Confirmed: item.Confirmed,
      }));
      break;
    default:
      return [];
  }

  moduleRawJsonCache.set(moduleId, jsonQuestions);
  return jsonQuestions;
};

export const getModuleQuestions = async (moduleId: number): Promise<Question[]> => {
  if (moduleQuestionsCache.has(moduleId)) {
    return moduleQuestionsCache.get(moduleId)!;
  }

  const jsonQuestions = await getModuleRawJson(moduleId);
  
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
      optionImages.push(Array.isArray(option.image) ? option.image.join(',') : option.image);
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
  if (moduleChaptersCache.has(moduleId)) {
    return moduleChaptersCache.get(moduleId)!;
  }

  const jsonQuestions = await getModuleRawJson(moduleId);
  
  const chapters = extractChaptersFromQuestions(jsonQuestions);
  
  // Cache the result
  moduleChaptersCache.set(moduleId, chapters);
  
  return chapters;
};

export const getAllModules = (): Module[] => {
  return modules;
};

// Function to clear cache for a specific module
export const clearModuleCache = (moduleId: number): void => {
  moduleQuestionsCache.delete(moduleId);
  moduleChaptersCache.delete(moduleId);
  moduleRawJsonCache.delete(moduleId);
};

export const clearAllModuleCache = (): void => {
  moduleQuestionsCache.clear();
  moduleChaptersCache.clear();
  moduleRawJsonCache.clear();
};

export const preloadModuleData = async (moduleId: number): Promise<{ questions: Question[], chapters: Chapter[] }> => {
  const [questions, chapters] = await Promise.all([
    getModuleQuestions(moduleId),
    getModuleChapters(moduleId)
  ]);
  
  return { questions, chapters };
};