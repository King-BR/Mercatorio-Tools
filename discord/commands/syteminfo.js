const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const si = require("systeminformation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("systeminfo")
    .setDescription("Get system information."),
    /**
     * System Information Command
     * @param {import("discord.js").Client} client
     * @param {import("discord.js").ChatInputCommandInteraction} interaction 
     */
  async execute(client, interaction) {
    const data = await si.get({
      cpu: "manufacturer, brand, speed, cores",
      osInfo: "platform, distro, release, arch",
      system: "model, manufacturer",
      mem: "total, used, free",
    });

    const embed = new EmbedBuilder();

    embed.setTimestamp();
    embed.setColor("#0099ff");
    embed.setTitle("System Information");
    embed.addFields(
      { name: "OS", value: `${data.osInfo.platform} ${data.osInfo.distro} ${data.osInfo.release} (${data.osInfo.arch})` },
      { name: "Model", value: `${data.system.manufacturer} ${data.system.model}`, inline: true },
      { name: "CPU", value: `${data.cpu.manufacturer} ${data.cpu.brand} ${data.cpu.speed} GHz (${data.cpu.cores} cores)`, inline: true },
      { name: "Memory", value: `${(data.mem.total / 1024 / 1024 / 1024).toFixed(2)} GB (${(data.mem.used / 1024 / 1024 / 1024).toFixed(2)} GB used, ${(data.mem.free / 1024 / 1024/ 1024).toFixed(2)} GB free)`},
    );

    await interaction.reply({ embeds: [embed] });
  }
}