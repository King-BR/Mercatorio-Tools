const { Events, MessageFlags } = require("discord.js");
const utils = require("../utils.js");
const config = require("../config.json");

module.exports = {
  name: Events.InteractionCreate,
  /**
   * Interaction Create Event
   * @param {import("discord.js").Client} client
   * @param {import("discord.js").Interaction} interaction
   * @returns
   */
  execute(client, interaction) {
    if (!interaction || !interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      command.execute(client, interaction);
    } catch (error) {
      console.error(error);
      utils.sendDiscordMessage(
        client,
        config.errorChannelId,
        `Error executing command ${interaction.commandName}: ${error.message}`,
      );

      if (interaction.replied || interaction.deferred) {
        interaction.followUp({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        interaction.reply({
          content: "There was an error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
