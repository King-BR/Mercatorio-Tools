const fs = require("fs");
const path = require("path");
const config = require("./config.json");
const utils = require("./utils.js");
const Discord = require("discord.js");
const client = new Discord.Client({
  allowedMentions: { parse: ["users", "roles"] },
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

client.login(process.env.DISCORD_TOKEN);

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
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
    );

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
    );
  }
}

console.log(`Loaded ${commands.length} commands.`);

// Create event handler
client.events = new Discord.Collection();
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (!event.name || !event.execute) {
    console.log(
      `[WARNING] The event at ${filePath} is missing a required "name" or "execute" property.`,
    );

    utils.sendDiscordMessage(
      client,
      config.errorChannelId,
      `[WARNING] The event at ${filePath} is missing a required "name" or "execute" property.`,
    );
    continue;
  }

  client.events.set(event.name, event);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(client, ...args));
  } else {
    client.on(event.name, (...args) => event.execute(client, ...args));
  }
}

console.log(`Loaded ${eventFiles.length} events.`);

// Construct and prepare an instance of the REST module
const rest = new Discord.REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`,
    );

    const data = await rest.put(
      Discord.Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commands },
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`,
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
};
