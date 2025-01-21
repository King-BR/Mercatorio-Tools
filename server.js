require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_DB)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((error) => {
    console.error(`Error connecting to database:\n${error}`);
  });

const app = express();
const port = 3001;

// Initialize discord bot
// const client = require("./discord/index.js");

app.use(cors());
app.use(express.json());

// Serve main page
app.use(express.static(path.join(__dirname, "public")));

// Serve pages dynamically
const pagesFolder = fs.readdirSync(path.join(__dirname, "public"));
const pagesFiles = pagesFolder.filter((file) => file.endsWith(".html"));

pagesFiles.forEach((file) => {
  app.use(
    `/${file.replace(".html", "")}`,
    express.static(path.join(__dirname, "public", file))
  );
});

const dashboardFolder = fs.readdirSync(
  path.join(__dirname, "public", "dashboard")
);
const dashboardFiles = dashboardFolder.filter((file) => file.endsWith(".html"));

dashboardFiles.forEach((file) => {
  app.use(
    `/dashboard/${file.replace(".html", "")}`,
    express.static(path.join(__dirname, "public", "dashboard", file))
  );
});

// Import API routes
const apiFolder = fs.readdirSync(path.join(__dirname, "api"));
const apiFiles = apiFolder.filter((file) => file.endsWith(".js"));
const apiProtectedFolder = fs.readdirSync(
  path.join(__dirname, "api", "protected")
);

apiFiles.forEach((file) => {
  const route = require(`./api/${file}`);
  app.use(`/api/${file.replace(".js", "")}`, route);
});

apiProtectedFolder.forEach((file) => {
  const route = require(`./api/protected/${file}`);
  app.use(`/api/${file.replace(".js", "")}`, route);
});

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
});
