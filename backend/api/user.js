const express = require("express");
const fs = require("fs");
const path = require("path")

const router = express.Router();




// GET /api/user
router.get("/", (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});


module.exports = router;