import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRouter from "./server/routes/api";
import { errorHandler } from "./server/middleware/errorHandler";
import { db } from "./server/db/db";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Print startup database diagnostic
  const dbLoaded = await db.ping();
  console.log(`[DevLaunch Database] Local JSON datastore initialized: ${dbLoaded ? "OK" : "FAILED"}`);

  // Set up standard express parsers
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Mount API Gateway routes first
  app.use("/api", apiRouter);

  // Serve custom uploaded physical files statically
  app.use("/uploads", express.static(path.join(process.cwd(), "data", "uploads")));

  // Centralized Error Handling Middlewares (must be mounted after API paths)
  app.use(errorHandler as any);

  // Configure Vite dev middleware or serve static production build
  if (process.env.NODE_ENV !== "production") {
    console.log("[DevLaunch Engine] Operating in Development Mode. Binding Vite HMR proxy middlewares...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[DevLaunch Engine] Operating in Production Mode. Serving static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[DevLaunch Service] Running and routing traffic on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[DevLaunch Startup Error] Service collapsed on bootstrap:", err);
});
