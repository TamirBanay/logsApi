const express = require("express");
const app = express();
const port = 3000;

// Store logs in memory for this example
const logs = [];
let connectedModules = {};

app.use(express.json());

app.post("/api/logs", (req, res) => {
  try {
    console.log("Log received:", req.body);
    // Add the log message to the logs array
    logs.push(req.body);
    res.status(200).send("Log received");
  } catch (error) {
    console.error("Error handling /api/logs:", error);
    res.status(500).send("Server error");
  }
});

app.post("/api/register", (req, res) => {
  const { idTitle, targetCities } = req.body; // Extract idTitle and targetCities from the request body
  connectedModules[idTitle] = { targetCities, lastSeen: new Date() }; // Save idTitle and targetCities in the connectedModules object
  res.status(200).send("Module registered");
});

app.get("/api/modules", (req, res) => {
  res.status(200).json(connectedModules);
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html"); // assuming your HTML file is in 'public' directory.
});

app.get("/logs", (req, res) => {
  let html = `<html><head><title>Logs</title></head><body>`;
  html += `<h1>Logs</h1>`;
  html += `<ul>`;
  // Add each log to the HTML as a list item
  logs.forEach((log) => {
    html += `<li>${JSON.stringify(log)}</li>`;
  });
  html += `</ul>`;
  html += `</body></html>`;
  res.send(html);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
