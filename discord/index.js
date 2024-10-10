const fs = require("fs");
const path = require("path");
const Discord = require("discord.js");
const client = new Discord.Client({
  partials: ["MESSAGE", "REACTION"],
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
  // Set a new item in the Collection with the key as the command name and the value as the exported module
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

// and deploy your commands!
(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Discord.Routes.applicationGuildCommands(config.clientId, config.guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();

module.exports = client;
