const { CommandInteraction } = require("discord.js");

module.exports = {
  data: {
    name: "restart",
    description: "Restart the bot."
  },

  async execute(interaction) {
    const allowedUserId = "789389975308730398";
    if (interaction.user.id === allowedUserId) {
      await interaction.reply("Restarting the bot...");
      process.exit(0);
    } else {
      await interaction.reply("You are not authorized to use this command.");
    }
  }
};
