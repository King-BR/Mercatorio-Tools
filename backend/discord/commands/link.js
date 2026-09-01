const { SlashCommandBuilder } = require("discord.js");
const jwt = require("jsonwebtoken");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription(
      "Link your discord account to your Mercatorio Tools account.",
    ),

  /**
   * Link Command
   * @param {import("discord.js").Client} client
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(client, interaction) {
    const userId = interaction.user.id;
    const token = jwt.sign({ discordId: userId }, process.env.JWT_SECRET, {
      expiresIn: "5m",
    });

    const linkUrl = `${process.argv.includes("debug") ? process.env.DEBUG_BASE_URL : process.env.BASE_URL}/link?discordId=${userId}&token=${token}`;

    await interaction.reply(
      `Click [here](${linkUrl}) to connect your account. The link will expire in 5 minutes.`,
    );

    if (process.argv.includes("debug")) {
      console.log(
        `Link command executed by user ${interaction.user.tag} (${userId}).`,
      );
    }
  },
};
