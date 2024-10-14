const express = require("express");
const fs = require("fs");
const path = require("path");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/notifications/:id
router.get("/:id", (req, res) => {
  const notifications = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/notifications.json"), "utf8")
  );
  const user = notifications.find((n) => n.id === req.params.id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// POST /api/notifications/:id/add
router.post("/:id/add", auth, (req, res) => {
  if (req.params.id !== req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const notifications = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/notifications.json"), "utf8")
  );
  const user = notifications.find((n) => n.id === req.params.id);
  if (user) {
    user.notifications.push(req.body);
    fs.writeFileSync(
      path.join(__dirname, "../data/notifications.json"),
      JSON.stringify(notifications)
    );
    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// POST /api/notifications/:id/delete/:notificationId
router.post("/:id/delete/:notificationId", auth, (req, res) => {
  if (req.params.id !== req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const notifications = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/notifications.json"), "utf8")
  );
  const user = notifications.find((n) => n.id === req.params.id);
  if (user) {
    user.notifications = user.notifications.filter(
      (n) => n.id !== req.params.notificationId
    );

    fs.writeFileSync(
      path.join(__dirname, "../data/notifications.json"),
      JSON.stringify(notifications)
    );
    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

module.exports = router;
