import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const USERS_DIR = path.join(process.cwd(), 'data', 'users');
const PROGRESS_DIR = path.join(USERS_DIR, 'progress');

function ensureProgressDir() {
  if (!fs.existsSync(PROGRESS_DIR)) {
    fs.mkdirSync(PROGRESS_DIR, { recursive: true });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    ensureProgressDir();
    const progressFile = path.join(PROGRESS_DIR, `${userId}.json`);

    if (!fs.existsSync(progressFile)) {
      return NextResponse.json({
        success: true,
        progress: {}
      });
    }

    const progress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));

    return NextResponse.json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('Get progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, module_id, question_id, is_correct } = body;

    if (!user_id || !module_id || question_id === undefined || is_correct === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    ensureProgressDir();
    const progressFile = path.join(PROGRESS_DIR, `${user_id}.json`);

    // Load existing progress or create new
    let progress: any = {};
    if (fs.existsSync(progressFile)) {
      progress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));
    }

    // Update progress for the module
    const moduleKey = `module_${module_id}`;
    if (!progress[moduleKey]) {
      progress[moduleKey] = {};
    }

    // Only mark as answered if correct, or track both
    progress[moduleKey][question_id] = {
      is_correct,
      answered_at: new Date().toISOString()
    };

    // Save progress
    fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));

    // Calculate stats
    const moduleProgress = progress[moduleKey] || {};
    const totalAnswered = Object.keys(moduleProgress).length;
    const totalCorrect = Object.values(moduleProgress).filter(
      (p: any) => p.is_correct
    ).length;

    return NextResponse.json({
      success: true,
      stats: {
        total_answered: totalAnswered,
        total_correct: totalCorrect,
        success_rate: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Save progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const moduleId = searchParams.get('module_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    ensureProgressDir();
    const progressFile = path.join(PROGRESS_DIR, `${userId}.json`);

    if (!fs.existsSync(progressFile)) {
      return NextResponse.json({
        success: true,
        message: 'No progress to reset'
      });
    }

    const progress = JSON.parse(fs.readFileSync(progressFile, 'utf-8'));

    if (moduleId) {
      // Reset specific module
      const moduleKey = `module_${moduleId}`;
      delete progress[moduleKey];
    } else {
      // Reset all progress
      Object.keys(progress).forEach(key => {
        if (key.startsWith('module_')) {
          delete progress[key];
        }
      });
    }

    fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));

    return NextResponse.json({
      success: true,
      message: moduleId ? 'Module progress reset' : 'All progress reset'
    });

  } catch (error) {
    console.error('Reset progress error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
