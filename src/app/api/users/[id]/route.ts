import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const USERS_DIR = path.join(process.cwd(), 'data', 'users');
const USERS_FILE = path.join(USERS_DIR, 'users.json');

interface User {
  id: string;
  name: string;
  email: string;
  must_change_password: boolean;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
}

interface UsersData {
  users: { [key: string]: User };
}

function loadUsers(): UsersData {
  if (!fs.existsSync(USERS_FILE)) {
    return { users: {} };
  }
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
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

    const usersData = loadUsers();
    const user = usersData.users[userId];

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user info without sensitive data
    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      must_change_password: user.must_change_password,
      last_login: user.last_login
    };

    return NextResponse.json({
      success: true,
      user: userInfo
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
