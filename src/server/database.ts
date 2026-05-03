import mysql from 'mysql';
import crypto from 'crypto';
import path from 'path';
import { readFileSync, writeFileSync } from 'fs';

// Mock data file for local auth (no MySQL needed)
const USERS_FILE = path.join(process.cwd(), 'data', 'users.json');

// Ensure data dir
const dataDir = path.dirname(USERS_FILE);
import fs from 'fs';
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let usersData: any[] = [];

function loadUsers() {
  try {
    const data = readFileSync(USERS_FILE, 'utf8');
    usersData = JSON.parse(data);
  } catch {
    usersData = [];
  }
}

function saveUsers() {
  writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2));
}

loadUsers();

// Database configuration - UPDATE THESE VALUES (for real MySQL)
export const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',  // Set your MySQL password here
  database: 'mindcare_dbai'
};

let pool: any = null;

// Mock pool for localStorage-like auth
const mockPool = {
  query: (sql: string, params: any[], cb: (err: any, results: any[]) => void) => {
    if (sql.includes('SELECT id FROM users WHERE email')) {
      const email = params[0];
      const existing = usersData.find(u => u.email === email);
      cb(null, existing ? [existing] : []);
    } else if (sql.includes('SELECT id, email, display_name, role, avatar_url FROM users WHERE email') && sql.includes('AND password')) {
      const email = params[0];
      const hash = params[1];
      const user = usersData.find(u => u.email === email && u.password === hash);
      cb(null, user ? [user] : []);
    } else if (sql.includes('INSERT INTO users')) {
      const [, , email, hash, displayName] = params;
      if (usersData.find(u => u.email === email)) {
        cb(new Error('Duplicate email'), []);
        return;
      }
      const userId = crypto.randomUUID();
      const newUser = {
        id: userId,
        email,
        password: hash,
        display_name: displayName,
        role: 'patient',
        avatar_url: null,
        created_at: new Date().toISOString()
      };
      usersData.unshift(newUser);
      saveUsers();
      cb(null, [{ affectedRows: 1 }]);
    } else if (sql.includes('INSERT IGNORE INTO users')) {
      const [, , email, hash, displayName] = params;
      if (!usersData.find(u => u.email === email)) {
        const userId = crypto.randomUUID();
        const newUser = {
          id: userId,
          email,
          password: hash,
          display_name: displayName,
          role: 'patient',
          avatar_url: null,
          created_at: new Date().toISOString()
        };
        usersData.unshift(newUser);
        saveUsers();
      }
      cb(null, [{ affectedRows: 1 }]);
    } else {
      cb(null, []);
    }
  }
};

export function getPool() {
  // Use mock for now (no MySQL needed)
  if (!pool) {
    pool = mockPool;
  }
  return pool;
}

export async function initializeDatabase() {
  console.log('Mock DB ready - Users persisted in data/users.json (no MySQL needed)');
  
  // Create test user if none
  if (usersData.length === 0) {
    const hashedPassword = crypto.createHash('sha256').update('test123').digest('hex');
    usersData.push({
      id: 'test-user-1',
      email: 'test@test.com',
      password: hashedPassword,
      display_name: 'Test User',
      role: 'patient'
    });
    saveUsers();
    console.log('Test user created: test@test.com / test123');
  }
  
  return Promise.resolve();
}

