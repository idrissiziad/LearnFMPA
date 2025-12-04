import { Chapter, Question } from '@/data/modules';

interface ChapterNavigationProps {
  chapters: Chapter[];
  questions: Question[];
  currentQuestionIndex: number;
  correctlyAnsweredQuestions: { [key: string]: boolean };
  moduleId: number;
  darkMode: boolean;
  onChapterSelect: (startPosition: number) => void;
}

export default function ChapterNavigation({
  chapters,
  questions,
  currentQuestionIndex,
  correctlyAnsweredQuestions,
  moduleId,
  darkMode,
  onChapterSelect
}: ChapterNavigationProps) {
  return (
    <div className={`mb-6 p-3 sm:p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
        {chapters.map((chapter) => {
          // Count correctly answered questions in this chapter
          const chapterQuestions = questions.slice(chapter.startPosition, chapter.startPosition + chapter.questionCount);
          const answeredCount = chapterQuestions.filter(q => correctlyAnsweredQuestions[`${moduleId}_${q.id}`]).length;
          
          return (
            <button
              key={chapter.id}
              className={`flex items-center p-2 sm:p-3 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} text-left transition-colors`}
              onClick={() => onChapterSelect(chapter.startPosition)}
            >
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-3 text-xs sm:text-sm font-bold ${
                currentQuestionIndex >= chapter.startPosition && currentQuestionIndex < chapter.startPosition + chapter.questionCount
                  ? 'bg-blue-500 text-white'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {chapter.startPosition + 1}
              </div>
              <div className="flex-1">
                <div className={`font-semibold text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{chapter.name}</div>
                <div className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{chapter.questionCount} questions</div>
              </div>
              <div className={`ml-1 sm:ml-2 text-xs px-2 py-1 rounded-full ${
                answeredCount === chapter.questionCount
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {answeredCount}/{chapter.questionCount}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}