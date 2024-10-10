const express = require("express");
const fs = require("fs");
const path = require("path")

const router = express.Router();

// GET /api/notification/:id
router.get("/:id", (req, res) => {
  const notifications = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/notifications.json"), "utf8"));
  const user = notifications.find(n => n.id === req.params.id);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// POST /api/notification/:id/add
router.post("/:id/add", (req, res) => {
  const notifications = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/notifications.json"), "utf8"));
  const user = notifications.find(n => n.id === req.params.id);
  if (user) {
    user.notifications.push(req.body);
    fs.writeFileSync(path.join(__dirname, "../data/notifications.json"), JSON.stringify(notifications));
    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// POST /api/notification/:id/delete
router.post("/:id/delete", (req, res) => {
  const notifications = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/notifications.json"), "utf8"));
  const user = notifications.find(n => n.id === req.params.id);
  if (user) {
    user.notifications = [];

    notifications.forEach((n, i) => {
      if (n.id === user.id) {
        notifications[i] = user;
      }
    });
    
    fs.writeFileSync(path.join(__dirname, "../data/notifications.json"), JSON.stringify(notifications));
    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// POST /api/notification/:id/delete/:notificationId
router.post("/:id/delete/:notificationId", (req, res) => {
  const notifications = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/notifications.json"), "utf8"));
  const user = notifications.find(n => n.id === req.params.id);
  if (user) {
    user.notifications = user.notifications.filter(n => n.id !== req.params.notificationId);

    notifications.forEach((n, i) => {
      if (n.id === user.id) {
        notifications[i] = user;
      }
    });
    
    fs.writeFileSync(path.join(__dirname, "../data/notifications.json"), JSON.stringify(notifications));
    res.json(user);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

module.exports = router;