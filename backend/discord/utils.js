const config = require("./config.json");

module.exports = {
  /**
   * Wait for a specified number of seconds
   * @param {number} seconds
   * @returns {Promise<void>}
   */
  wait: function (seconds) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  },

  /**
   * Send a message to a channel
   * @param {import("discord.js").Client} client
   * @param {import("discord.js").Snowflake} channelID
   * @param {string} message
   */
  sendDiscordMessage: function (client, channelID, message) {
    client.channels
      .fetch(channelID)
      .then((channel) => {
        if (channel.isSendable()) {
          channel.send(message).catch((error) => {
            client.channels.fetch(config.errorChannelId).then((channel) => {
              channel.send(
                `**Error sending message to channel with ID ${channelID}**\n\n> Message:\n${message}\n\n> Error:\n${error}`,
              );
            });
          });
        } else {
          client.channels.fetch(config.errorChannelId).then((channel) => {
            channel.send(
              `**Error sending message to channel with ID ${channelID}**\n\n> Message:\n${message}\n\n> Error:\nChannel is not sendable.`,
            );
          });
        }
      })
      .catch((error) => {
        client.channels.fetch(config.errorChannelId).then((channel) => {
          channel.send(
            `**Error sending message to channel with ID ${channelID}**\n\n> Message:\n${message}\n\n> Error:\n${error}`,
          );
        });
      });
  },

  /**
   * Send a private message to a user
   * @param {import("discord.js").Client} client
   * @param {import("discord.js").Snowflake} userID
   * @param {string} message
   */
  sendDMMessage: function (client, userID, message) {
    client.users
      .fetch(userID)
      .then((user) => {
        user.send(message).catch((error) => {
          client.channels.fetch(config.errorChannelId).then((channel) => {
            channel.send(
              `**Error sending DM to user ${user.tag} (${userID})**\n\n> Message:\n${message}\n\n> Error:\n${error}`,
            );
          });
        });
      })
      .catch((error) => {
        client.channels.fetch(config.errorChannelId).then((channel) => {
          channel.send(
            `**Error fetching user with ID ${userID}**\n\n> Message:\n${message}\n\n> Error:\n${error}`,
          );
        });
      });
  },
};
