const axios = require("axios");
const { readSummonerDatabase, writeSummonerDatabase } = require("../database");

const updateFunction = async client => {
  // Read the current summoner database
  const summonerDB = readSummonerDatabase();
  const summonerDatabase = summonerDB.summoners;

  // Define the Riot API key and region suffixes
  const { riotApiKey } = require("../config.json");
  const regionSuffixes = {
    euw: "euw1",
    na: "na1",
    eune: "eun1",
    tr: "tr1"
  };

  // Fetch the current patch version from the League of Legends Data Dragon API
  const patchResponse = await axios.get(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  );
  const currentPatch = patchResponse.data[0];

  for (let i = 0; i < summonerDatabase.length; i++) {
    const existingSummoner = summonerDatabase[i];
    const { region, name } = existingSummoner;
    const riotRegion = regionSuffixes[region.toLowerCase()];
    const apiUrl = `https://${riotRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}`;

    try {
      // Fetch summoner data using the Riot API
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

      // Update the fields for this entry
      summonerDatabase[i].id = summoner.id;
      summonerDatabase[i].profileIconId = summoner.profileIconId;
      summonerDatabase[i].fullicon = fullicon;
      summonerDatabase[i].summonerLevel = summoner.summonerLevel;
      summonerDatabase[i].mostPlayedChampion = mostPlayedChampionName;
      summonerDatabase[i].winPercentage = winPercentage;
      summonerDatabase[i].rankedWins = rankedWins;
      summonerDatabase[i].rankedLosses = rankedLosses;
      summonerDatabase[i].fullRank = fullRank;
    } catch (error) {
      console.error(`Error updating summoner data: ${error.message}`);
    }
  }

  // Write the updated summoner database back to the file
  summonerDB.summoners = summonerDatabase;
  writeSummonerDatabase(summonerDB);
};

module.exports = updateFunction;
