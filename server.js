require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

// Initialize discord bot
//const client = require("./discord/index.js");

// Serve static files (HTML, CSS, JS) from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Route to handle /town_report
app.get('/town_report', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'town_report.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
