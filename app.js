const express = require("express");
const fs = require("fs");
const path = require("path");
const pool = require("./db");
const notesRouter = require("./routes/notes.routes");

const app = express();

let config;
try {
  config = JSON.parse(fs.readFileSync("/etc/mywebapp/config.json", "utf8"));
} catch (error) {
  config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
}

const PORT = config.port;

app.use(express.json());

app.get("/health/alive", (req, res) => {
  res.status(200).send("OK");
});

app.get("/health/ready", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).send("OK");
  } catch (error) {
    res.status(500).send("Database connection failed: " + error.message);
  }
});

app.get("/", (req, res) => {
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "index.html"));
  } else {
    res.status(406).send("Not acceptable");
  }
});

app.use("/", notesRouter);

if (process.env.LISTEN_FDS === "1") {
  app.listen({ fd: 3 }, () => {
    console.log("App is running via systemd socket activation");
  });
} else {
  app.listen(PORT, () => {
    console.log(`App is running on port ${PORT}`);
  });
}
