const { Client } = require("pg");
const fs = require("fs");

let config;
try {
  config = JSON.parse(fs.readFileSync("/etc/mywebapp/config.json", "utf8"));
} catch {
  config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
}

async function runMigration() {
  const client = new Client(config.database);

  try {
    await client.connect();
    console.log("Connected to PostgreSQL");

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await client.query(createTableQuery);
    console.log("Migration successful: table notes");
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
