INTEGRATED MINDCARE+ PROJECT
=============================

FULL INTEGRATION: Node.js/MindCare+ + Symfony Backend
-------------------------------------------------------

This project integrates two systems that share the same MySQL database:
- Node.js/React frontend with user authentication (port 3002)
- Symfony REST API backend for mental health features (port 8000)

DATABASE: mindcare_dbai
-----------------------
Both systems share these tables:
- users (VARCHAR(128) id, email, password, display_name, role)
- journals (user journals with mood scores)
- emotions (emotional tracking)
- appointments (therapy appointments)
- clinics (clinic information)
- messages (user messages)

PROJECT STRUCTURE
-----------------
mindcare-ai+ (1)/
├── src/                    # React frontend
├── server.ts               # Node.js backend (port 3002)
├── src/server/
│   ├── database.ts         # MySQL connection
│   └── Controllers/        # API controllers
├── backend-symfony/        # Symfony backend
│   ├── src/Entity/        # User, Journal, Emotion, Appointment
│   ├── src/Controller/    # ApiController
│   ├── config/            # Symfony config
│   └── public/index.php   # Entry point
└── database_schema.sql    # SQL schema

SETUP INSTRUCTIONS
------------------

1. START NODE.JS BACKEND (Port 3002)
   ```bash
   npm run dev
   ```
   - Creates MySQL tables automatically
   - Creates test users on startup
   - Serves React frontend

2. INSTALL SYMPHONY DEPENDENCIES
   ```bash
   cd backend-symfony
   composer install
   ```

3. RUN SYMFONY BACKEND (Port 8000)
   ```bash
   cd backend-symfony
   php bin/console server:run
   ```

4. VERIFY INTEGRATION
   ```bash
   # Check Node.js is running
   curl http://localhost:3002/api/health
   
   # Check Symfony is running
   curl http://localhost:8000/api/health
   
   # Login via Node.js
   curl -X POST http://localhost:3002/api/user/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123"}'
   
   # Get journals via Symfony
   curl http://localhost:8000/api/journals?userId=demo-user
   ```

API ENDPOINTS
-------------

Node.js (Port 3002):
- POST /api/user/register  - Register new user
- POST /api/user/login     - Login user
- POST /api/user/profile   - Update profile
- GET  /api/user/profile   - Get profile

Symfony (Port 8000):
- GET  /api/users          - List all users
- GET  /api/users/{id}     - Get specific user
- GET  /api/journals       - Get user journals (?userId=)
- POST /api/journals       - Create journal entry
- GET  /api/emotions       - Get user emotions (?userId=)
- POST /api/emotions       - Record emotion
- GET  /api/appointments   - Get appointments (?userId=)
- POST /api/appointments   - Create appointment
- GET  /api/health         - Health check

FRONTEND PAGES
--------------
- /login    - User login/register
- /dashboard - Main dashboard
- /accounts - Account management (edit profile, change password)
- /journal  - Journal entries
- /chat     - AI chat
- /insights - Emotional insights

DATABASE CONFIGURATION
----------------------
Both systems connect to the same MySQL database:
- Host: localhost
- Database: mindcare_dbai
- User: root
- Password: (empty)
- Port: 3306

TEST USERS
----------
Email: test@test.com
Password: test123
Role: patient

Email: therapist@test.com
Password: therapy123
Role: therapist

Email: admin@test.com
Password: admin123
Role: admin

TECHNOLOGY STACK
----------------
Frontend: React 19 + TypeScript + Tailwind CSS
Backend (Node.js): Express + MySQL2
Backend (Symfony): PHP 8.2 + Doctrine ORM + Symfony 6.4
Database: MySQL 8.0+ (mindcare_dbai)

AUTHENTICATION FLOW
-------------------
1. User logs in via Node.js (/api/user/login)
2. Node.js validates credentials against mindcare_dbai.users
3. Returns user data + session token
4. Browser stores token in localStorage
5. Frontend calls Symfony API with user ID
6. Symfony reads/writes to shared mindcare_dbai tables

INTEGRATION BENEFITS
-------------------
✅ Single source of truth (shared database)
✅ Separation of concerns (auth vs. business logic)
✅ Scalable architecture
✅ Both systems can evolve independently
✅ Easy to add new features

TROUBLESHOOTING
---------------
If Symfony can't connect to MySQL:
- Check DATABASE_URL in backend-symfony/.env
- Verify MySQL is running: mysql -u root -e "SHOW DATABASES;"
- Check port 3306 is accessible

If Node.js can't connect:
- Check src/server/database.ts configuration
- Verify MySQL password is correct
- Restart server

For CORS issues:
- Both APIs should include proper CORS headers
- Ensure frontend ports don't conflict
