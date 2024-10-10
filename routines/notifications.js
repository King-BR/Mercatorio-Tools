const fs = require("fs");
const path = require("path");
const { sendDiscordMessage } = require("../discord/index.js");

function sendNotifications() {
  const notifications = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/notifications.json"), "utf8"));
  const users = notifications.filter(n => n.notifications.length > 0);

  users.forEach(user => {
    user.notifications.forEach(notification => {
      sendDiscordMessage(user.id, notification.message);
    });
  });
}

module.exports = sendNotifications;