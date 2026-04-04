import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import giftRouter from "./route";

dotenv.config();

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

// Start
app.listen(PORT, () => {
  console.log(`[Thoughtly] Server running on http://localhost:${PORT}`);
});

export default app;
