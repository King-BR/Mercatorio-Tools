const { SlashCommandBuilder, MessageFlags } = require("discord.js");

const config = require("../config.json");
const utils = require("../utils.js");

const API_KEY = process.env.ADMIN_MERCTOOLS_KEY;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription(
      "Link your discord account to your Mercatorio Tools account",
    )
    .addStringOption((option) =>
      option
        .setName("code")
        .setDescription("Link code displayed on Mercatorio Tools")
        .setRequired(true),
    ),

  async execute(interaction) {
    const code = interaction.options
      .getString("code", true)
      .trim()
      .toUpperCase();

    const discordID = interaction.user.id;

    if (!API_KEY) {
      console.error("ADMIN_MERCTOOLS_KEY is not configured.");

      utils.sendDiscordMessage(
        interaction.client,
        config.errorChannelId,
        "ADMIN_MERCTOOLS_KEY is not configured.",
      );

      return interaction.reply({
        content: "The bot is not configured correctly. Please try again later.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const response = await fetch(
        `${process.env.MERCTOOLS_URL}/api/auth/discord/link`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },

          body: JSON.stringify({
            code,
            discordID,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 404) {
          return interaction.reply({
            content: "Invalid link code.",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (response.status === 400) {
          return interaction.reply({
            content:
              "This link code has expired. Generate a new code on Mercatorio Tools.",
            flags: MessageFlags.Ephemeral,
          });
        }

        if (response.status === 409) {
          return interaction.reply({
            content:
              "This Discord account is already linked to another Mercatorio Tools account.",
            flags: MessageFlags.Ephemeral,
          });
        }

        console.error("Error linking Discord account:", response.status, data);

        utils.sendDiscordMessage(
          interaction.client,
          config.errorChannelId,
          `Error linking Discord account: ${response.status}\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
        );

        return interaction.reply({
          content: "Could not link your account. Please try again later.",
          flags: MessageFlags.Ephemeral,
        });
      }

      return interaction.reply({
        content:
          "Your Discord account has been successfully linked to Mercatorio Tools!",
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("Error making link request:", error);

      utils.sendDiscordMessage(
        interaction.client,
        config.errorChannelId,
        `Error making link request: ${error.message}`,
      );

      return interaction.reply({
        content:
          "An error occurred while trying to link your account. Please try again later.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
