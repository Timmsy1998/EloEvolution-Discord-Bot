const { CommandInteraction } = require("discord.js");
const { readSummonerDatabase, writeSummonerDatabase } = require("../database");
const updateFunction = require("../tasks/update");
const axios = require("axios");

module.exports = {
  data: {
    name: "register",
    description: "Register a summoner in the database",
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
    const summonerName = interaction.options.getString("name").toLowerCase();

    try {
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

        const fullicon = `http://ddragon.leagueoflegends.com/cdn/${currentPatch}/img/profileicon/${summoner.profileIconId}.png`;

        // Read the current summoner database
        const database = readSummonerDatabase();

        // Check if the summoner is already registered
        const existingSummonerIndex = database.summoners.findIndex(
          s => s.id === summoner.id
        );

        if (existingSummonerIndex !== -1) {
          // Update the existing summoner if the Discord ID matches the owner's ID or is null
          const existingSummoner = database.summoners[existingSummonerIndex];
          if (
            existingSummoner.discordUserId === null ||
            existingSummoner.discordUserId === interaction.user.id
          ) {
            database.summoners[existingSummonerIndex] = {
              ...existingSummoner,
              id: summoner.id,
              region: region,
              name: summonerName,
              profileIconId: summoner.profileIconId,
              fullicon: fullicon,
              summonerLevel: summoner.summonerLevel,
              mostPlayedChampion: mostPlayedChampionName,
              winPercentage: winPercentage,
              rankedWins: rankedWins,
              rankedLosses: rankedLosses,
              fullRank: fullRank,
              discordUserId: interaction.user.id
            };
          } else {
            return interaction.reply(
              "Summoner already registered with a different Discord user."
            );
          }
        } else {
          // Add a new summoner to the database
          database.summoners.push({
            id: summoner.id,
            region: region,
            name: summonerName,
            profileIconId: summoner.profileIconId,
            fullicon: fullicon,
            summonerLevel: summoner.summonerLevel,
            mostPlayedChampion: mostPlayedChampionName,
            winPercentage: winPercentage,
            rankedWins: rankedWins,
            rankedLosses: rankedLosses,
            fullRank: fullRank,
            discordUserId: interaction.user.id
          });
        }

        // Write the updated database back to the file
        writeSummonerDatabase(database);
      } else {
        // Handle an unsupported or unknown region
        await interaction.reply(
          "Unsupported region. Please use a valid region."
        );
      }

      return interaction.reply("Summoner successfully registered.");
    } catch (error) {
      console.error(`Error registering summoner: ${error.message}`);
      return interaction.reply("Error registering summoner.");
    }
  }
};
