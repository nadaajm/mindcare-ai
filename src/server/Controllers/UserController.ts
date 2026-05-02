import { Request, Response } from 'express';
import { getPool } from '../database';
import crypto from 'crypto';

export class UserController {
  public static getProfile(req: Request, res: Response) {
    res.json({
      id: 'serenity-7',
      email: 'user@example.com',
      displayName: 'Neural Subject',
      roles: ['ROLE_USER'],
      sync_status: 'SYNCHRONIZED'
    });
  }

  public static updateProfile(req: Request, res: Response) {
    res.json({
      success: true,
      message: 'Profile updated in virtual Symfony kernel.'
    });
  }

  public static register(req: Request, res: Response) {
    const { email, password, displayName } = req.body;
    
    if (!email || !password || !displayName) {
      res.status(400).json({ 
        success: false, 
        error: 'Email, password, and display name are required.' 
      });
      return;
    }
    
    const pool = getPool();
    
    pool.query('SELECT id FROM users WHERE email = ?', [email], (err, results) => {
      if (err) {
        console.error('Registration error:', err);
        res.status(500).json({ success: false, error: 'Registration failed.' });
        return;
      }
      
      if ((results as any[]).length > 0) {
        res.status(409).json({ success: false, error: 'An account with this email already exists.' });
        return;
      }
      
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
      const userId = crypto.randomUUID();
      
      pool.query(
        'INSERT INTO users (id, email, password, display_name, role) VALUES (?, ?, ?, ?, ?)',
        [userId, email, hashedPassword, displayName, 'patient'],
        (err) => {
          if (err) {
            console.error('Registration error:', err);
            res.status(500).json({ success: false, error: 'Registration failed.' });
            return;
          }
          res.json({ success: true, user: { id: userId, email, displayName, role: 'patient' } });
        }
      );
    });
  }

  public static login(req: Request, res: Response) {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }
    
    const pool = getPool();
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    pool.query(
      'SELECT id, email, display_name, role, avatar_url FROM users WHERE email = ? AND password = ?',
      [email, hashedPassword],
      (err, results) => {
        if (err) {
          console.error('Login error:', err);
          res.status(500).json({ success: false, error: 'Login failed.' });
          return;
        }
        
        const users = results as any[];
        
        if (users.length === 0) {
          res.status(401).json({ success: false, error: 'Invalid email or password.' });
          return;
        }
        
        const user = users[0];
        res.json({
          success: true,
          user: { id: user.id, email: user.email, displayName: user.display_name, role: user.role, avatarUrl: user.avatar_url }
        });
      }
    );
  }

  public static createTestUser(req: Request, res: Response) {
    const pool = getPool();
    const hashedPassword = crypto.createHash('sha256').update('test123').digest('hex');
    const userId = crypto.randomUUID();
    
    pool.query(
      'INSERT IGNORE INTO users (id, email, password, display_name, role) VALUES (?, ?, ?, ?, ?)',
      [userId, 'test@test.com', hashedPassword, 'Test User', 'patient'],
      (err) => {
        if (err) {
          console.error('Test user error:', err);
          res.status(500).json({ success: false, error: err.message });
          return;
        }
        res.json({ success: true, message: 'Test account created' });
      }
    );
  }
}
