import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import giftRouter from "./route";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "thoughtly-backend" });
});

// Routes
app.use("/api/gift", giftRouter);

// Start (only when running locally, not on Vercel serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[Thoughtly] Server running on http://localhost:${PORT}`);
  });
}

export default app;
