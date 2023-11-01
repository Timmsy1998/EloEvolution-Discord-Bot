const fs = require('fs');
const config = require('./config.json');
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [
      GatewayIntentBits.Guilds,
  ]
})

const { riotApiKey, discordToken } = config;

client.login(discordToken)
  .then(() => {
    console.log('Bot is now connected to Discord.');
  })
  .catch((error) => {
    console.error(`Error logging in: ${error}`);
  });
