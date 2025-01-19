const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription(
      "Link your discord account to your Mercatorio Tools account."
    ),
  /**
   * Link Command
   * @param {import("discord.js").Client} client
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(client, interaction) {},
};
