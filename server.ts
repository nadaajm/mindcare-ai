import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { NeuralKernelController } from "./src/server/Controllers/NeuralKernelController";
import { ClinicController } from "./src/server/Controllers/ClinicController";
import { UserController } from "./src/server/Controllers/UserController";
import { initializeDatabase } from "./src/server/database";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize database
  try {
    await initializeDatabase();
    console.log('MySQL database initialized');
  } catch (err) {
    console.error('Database initialization failed:', err);
  }

  // API Routes (The Control Layer - MVC Pattern)
  app.get("/api/health", NeuralKernelController.getHealth);
  app.post("/api/diagnostics", NeuralKernelController.getDiagnostics);
  app.get("/api/emotions", NeuralKernelController.getEmotions);
  
  // Clinic Module (Migrated logic)
  app.get("/api/v1/clinic/stats", ClinicController.getStats);
  app.get("/api/v1/clinic/list", ClinicController.getClinics);
  
// User Module (MySQL)
  app.get("/api/user/profile", UserController.getProfile);
  app.post("/api/user/profile", UserController.updateProfile);
  app.post("/api/user/register", UserController.register);
  app.post("/api/user/login", UserController.login);
  
  // Quick test user creation endpoint
  app.post("/api/user/create-test", UserController.createTestUser);

  // Serve static assets in production, use Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Neural Kernel active at http://localhost:${PORT}`);
  });
}

startServer();
