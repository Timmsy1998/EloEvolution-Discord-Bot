const { CommandInteraction } = require("discord.js");
const { getSummonerDataByRegionAndName, getSummonerDataByDiscordUserId } = require("../database");

module.exports = {
  data: {
    name: "summoner",
    description: "Get summoner information",
    options: [
      {
        name: "region",
        type: 3,
        description: "Summoner region (e.g., na, euw)",
        required: false,
      },
      {
        name: "name",
        type: 3,
        description: "Summoner name",
        required: false,
      },
    ],
  },

  async execute(interaction) {
    // Check if both region and name options are provided
    const regionOption = interaction.options.getString("region");
    const nameOption = interaction.options.getString("name");

    let summonerData;

    if (regionOption && nameOption) {
      // Region and name provided in the command, fetch the summoner based on that
      const region = regionOption.toLowerCase();
      const summonerName = nameOption;
      summonerData = getSummonerDataByRegionAndName(region, summonerName);
    } else {
      // No region and name provided, use the Discord user ID to find the summoner
      const discordUserId = interaction.user.id;
      summonerData = getSummonerDataByDiscordUserId(discordUserId);
    }

    if (!summonerData) {
      await interaction.reply("No summoner found. Use `/register` to register a summoner.");
      return;
    }

    try {
      const region = summonerData.region || "N/A";
      const summonerName = summonerData.name || "N/A";
      const summonerLevel = summonerData.summonerLevel || "N/A";
      const mostPlayedChampionName = summonerData.mostPlayedChampion || "N/A";
      const winPercentage = summonerData.winPercentage || "N/A";
      const rankedWins = summonerData.rankedWins || "N/A";
      const rankedLosses = summonerData.rankedLosses || "N/A";
      const fullRank = summonerData.fullRank || "N/A";
      const fullicon = summonerData.fullicon || "N/A";
      const owner = summonerData.discordUserId || "N/A";

      // Construct an embed with the extended summoner information
      const embed = {
        color: 0x0099ff,
        title: "Summoner Information",
        thumbnail: {
          url: fullicon,
        },
        fields: [
          {
            name: "Summoner Name",
            value: summonerName,
            inline: true,
          },
          {
            name: "Region",
            value: region,
            inline: true,
          },
          {
            name: "Summoner Level",
            value: summonerLevel,
            inline: true,
          },
          {
            name: "Favourite Champion (Most Played)",
            value: mostPlayedChampionName,
            inline: true,
          },
          {
            name: "Winrate",
            value: `${winPercentage}%`,
            inline: true,
          },
          {
            name: "Win to Loss",
            value: `${rankedWins}W ${rankedLosses}L`,
            inline: true,
          },
          {
            name: "Rank Information",
            value: fullRank,
            inline: true,
          },
          {
            name: "Registered By",
            value: `<@${owner}>`,
            inline: true,
          },
        ],
      };

      // Send the embed as a reply
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      // Handle errors, such as invalid summoner name or API issues
      console.error(`Error fetching summoner data: ${error.message}`);
      await interaction.reply("Error fetching summoner data.");
    }
  },
};
