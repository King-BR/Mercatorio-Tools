require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Connect to MongoDB
mongoose.connect(process.env.MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const app = express();
const port = 3000;

// Initialize discord bot
//const client = require("./discord/index.js");

// Serve static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Route to handle /town_report
app.get("/town_report", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "town_report.html"));
});

// Route to handle /notifications
app.get("/notifications", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "notifications.html"));
});

// Import API routes
const apiFolder = fs.readdirSync(path.join(__dirname, "api"));
const apiFiles = apiFolder.filter((file) => file.endsWith(".js"));
const apiProtectedFolder = fs.readdirSync(
  path.join(__dirname, "api/protected")
);

apiFiles.forEach((file) => {
  const route = require(`./api/${file}`);
  app.use(`/api/${file.replace(".js", "")}`, route);
});

apiProtectedFolder.forEach((file) => {
  const route = require(`./api/protected/${file}`);
  const middleware = require(`./middleware/${file}`);
  app.use(`/api/${file.replace(".js", "")}`, middleware, route);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
