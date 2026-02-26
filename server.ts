import express from "express";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Database setup
  const db = await open({
    filename: path.join(__dirname, "database.sqlite"),
    driver: sqlite3.Database,
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      userId TEXT,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      userId TEXT,
      data TEXT
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      password TEXT
    );
  `);

  // --- API Routes ---

  // Auth (Simple Mock)
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    // In a real app, verify password. For this demo, we just find or create.
    let user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (!user) {
      const id = crypto.randomUUID();
      await db.run("INSERT INTO users (id, email, name, password) VALUES (?, ?, ?, ?)", [
        id,
        email,
        email.split("@")[0],
        password,
      ]);
      user = { id, email, name: email.split("@")[0] };
    }
    res.json(user);
  });

  // Tasks
  app.get("/api/tasks/:userId", async (req, res) => {
    const { userId } = req.params;
    const rows = await db.all("SELECT data FROM tasks WHERE userId = ?", [userId]);
    res.json(rows.map((r) => JSON.parse(r.data)));
  });

  app.post("/api/tasks/:userId", async (req, res) => {
    const { userId } = req.params;
    const task = req.body;
    await db.run("INSERT OR REPLACE INTO tasks (id, userId, data) VALUES (?, ?, ?)", [
      task.id,
      userId,
      JSON.stringify(task),
    ]);
    res.json({ status: "ok" });
  });

  app.delete("/api/tasks/:userId/:taskId", async (req, res) => {
    const { userId, taskId } = req.params;
    await db.run("DELETE FROM tasks WHERE id = ? AND userId = ?", [taskId, userId]);
    res.json({ status: "ok" });
  });

  // Finance
  app.get("/api/finance/:userId", async (req, res) => {
    const { userId } = req.params;
    const rows = await db.all("SELECT data FROM transactions WHERE userId = ?", [userId]);
    res.json(rows.map((r) => JSON.parse(r.data)));
  });

  app.post("/api/finance/:userId", async (req, res) => {
    const { userId } = req.params;
    const transaction = req.body;
    await db.run("INSERT OR REPLACE INTO transactions (id, userId, data) VALUES (?, ?, ?)", [
      transaction.id,
      userId,
      JSON.stringify(transaction),
    ]);
    res.json({ status: "ok" });
  });

  app.delete("/api/finance/:userId/:transactionId", async (req, res) => {
    const { userId, transactionId } = req.params;
    await db.run("DELETE FROM transactions WHERE id = ? AND userId = ?", [transactionId, userId]);
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
