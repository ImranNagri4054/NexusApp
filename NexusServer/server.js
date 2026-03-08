const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const { connectDB } = require("./src/config/db");
const authRoutes = require("./src/routes/auth");
const journalRoutes = require("./src/routes/journals");
const issueRoutes = require("./src/routes/issues");

const app = express();

// Basic config
const PORT = process.env.PORT || 5001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

// Database
connectDB();

// Middleware
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-this-session-secret",
    resave: false,
    saveUninitialized: false,
  }),
);

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/journals", journalRoutes);
app.use("/api/issues", issueRoutes);

// Serve uploaded journal images
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads")),
);

// Health check
app.get("/api/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static HTML from parent project root
app.use(express.static(path.join(__dirname, "..")));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Nexus API server running on http://localhost:${PORT}`);
});
