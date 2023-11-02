const fs = require("fs");
const path = require("path");

const databasePath = path.join(__dirname, "database/summonerDB.json");

function initializeSummonerDatabase() {
  if (!fs.existsSync(databasePath)) {
    // Create an empty database file if it doesn't exist
    const emptyDatabase = { summoners: [] };
    fs.writeFileSync(databasePath, JSON.stringify(emptyDatabase, null, 2));
  }
}

function readSummonerDatabase() {
  try {
    const databaseContents = fs.readFileSync(databasePath, "utf8");
    return JSON.parse(databaseContents);
  } catch (error) {
    console.error(`Error reading summoner database: ${error}`);
    return { summoners: [] }; // Return an empty database in case of an error
  }
}

function writeSummonerDatabase(data) {
  fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));
}

function getSummonerDataByRegionAndName(region, summonerName) {
  const summonerDB = readSummonerDatabase();
  return summonerDB.find(
    entry =>
      entry.region.toLowerCase() === region.toLowerCase() &&
      entry.summonerName.toLowerCase() === summonerName.toLowerCase()
  );
}

function getSummonerDataByDiscordUserId(discordUserId) {
  const summonerDB = readSummonerDatabase();
  const summoners = summonerDB.summoners;
  return summoners.find(entry => entry.discordUserId === discordUserId);
}

function registerSummoner(summonerData) {
  const summonerDB = readSummonerDatabase();
  summonerDB.push(summonerData);
  writeSummonerDatabase(summonerDB);
}

module.exports = {
  initializeSummonerDatabase,
  readSummonerDatabase,
  writeSummonerDatabase,
  getSummonerDataByRegionAndName,
  getSummonerDataByDiscordUserId,
  registerSummoner
};
