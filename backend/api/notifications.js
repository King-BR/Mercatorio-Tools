const express = require("express");
const auth = require("../middleware/auth");
const UsersDB = require("../models/users.js");
const NotificationsDB = require("../models/notification.js");

const router = express.Router();

// GET /api/notifications/:notificationID
router.get("/:notificationID", auth, async (req, res) => {
  try {
    const notification = await NotificationsDB.findById(
      req.params.notificationID,
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/notifications/user/:userID
router.get("/user/:userID", auth, async (req, res) => {
  try {
    const user = await UsersDB.findById(req.params.userID);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    var notifications = await NotificationsDB.find({ creatorId: req.params.userID });
    notifications = notifications.sort((a, b) => b.createdAt - a.createdAt);
    notifications = notifications.map((notification) => notification.toObject());
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/notifications/:userID/add
router.post("/:userID/add", auth, (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

// DELETE /api/notifications/:userID/:notificationID
router.delete("/:userID/:notificationID", auth, (req, res) => {
  // WIP
  res.status(501).json({ message: "Not implemented" });
});

module.exports = router;
