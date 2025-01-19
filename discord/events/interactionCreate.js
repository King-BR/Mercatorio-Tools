module.exports =
  /**
   * Interaction Create Event
   * @param {import("discord.js").Client} client
   * @param {import("discord.js").Interaction} interaction
   * @returns
   */
  (client, interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      command.execute(client, interaction);
    } catch (error) {
      console.error(error);
      interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  };
