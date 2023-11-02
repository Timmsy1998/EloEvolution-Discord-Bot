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

module.exports = {
  initializeSummonerDatabase,
  readSummonerDatabase,
  writeSummonerDatabase,
};
