const { Pool } = require("pg");
const fs = require("fs");

let config;
try {
  config = JSON.parse(fs.readFileSync("/etc/mywebapp/config.json", "utf8"));
} catch {
  config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
}

const pool = new Pool(config.database);

module.exports = pool;
