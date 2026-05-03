import mysql from 'mysql2';

// Database configuration for mindcare_dbai (phpMyAdmin)
export const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',  // Your MySQL password
  database: 'mindcare_dbai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pooled = mysql.createPool(dbConfig);

export function setPool(newPool: any) {
  pooled = newPool;
}

export function getPool() {
  return pooled;
}

export function initializeDatabase(callback: (err?: Error) => void) {
  const tempPool = mysql.createPool({
    host: dbConfig.host,
    user: dbConfig.user,
    password: dbConfig.password,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  tempPool.query(
    `CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    (err) => {
      if (err) {
        console.error('Error creating database:', err);
        tempPool.end();
        callback(err);
        return;
      }
      tempPool.end();

      const mainPool = mysql.createPool({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(128) NOT NULL,
          display_name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('patient','therapist','admin') DEFAULT 'patient',
          avatar_url TEXT DEFAULT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY email_unique (email)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;

      const createEmotionsTable = `
        CREATE TABLE IF NOT EXISTS emotions (
          id INT(11) NOT NULL AUTO_INCREMENT,
          user_id VARCHAR(128) NOT NULL,
          score INT(2) NOT NULL,
          notes TEXT DEFAULT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY user_id (user_id),
          CONSTRAINT fk_emotion_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;

      const createJournalsTable = `
        CREATE TABLE IF NOT EXISTS journals (
          id INT(11) NOT NULL AUTO_INCREMENT,
          user_id VARCHAR(128) NOT NULL,
          content TEXT NOT NULL,
          mood_score INT(2) DEFAULT NULL,
          is_private TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY user_id (user_id),
          CONSTRAINT fk_journal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;

      const createClinicsTable = `
        CREATE TABLE IF NOT EXISTS clinics (
          id INT(11) NOT NULL AUTO_INCREMENT,
          name VARCHAR(255) NOT NULL,
          address TEXT NOT NULL,
          phone VARCHAR(50) DEFAULT NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;

      const createAppointmentsTable = `
        CREATE TABLE IF NOT EXISTS appointments (
          id INT(11) NOT NULL AUTO_INCREMENT,
          patient_id VARCHAR(128) NOT NULL,
          therapist_id VARCHAR(128) DEFAULT NULL,
          date_time DATETIME NOT NULL,
          status ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
          type VARCHAR(50) DEFAULT 'general',
          PRIMARY KEY (id),
          KEY patient_id (patient_id),
          KEY therapist_id (therapist_id),
          CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES users(id),
          CONSTRAINT fk_appt_therapist FOREIGN KEY (therapist_id) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;

      const createMessagesTable = `
        CREATE TABLE IF NOT EXISTS messages (
          id INT(11) NOT NULL AUTO_INCREMENT,
          sender_id VARCHAR(128) NOT NULL,
          content TEXT NOT NULL,
          sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          KEY sender_id (sender_id),
          CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;

      mainPool.query(createUsersTable, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          mainPool.end();
          callback(err);
          return;
        }
        console.log('✓ Users table ready');

        mainPool.query(createEmotionsTable, (err) => {
          if (err) console.warn('Emotions table warning:', err.message);
          else console.log('✓ Emotions table ready');

          mainPool.query(createJournalsTable, (err) => {
            if (err) console.warn('Journals table warning:', err.message);
            else console.log('✓ Journals table ready');

            mainPool.query(createClinicsTable, (err) => {
              if (err) console.warn('Clinics table warning:', err.message);
              else console.log('✓ Clinics table ready');

              mainPool.query(createAppointmentsTable, (err) => {
                if (err) console.warn('Appointments table warning:', err.message);
                else console.log('✓ Appointments table ready');

                mainPool.query(createMessagesTable, (err) => {
                  if (err) console.warn('Messages table warning:', err.message);
                  else console.log('✓ Messages table ready');

                  setPool(mainPool);
                  callback();
                });
              });
            });
          });
        });
      });
    }
  );
}
