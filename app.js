const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const configPath = process.env.CONFIG_PATH || "./config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const PORT = config.port;

app.use(express.json());

app.get("/health/alive", (req, res) => {
  res.status(200).send("OK");
});

app.get("/health/ready", (req, res) => {
  // TODO: add connection check to postgresql
  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "index.html"));
  } else {
    res.status(406).send("Not acceptable");
  }
});

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});
