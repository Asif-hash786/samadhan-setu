import cors from "cors";
import express from "express";
import challengeRoutes from "./routes/challengeRoutes.js";
import prisma from "./config/prisma.js";
import authRoutes from "./routes/authRoutes.js";
import universityRoutes from "./routes/universityRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/v1/database-test", async (req, res) => {
  try {
    const challengeCount = await prisma.challenge.count();

    res.json({
      success: true,
      message: "Neon database connected successfully",
      challengeCount,
    });
  } catch (error) {
    console.error("Database test failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Samadhan Setu API is running",
  });
});

app.use("/api/v1/challenges", challengeRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/universities", universityRoutes);
app.use("/api/v1/uploads", uploadRoutes);
app.use("/api/v1/locations", locationRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

export default app;