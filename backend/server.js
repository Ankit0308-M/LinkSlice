// Load environment variables
require("dotenv").config();

// Import packages
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const authRoutes = require("./routes/authRoutes");

const pageRoutes = require("./routes/pageRoutes");
const urlRoutes = require("./routes/urlRoutes");

const {
  redirectUrl
} = require("./controllers/urlControllers");


// Import database connection
const connectDB = require("./config/db");

// Initialize Express
const app = express();

// Middleware
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true
  })
);


// Health check API
app.get("/api/health", (req, res) => {
  const dbStatus =
    require("mongoose").connection.readyState;

  res.status(200).json({
    success: true,
    message: "URL Shortener Backend is running!",
    server: "OK",
    database:
      dbStatus === 1 ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString()
  });
});

app.use(express.json());

app.use(cookieParser());
app.use("/api/auth", authRoutes);


app.use("/api/pages", pageRoutes);
app.use("/api/urls", urlRoutes);

// Public short URL redirect
app.get("/:shortId", redirectUrl);

// Root API
app.get("/", (req, res) => {
  res.send("Welcome to URL Shortener API");
});


// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Public short URL redirect
app.get("/:shortId", redirectUrl);

// Start server only after database connection
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log("--------------------------------");
      console.log(`Server: http://localhost:${PORT}`);
      console.log("MongoDB: Connected");
      console.log("Backend started successfully!");
      console.log("--------------------------------");
    });

  } catch (error) {
    console.error("Failed to start backend:", error.message);
    process.exit(1);
  }
};

startServer();