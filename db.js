const { Pool } = require('pg');
const fs = require('fs');

const configPath = process.env.CONFIG_PATH || "./config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const pool = new Pool(config.database);

module.exports = pool;