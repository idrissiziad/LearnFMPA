// Simple verification script to check if the test module loads correctly
const { getModuleQuestions, getModuleChapters } = require('./index.ts');

async function verifyTestModule() {
  try {
    console.log('Testing module ID 2 (Pathologie respiratoire)...');
    
    // Test loading questions
    const questions = await getModuleQuestions(2);
    console.log(`✓ Successfully loaded ${questions.length} questions`);
    
    if (questions.length > 0) {
      const firstQuestion = questions[0];
      console.log(`✓ First question: "${firstQuestion.question}"`);
      console.log(`✓ Number of options: ${firstQuestion.options.length}`);
      console.log(`✓ Correct answer index: ${firstQuestion.correctAnswer}`);
      console.log(`✓ Correct answer text: "${firstQuestion.options[firstQuestion.correctAnswer]}"`);
    }
    
    // Test loading chapters
    const chapters = await getModuleChapters(2);
    console.log(`✓ Successfully loaded ${chapters.length} chapters`);
    
    if (chapters.length > 0) {
      const firstChapter = chapters[0];
      console.log(`✓ First chapter: "${firstChapter.name}"`);
      console.log(`✓ Chapter color: ${firstChapter.color}`);
      console.log(`✓ Question count: ${firstChapter.questionCount}`);
    }
    
    console.log('\n✅ Test module verification successful!');
    
  } catch (error) {
    console.error('❌ Error verifying test module:', error);
  }
}

verifyTestModule();