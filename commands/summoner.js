const { CommandInteraction } = require("discord.js");
const {
  getSummonerDataByRegionAndName,
  getSummonerDataByDiscordUserId,
  readSummonerDatabase,
  writeSummonerDatabase
} = require("../database");

const updateFunction = require("../tasks/update");

module.exports = {
  data: {
    name: "summoner",
    description: "Get summoner information",
    options: [
      {
        name: "region",
        type: 3,
        description: "Summoner region (e.g., na, euw)",
        required: false
      },
      {
        name: "name",
        type: 3,
        description: "Summoner name",
        required: false
      }
    ]
  },

  async execute(interaction) {
    // Check if both region and name options are provided
    const regionOption = interaction.options.getString("region");
    const nameOption = interaction.options.getString("name");

    let summonerData;
    let summonerName;
    let region;

    if (regionOption && nameOption) {
      // Region and name provided in the command, fetch the summoner based on that
      region = regionOption.toLowerCase();
      summonerName = nameOption.toLowerCase();
      summonerData = getSummonerDataByRegionAndName(region, summonerName);

      // If summoner not found, register the summoner with discordUserId as null
      if (!summonerData) {
        const database = readSummonerDatabase();
        database.summoners.push({
          region: region,
          name: summonerName,
          discordUserId: null
        });

        // Write the updated database back to the file
        writeSummonerDatabase(database);

        updateFunction();

        setTimeout(async () => {
          // This code will run after a delay (e.g., 2000 milliseconds or 2 seconds)
          summonerData = getSummonerDataByRegionAndName(region, summonerName);
          // If summoner data is still not found, handle the error
          if (!summonerData) {
            console.log("Error fetching summoner data:" + summonerData);
            await interaction.reply("Error fetching summoner data.");
            return;
          }

          try {
            const region = summonerData.region || "N/A";
            const summonerName = summonerData.name || "N/A";
            const summonerLevel = summonerData.summonerLevel || "N/A";
            const mostPlayedChampionName =
              summonerData.mostPlayedChampion || "N/A";
            const winPercentage = summonerData.winPercentage || "N/A";
            const rankedWins = summonerData.rankedWins || "N/A";
            const rankedLosses = summonerData.rankedLosses || "N/A";
            const fullRank = summonerData.fullRank || "N/A";
            const fullicon = summonerData.fullicon || "N/A";
            const owner = summonerData.discordUserId || null;

            // Construct an embed with the extended summoner information
            const embed = {
              color: 0x0099ff,
              title: "Summoner Information",
              thumbnail: {
                url: fullicon
              },
              fields: [
                {
                  name: "Summoner Name",
                  value: summonerName,
                  inline: true
                },
                {
                  name: "Region",
                  value: region,
                  inline: true
                },
                {
                  name: "Summoner Level",
                  value: summonerLevel,
                  inline: true
                },
                {
                  name: "Favourite Champion (Most Played)",
                  value: mostPlayedChampionName,
                  inline: true
                },
                {
                  name: "Winrate",
                  value: `${winPercentage}%`,
                  inline: true
                },
                {
                  name: "Win to Loss",
                  value: `${rankedWins}W ${rankedLosses}L`,
                  inline: true
                },
                {
                  name: "Rank Information",
                  value: fullRank,
                  inline: true
                },
                {
                  name: "Registered By",
                  value: owner
                    ? `<@${owner}>`
                    : "Use command /register to register account ownership",
                  inline: true
                }
              ]
            };

            // Send the embed as a reply
            await interaction.reply({ embeds: [embed] });
          } catch (error) {
            // Handle errors, such as invalid summoner name or API issues
            console.error(`Error fetching summoner data: ${error.message}`);
            await interaction.reply("Error fetching summoner data.");
          }
        }, 2000); // 2000 milliseconds is 2 seconds (adjust as needed)
      }
    } else {
      // No region and name provided, use the Discord user ID to find the summoner
      const discordUserId = interaction.user.id;
      summonerData = getSummonerDataByDiscordUserId(discordUserId);
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
        const owner = summonerData.discordUserId || null;

        // Construct an embed with the extended summoner information
        const embed = {
          color: 0x0099ff,
          title: "Summoner Information",
          thumbnail: {
            url: fullicon
          },
          fields: [
            {
              name: "Summoner Name",
              value: summonerName,
              inline: true
            },
            {
              name: "Region",
              value: region,
              inline: true
            },
            {
              name: "Summoner Level",
              value: summonerLevel,
              inline: true
            },
            {
              name: "Favourite Champion (Most Played)",
              value: mostPlayedChampionName,
              inline: true
            },
            {
              name: "Winrate",
              value: `${winPercentage}%`,
              inline: true
            },
            {
              name: "Win to Loss",
              value: `${rankedWins}W ${rankedLosses}L`,
              inline: true
            },
            {
              name: "Rank Information",
              value: fullRank,
              inline: true
            },
            {
              name: "Registered By",
              value: owner
                ? `<@${owner}>`
                : "Use command /register to register account ownership",
              inline: true
            }
          ]
        };

        // Send the embed as a reply
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        // Handle errors, such as invalid summoner name or API issues
        console.error(`Error fetching summoner data: ${error.message}`);
        await interaction.reply("Error fetching summoner data.");
      }
    }
  }
};
