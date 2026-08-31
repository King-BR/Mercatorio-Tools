const { PresenceUpdateStatus, ActivityType, Events } = require("discord.js");
const { Notification } = require("../../models/notification.js");
const utils = require("../utils.js");
const config = require("../config.json");
const notificationRoutine = require("../../routines/notifications.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  /**
   * Ready Event
   * @param {import("discord.js").Client} client
   * @returns
   */
  async execute(client, readyClient) {
    console.log(
      `${process.argv.includes("--debug") ? "[DEBUG] " : ""}Logged in as ${client.user.tag} with ${client.commands.size} commands and ${client.events.size} events loaded.`,
    );

    // Send a message to the bot channel indicating that the bot is online
    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `${process.argv.includes("--debug") ? "[DEBUG] " : ""}Bot is online with ${client.commands.size} commands and ${client.events.size} events loaded.`,
    );

    // set presence loop
    var presenceIndex = 0;
    setInterval(async () => {
      const presenceList = [
        {
          name: "Custom Notifications",
          type: ActivityType.Playing,
          url: process.env.BASE_URL,
        },
        {
          name: "with Mercatorio Tools",
          type: ActivityType.Playing,
          url: process.env.BASE_URL,
        },
        {
          name: "Mercatorio",
          type: ActivityType.Playing,
          url: process.env.GAME_URL,
        },
        {
          name: "with the Interactive Map",
          type: ActivityType.Playing,
          url: process.env.MAP_URL,
        },
      ];

      if (presenceList.length > 0) {
        if (presenceIndex >= presenceList.length) presenceIndex = 0;

        const presence = presenceList[presenceIndex];
        client.user.setPresence({
          activities: [presence],
          status: PresenceUpdateStatus.Online,
        });
        presenceIndex++;

        //console.log(`Presence updated to: ${presence.name} (${presence.type})`);
      }
    }, 60 * 1000);

    // start custom notification routine
    notificationRoutine(client);
  },
};
