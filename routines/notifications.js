const fs = require("fs");
const path = require("path");
const utils = require("../discord/utils.js");
const config = require("../discord/config.json");
const Notification = require("../models/notification.js");

/**
 *
 * @param {import("discord.js").Client} client
 */
async function routine(client) {
  // run the routine every 5 minutes past the hour, every 30 minutes past the hour and every 55 minutes past the hour
  while (true) {
    const now = new Date();
    const minutes = now.getMinutes();
    var period = null;
    var periodSend = false;

    if (minutes < 15) {
      period = "early";
      if (minutes == 5) periodSend = true;
    } else if (minutes < 40) {
      period = "mid";
      if (minutes == 30) periodSend = true;
    } else {
      period = "late";
      if (minutes == 50) periodSend = true;
    }

    await sendNotifications(client, period, periodSend);

    // wait until the next 5 minute mark
    await utils.wait(
      (5 - (new Date().getMinutes() % 5)) * 60 - new Date().getSeconds(),
    );
  }
}

async function sendNotifications(client, period, periodSend) {
  utils.sendDiscordMessage(
    client,
    config.errorChannelId,
    `Checking for notifications for period ${period}...`,
  );

  var notifications = await Notification.find({})
    .where("period")
    .in([period, "custom"])
    .exec();

  utils.sendDiscordMessage(
    client,
    config.errorChannelId,
    `Found ${notifications.length} notifications for period ${period}. Sending notifications...`,
  );

  notifications.forEach((notification) => {
    if (
      (notification.period.includes("custom") &&
        !notification.minutes.includes(new Date().getMinutes())) ||
      (!notification.period.includes("custom") && !periodSend)
    ) {
      return; // skip this notification if it's not the right time to send it
    }

    if (process.argv.includes("--debug")) {
      utils.sendDiscordMessage(
        client,
        config.errorChannelId,
        notification.message,
      );
    }

    utils.sendDMMessage(client, notification.creatorId, notification.message);
  });
}

module.exports = routine;
