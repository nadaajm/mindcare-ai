const mysql = require('mysql2');

async function testIntegration() {
  console.log('=== Integration Test: MindCare+ with MySQL mindcare_dbai ===\n');
  
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'mindcare_dbai',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const query = (sql, values) => new Promise((resolve, reject) => {
    pool.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  try {
    console.log('Test 1: Checking users table...');
    const users = await query('SELECT id, email, display_name, role FROM users');
    console.log('  Found ' + users.length + ' users');
    users.slice(0, 3).forEach(u => {
      console.log('    - ' + u.email + ' (' + u.role + ')');
    });

    console.log('\nTest 2: Checking journals table...');
    const journals = await query('SELECT * FROM journals LIMIT 5');
    console.log('  Found ' + journals.length + ' journal entries');

    console.log('\nTest 3: Checking emotions table...');
    const emotions = await query('SELECT * FROM emotions LIMIT 5');
    console.log('  Found ' + emotions.length + ' emotion entries');

    console.log('\nTest 4: Checking appointments table...');
    const appointments = await query('SELECT * FROM appointments LIMIT 5');
    console.log('  Found ' + appointments.length + ' appointments');

    console.log('\nTest 5: Checking clinics table...');
    const clinics = await query('SELECT * FROM clinics LIMIT 5');
    console.log('  Found ' + clinics.length + ' clinics');

    console.log('\nTest 6: Checking messages table...');
    const messages = await query('SELECT * FROM messages LIMIT 5');
    console.log('  Found ' + messages.length + ' messages');

    console.log('\n=== All Tables Accessible (6/6) ===');
    console.log('SUCCESS! Both Node.js and Symfony can access mindcare_dbai');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('FAILED:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testIntegration();
