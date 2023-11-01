const { CommandInteraction, MessageEmbed } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: {
    name: "summoner",
    description: "Get summoner information",
    options: [
      {
        name: "region",
        type: 3,
        description: "Summoner region (e.g., na, euw)",
        required: true
      },
      {
        name: "name",
        type: 3,
        description: "Summoner name",
        required: true
      }
    ]
  },

  async execute(interaction) {
    // Get the region and summoner name from the user's command input
    const region = interaction.options.getString("region").toLowerCase();
    const summonerName = interaction.options.getString("name");

    try {
      // Get your Riot API key from your config
      const { riotApiKey } = require("../config.json");

      // Fetch the current patch version from the League of Legends Data Dragon API
      const patchResponse = await axios.get(
        "https://ddragon.leagueoflegends.com/api/versions.json"
      );
      const currentPatch = patchResponse.data[0];

      // Define a mapping of region names to their corresponding Riot API suffix
      const regionSuffixes = {
        euw: "euw1",
        na: "na1",
        eune: "eun1",
        tr: "tr1"
      };

      // Check if the provided region is in the mapping
      if (region in regionSuffixes) {
        const riotRegion = regionSuffixes[region];
        const apiUrl = `https://${riotRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`;

        // Fetch summoner data using the Riot API
        const response = await axios.get(apiUrl, {
          headers: {
            "X-Riot-Token": riotApiKey
          }
        });

        // Get the summoner data
        const summoner = response.data;

        // Fetch the champion mastery data for all champions
        const championMasteryResponse = await axios.get(
          `https://${riotRegion}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/${summoner.id}`,
          {
            headers: {
              "X-Riot-Token": riotApiKey
            }
          }
        );

        // Sort the champion mastery data to find the most played champion
        const sortedChampionMasteries = championMasteryResponse.data.sort(
          (a, b) => b.championPoints - a.championPoints
        );

        // Get the most played champion
        const mostPlayedChampion = sortedChampionMasteries[0];

        // Get the champion ID and create an object to map champion IDs to names
        const championId = mostPlayedChampion.championId;
        const championIdToName = {};

        // Fetch the champion list data from the Data Dragon API
        const championListResponse = await axios.get(
          `https://ddragon.leagueoflegends.com/cdn/${currentPatch}/data/en_US/champion.json`
        );
        const championListData = championListResponse.data.data;

        // Populate the championIdToName object with champion name mappings
        for (const championKey in championListData) {
          const championData = championListData[championKey];
          const championName = championData.name;
          const championId = championData.key;
          championIdToName[championId] = championName;
        }

        // Get the most played champion's name
        const mostPlayedChampionId = mostPlayedChampion.championId;
        const mostPlayedChampionName = championIdToName[mostPlayedChampionId];

        // Fetch ranked information using the Riot API
        const rankedResponse = await axios.get(
          `https://${riotRegion}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`,
          {
            headers: {
              "X-Riot-Token": riotApiKey
            }
          }
        );

        // Initialize variables for ranked data
        let winPercentage = 0;
        let rankedTier = "Unranked";
        let rankedRank = "";
        let fullRank = "Unranked";
        let rankedLP = 0;
        let rankedWins = 0;
        let rankedLosses = 0;

        // Check if the summoner has ranked data
        if (rankedResponse.data.length > 0) {
          const rankedInfo = rankedResponse.data[1];
          rankedTier = rankedInfo.tier;
          rankedRank = rankedInfo.rank;
          rankedLP = rankedInfo.leaguePoints;
          fullRank = `${rankedTier} ${rankedRank} ${rankedLP} LP`;
          rankedWins = rankedInfo.wins;
          rankedLosses = rankedInfo.losses;

          // Calculate the win percentage
          winPercentage = Math.round(
            rankedWins / (rankedWins + rankedLosses) * 100
          );
        }

        // Construct an embed with the extended summoner information
        const embed = {
          color: 0x0099ff,
          title: "Summoner Information",
          thumbnail: {
            url: `http://ddragon.leagueoflegends.com/cdn/${currentPatch}/img/profileicon/${summoner.profileIconId}.png`
          },
          fields: [
            {
              name: "Summoner Name",
              value: summoner.name,
              inline: true
            },
            {
              name: "Summoner Level",
              value: summoner.summonerLevel,
              inline: true
            },
            {
              name: "Favorite Champion (Most Played)",
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
            }
          ]
        };

        // Send the embed as a reply
        await interaction.reply({ embeds: [embed] });
      } else {
        // Handle an unsupported or unknown region
        await interaction.reply(
          "Unsupported region. Please use a valid region."
        );
      }
    } catch (error) {
      // Handle errors, such as invalid summoner name or API issues
      console.error(`Error fetching summoner data: ${error.message}`);
      await interaction.reply("Error fetching summoner data.");
    }
  }
};
