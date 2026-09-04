require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
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
const client = require("./discord/index.js");

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.set("trust proxy", 1);

// Import API routes
const apiFolder = fs.readdirSync(path.join(__dirname, "api"));
const apiFiles = apiFolder.filter((file) => file.endsWith(".js"));

apiFiles.forEach((file) => {
  const route = require(`./api/${file}`);
  app.use(`/api/${file.replace(".js", "")}`, route);
});

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${port}`);
});
