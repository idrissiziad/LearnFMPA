import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const USERS_DIR = path.join(process.cwd(), 'data', 'users');
const USERS_FILE = path.join(USERS_DIR, 'users.json');
const PROGRESS_DIR = path.join(USERS_DIR, 'progress');

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

function ensureDirectories() {
  if (!fs.existsSync(USERS_DIR)) {
    fs.mkdirSync(USERS_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROGRESS_DIR)) {
    fs.mkdirSync(PROGRESS_DIR, { recursive: true });
  }
}

function loadUsers(): UsersData {
  ensureDirectories();
  if (fs.existsSync(USERS_FILE)) {
    const data = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(data);
  }
  return { users: {} };
}

function saveUsers(data: UsersData) {
  ensureDirectories();
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const usersData = loadUsers();
    
    // Find user by email
    let foundUser: User | null = null;
    let foundUserId: string | null = null;
    
    for (const [userId, user] of Object.entries(usersData.users)) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        foundUser = user;
        foundUserId = userId;
        break;
      }
    }

    if (!foundUser || !foundUserId) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!foundUser.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact administrator.' },
        { status: 403 }
      );
    }

    // Verify password
    const passwordHash = hashPassword(password);
    if (foundUser.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login
    usersData.users[foundUserId].last_login = new Date().toISOString();
    saveUsers(usersData);

    // Generate session token
    const token = generateToken();

    // Return user info (without password hash)
    const userInfo = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      must_change_password: foundUser.must_change_password,
      token: token
    };

    return NextResponse.json({
      success: true,
      user: userInfo
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
