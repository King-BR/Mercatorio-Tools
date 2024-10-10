module.exports = 
/**
 * Ready Event 
 * @param {import("discord.js").Client} client
 * @returns
 */
(client) => {
  console.log(`Logged in as ${client.user.tag}!`);
};
