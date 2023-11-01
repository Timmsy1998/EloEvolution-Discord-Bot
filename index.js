const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});
const { discordToken } = require('./config.json');
const path = require('path');

const commandsDir = './commands';

client.login(discordToken)
  .then(() => {
    console.log('Bot is now connected to Discord.');
  })
  .catch((error) => {
    console.error(`Error logging in: ${error}`);
  });

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const rest = client.application.commands;

  const commandFiles = fs.readdirSync(commandsDir).filter((file) => file.endsWith('.js'));

  const commands = commandFiles.map((file) => {
    const command = require(path.join(__dirname, commandsDir, file));
    return command.data;
  });

  // Register the slash commands
  await rest.set(commands);

  console.log('Successfully registered slash commands.');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  const commandFile = commandFiles.find((file) => file.startsWith(`${commandName}.js`));

  if (commandFile) {
    const command = require(path.join(__dirname, commandsDir, commandFile));
    command.execute(interaction);
  } else {
    interaction.reply('Unknown command. Please use a valid command.');
  }
});
