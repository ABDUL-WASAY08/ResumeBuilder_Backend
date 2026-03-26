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
// 1. Middlewares
app.use(
  cors({
    origin: process.env.CLIENTURL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
// 2. Database Connection
connectDatabase();
//routes
app.use("/RB", userRoute);
app.use("/RB", Groqrouter);

// 4. 404 Not Found Handler
app.use((req, res, next) => {
  const error = new Error("Not Found");
  error.status = 404;
  next(error);
});
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
