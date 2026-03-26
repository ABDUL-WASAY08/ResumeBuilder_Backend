const dns = require("node:dns/promises");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDatabase = require("./src/Config/ConnectDB.config");
const userRoute = require("./src/Route/Auth.route");
const Groqrouter = require("./src/Route/Groq.route");

const app = express();
const PORT = process.env.PORT || 5000;

// Database Connection
connectDatabase();

// 1. CORS Middleware (Origin ko fallback ke sath rakhein)
app.use(cors({
  origin: process.env.CLIENTURL || "https://resume-builder-frontend-rosy-two.vercel.app",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// 2. Preflight FIX (Yeh line change ki hai)
app.options("/(.*)", cors()); 

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/RB", userRoute);
app.use("/RB", Groqrouter);

// 404 Handler
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});

// Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = app;