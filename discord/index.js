const fs = require("fs");
const path = require("path");
const Discord = require("discord.js");
const client = new Discord.Client({
  partials: [
    Discord.Partials.Message,
    Discord.Partials.User,
    Discord.Partials.GuildMember,
    Discord.Partials.Channel,
  ],
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMessageReactions,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.MessageContent,
    Discord.GatewayIntentBits.DirectMessages,
    Discord.GatewayIntentBits.DirectMessageReactions,
  ],
});
const config = require("./config.json");

client.login(process.env.DISCORD_TOKEN);

// Create event handler
fs.readdirSync(path.join(__dirname, "events")).forEach((file) => {
  const event = require(path.join(__dirname, "events", file));
  const eventName = file.split(".")[0];
  client.on(eventName, event.bind(null, client));
});

// Create command handler
client.commands = new Discord.Collection();
const commands = [];
const commandsFolder = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsFolder)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsFolder, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

// Construct and prepare an instance of the REST module
const rest = new Discord.REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const data = await rest.put(
      Discord.Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();

module.exports = {
  /**
   * The Discord client instance
   * @type {Discord.Client}
   */
  client,

  /**
   * Send a message to a channel
   * @param {Discord.Snowflake} id
   * @param {string} message
   */
  sendDiscordMessage: function (id, message) {
    client.channels
      .fetch(id)
      .then((channel) => {
        if (channel.isSendable()) {
          channel.send(message).catch((error) => {
            client.channels.fetch(config.errorChannelId).then((channel) => {
              channel.send(
                `**Error sending message to channel with ID ${id}**\n\n> Message:\n${message}\n\n> Error:\n${error}`
              );
            });
          });
        } else {
          client.channels.fetch(config.errorChannelId).then((channel) => {
            channel.send(
              `**Error sending message to channel with ID ${id}**\n\n> Message:\n${message}\n\n> Error:\nChannel is not sendable.`
            );
          });
        }
      })
      .catch((error) => {
        client.channels.fetch(config.errorChannelId).then((channel) => {
          channel.send(
            `**Error sending message to channel with ID ${id}**\n\n> Message:\n${message}\n\n> Error:\n${error}`
          );
        });
      });
  },

  /**
   * Send a private message to a user
   * @param {Discord.Snowflake} id
   * @param {string} message
   */
  sendDMMessage: function (id, message) {
    client.users
      .fetch(id)
      .then((user) => {
        user.send(message).catch((error) => {
          client.channels.fetch(config.errorChannelId).then((channel) => {
            channel.send(
              `**Error sending DM to user ${user.tag}**\n\n> Message:\n${message}\n\n> Error:\n${error}`
            );
          });
        });
      })
      .catch((error) => {
        client.channels.fetch(config.errorChannelId).then((channel) => {
          channel.send(
            `**Error fetching user with ID ${id}**\n\n> Message:\n${message}\n\n> Error:\n${error}`
          );
        });
      });
  },
};
