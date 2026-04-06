import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const USERS_DIR = path.join(process.cwd(), 'data', 'users');
const USERS_FILE = path.join(USERS_DIR, 'users.json');

interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
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

function saveUsers(data: UsersData) {
  if (!fs.existsSync(USERS_DIR)) {
    fs.mkdirSync(USERS_DIR, { recursive: true });
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, current_password, new_password } = body;

    if (!email || !current_password || !new_password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const usersData = loadUsers();
    
    // Find user by email
    let foundUserId: string | null = null;
    
    for (const [userId, user] of Object.entries(usersData.users)) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        foundUserId = userId;
        break;
      }
    }

    if (!foundUserId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = usersData.users[foundUserId];

    // Verify current password
    const currentHash = hashPassword(current_password);
    if (user.password_hash !== currentHash) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password
    usersData.users[foundUserId].password_hash = hashPassword(new_password);
    usersData.users[foundUserId].must_change_password = false;
    delete (usersData.users[foundUserId] as any).temp_password;
    
    saveUsers(usersData);

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
