import express from "express";
import path from "path";
import cors from 'cors';
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { NeuralKernelController } from "./src/server/Controllers/NeuralKernelController";
import { ClinicController } from "./src/server/Controllers/ClinicController";
import { UserController } from "./src/server/Controllers/UserController";
import { initializeDatabase, getPool } from "./src/server/database";
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  const PORT = 3002;

  app.use(express.json());

  initializeDatabase((err) => {
    if (err) {
      console.error('Database initialization failed:', err);
    } else {
      console.log('MySQL database initialized');
      if (process.env.NODE_ENV !== 'production') {
        createTestUsers();
      }
    }
  });

  app.get("/api/health", NeuralKernelController.getHealth);
  app.post("/api/diagnostics", NeuralKernelController.getDiagnostics);
  app.get("/api/emotions", NeuralKernelController.getEmotions);
  
  app.get("/api/v1/clinic/stats", ClinicController.getStats);
  app.get("/api/v1/clinic/list", ClinicController.getClinics);
  
  app.get("/api/user/profile", UserController.getProfile);
  app.post("/api/user/profile", UserController.updateProfile);
  app.post("/api/user/register", UserController.register);
  app.post("/api/user/login", UserController.login);
  app.post("/api/user/create-test", UserController.createTestUser);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "index.html"));
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Neural Kernel active at http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log('Dev mode: Test users are available on startup');
    }
  });
}

function createTestUsers() {
  const pool = getPool();
  const testUsers = [
    { id: 'demo-user', email: 'test@test.com', password: 'test123', displayName: 'Test User', role: 'patient' },
    { id: 'demo-therapist', email: 'therapist@test.com', password: 'therapy123', displayName: 'Demo Therapist', role: 'therapist' },
    { id: 'demo-admin', email: 'admin@test.com', password: 'admin123', displayName: 'Demo Admin', role: 'admin' }
  ];

  testUsers.forEach((user) => {
    const hashedPassword = crypto.createHash('sha256').update(user.password).digest('hex');
    pool.query(
      'INSERT IGNORE INTO users (id, email, password, display_name, role) VALUES (?, ?, ?, ?, ?)',
      [user.id, user.email, hashedPassword, user.displayName, user.role],
      (err, results) => {
        if (err) {
          console.error(`Error creating test user ${user.email}:`, err.message);
        } else {
          const result = Array.isArray(results) ? results[0] : results;
          if (result && (result as any).affectedRows > 0) {
            console.log(`✓ Test user created: ${user.email} (${user.role})`);
          } else {
            console.log(`ℹ Test user already exists: ${user.email} (${user.role})`);
          }
        }
      }
    );
  });
}

startServer();
