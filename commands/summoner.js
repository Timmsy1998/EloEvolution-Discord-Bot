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
    const region = interaction.options.getString("region").toLowerCase();
    const summonerName = interaction.options.getString("name");

    try {
      const { riotApiKey } = require("../config.json");

      const patchResponse = await axios.get(
        "https://ddragon.leagueoflegends.com/api/versions.json"
      );
      const currentPatch = patchResponse.data[0];

      const regionSuffixes = {
        euw: "euw1",
        na: "na1",
        eune: "eun1",
        tr: "tr1"
      };

      if (region in regionSuffixes) {
        const riotRegion = regionSuffixes[region];
        const apiUrl = `https://${riotRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${summonerName}`;

        const response = await axios.get(apiUrl, {
          headers: {
            "X-Riot-Token": riotApiKey
          }
        });

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

        const sortedChampionMasteries = championMasteryResponse.data.sort(
          (a, b) => b.championPoints - a.championPoints
        );

        const mostPlayedChampion = sortedChampionMasteries[0];
        const championId = mostPlayedChampion.championId;
        const championIdToName = {};

        const championListResponse = await axios.get(
          `https://ddragon.leagueoflegends.com/cdn/${currentPatch}/data/en_US/champion.json`
        );
        const championListData = championListResponse.data.data;

        for (const championKey in championListData) {
          const championData = championListData[championKey];
          const championName = championData.name;
          const championId = championData.key;
          championIdToName[championId] = championName;
        }

        const mostPlayedChampionId = mostPlayedChampion.championId;
        const mostPlayedChampionName = championIdToName[mostPlayedChampionId];

        const rankedResponse = await axios.get(
            `https://${riotRegion}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`,
            {
              headers: {
                "X-Riot-Token": riotApiKey
              }
            }
          );

          let winPercentage = 0;
          let rankedTier = "Unranked";
          let rankedRank = "";
          let fullRank = "Unranked";
          let rankedLP = 0;
          let rankedWins = 0;
          let rankedLosses = 0;
          
          if (rankedResponse.data.length > 0) {
            const rankedInfo = rankedResponse.data[1];
            rankedTier = rankedInfo.tier;
            rankedRank = rankedInfo.rank;
            rankedLP = rankedInfo.leaguePoints;
            fullRank = `${rankedTier} ${rankedRank} ${rankedLP} LP`;
            rankedWins = rankedInfo.wins;
            rankedLosses = rankedInfo.losses;
            winPercentage = Math.round((rankedWins / (rankedWins + rankedLosses)) * 100);
          }

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

        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply(
          "Unsupported region. Please use a valid region."
        );
      }
    } catch (error) {
      console.error(`Error fetching summoner data: ${error.message}`);
      await interaction.reply("Error fetching summoner data.");
    }
  }
};
