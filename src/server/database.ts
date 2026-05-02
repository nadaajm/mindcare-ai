import mysql from 'mysql';

// Database configuration - UPDATE THESE VALUES
export const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',  // Set your MySQL password here
  database: 'mindcare_dbai'
};

let pool: mysql.Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function initializeDatabase() {
  const connection = mysql.createConnection({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password
  });

  return new Promise<void>((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error('MySQL Connection Error:', err.message);
        reject(err);
        return;
      }
      
      // Create database if not exists
      connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`, (err) => {
        if (err) {
          console.error('Error creating database:', err.message);
          reject(err);
          return;
        }
        
        console.log('Database ready');
        
        // Use the database
        connection.query(`USE ${dbConfig.database}`, (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Create users table if not exists
          connection.query(`
            CREATE TABLE IF NOT EXISTS users (
              id VARCHAR(128) PRIMARY KEY,
              display_name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL UNIQUE,
              password VARCHAR(255) NOT NULL,
              role ENUM('patient', 'therapist', 'admin') DEFAULT 'patient',
              avatar_url TEXT,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
              UNIQUE KEY email_unique (email)
            )
          `, (err) => {
            if (err) {
              console.error('Error creating users table:', err.message);
              reject(err);
              return;
            }
            
            console.log('Users table ready');
            connection.end();
            resolve();
          });
        });
      });
    });
  });
}
