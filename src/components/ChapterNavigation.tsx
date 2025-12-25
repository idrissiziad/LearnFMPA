import { Chapter, Question } from '@/data/modules';

interface ChapterNavigationProps {
  chapters: Chapter[];
  questions: Question[];
  currentQuestionIndex: number;
  correctlyAnsweredQuestions: { [key: string]: boolean };
  moduleId: number;
  darkMode: boolean;
  activeChapter: string | null;
  onChapterSelect: (chapterName: string) => void;
}

export default function ChapterNavigation({
  chapters,
  questions,
  currentQuestionIndex,
  correctlyAnsweredQuestions,
  moduleId,
  darkMode,
  activeChapter,
  onChapterSelect
}: ChapterNavigationProps) {
  return (
    <div className={`mb-4 sm:mb-6 lg:mb-8 p-2 sm:p-4 lg:p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-3 lg:gap-4">
        {chapters.map((chapter) => {
          // Count correctly answered questions in this chapter
          const chapterQuestions = questions.filter(q => q.chapter === chapter.name);
          const answeredCount = chapterQuestions.filter(q => correctlyAnsweredQuestions[`${moduleId}_${q.id}`]).length;
          
          // Check if the current question belongs to this chapter
          const currentQuestion = questions[currentQuestionIndex];
          const isCurrentChapter = currentQuestion?.chapter === chapter.name;
          
          return (
            <button
              key={chapter.id}
              className={`flex items-center p-1.5 sm:p-3 lg:p-4 rounded-lg border text-left transition-all hover:shadow-sm ${
                activeChapter === chapter.name
                  ? `${darkMode ? 'bg-blue-900 border-blue-700' : 'bg-blue-50 border-blue-500'}`
                  : `${darkMode ? 'border-gray-600 hover:bg-gray-700 hover:-translate-y-0.5' : 'border-gray-200 hover:bg-gray-50 hover:-translate-y-0.5'}`
              }`}
              onClick={() => onChapterSelect(chapter.name)}
            >
              <div className={`w-5 h-5 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center mr-1.5 sm:mr-3 lg:mr-4 text-[10px] sm:text-sm lg:text-base font-bold flex-shrink-0 ${
                isCurrentChapter
                  ? 'bg-blue-500 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {chapter.id}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-semibold text-[11px] sm:text-base lg:text-lg ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>{chapter.name}</div>
                <div className={`text-[10px] sm:text-sm lg:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{chapterQuestions.length} q</div>
              </div>
              <div className={`ml-0.5 sm:ml-2 lg:ml-3 text-[10px] sm:text-xs lg:text-sm px-1 sm:px-2 lg:px-3 py-0.5 sm:py-1 lg:py-1.5 rounded-full flex-shrink-0 ${
                answeredCount === chapterQuestions.length
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {answeredCount}/{chapterQuestions.length}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}