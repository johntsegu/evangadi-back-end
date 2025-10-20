import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/dbConfig.js";
import authRoutes from "./routes/authRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import answerRoutes from "./routes/answerRoutes.js";
import { authenticate } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// CORS: allow frontend from env variable + local dev
app.use(
  cors({
    origin: [
      // "http://localhost:5173", // local dev

      "https://evangadi-forum.jonitsegu.com", // your live frontend
    ],
    credentials: true, // allow cookies or auth headers if needed
  })
);

//  Test DB connection once before starting server
(async () => {
  try {
    const connection = await db.getConnection();
    await connection.query("SELECT 1"); // lightweight check
    console.log(" Database connected successfully");
    connection.release();

    // Start server only if DB is OK
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("MySQL connection error:", err.message);
    process.exit(1); // fail fast if DB is down
  }
})();
// Routes
app.use("/api/user", authRoutes); // Authentication routes (login, signup, checkUser)
app.use("/api/question", authenticate, questionRoutes); // Question routes
app.use("/api/answer", authenticate, answerRoutes); // Answer routes

// Base route
app.get("/", (req, res) => {
  res.send("Evangadi Forum API is running...");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.name || "InternalServerError",
    message: err.message || "An unexpected error occurred.",
  });
});
