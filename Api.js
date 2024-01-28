const express = require("express");
const app = express();
const port = 3000;

// Store logs in memory for this example
const logs = [];

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

const modules = {};

app.post("/api/register", (req, res) => {
    console.log("Received registration request:", req.body); // Log the incoming request
    const { id, details } = req.body;
    if (id && details) {
        modules[id] = {
            ...details,
            lastSeen: new Date().toISOString()
        };
        console.log("Updated modules:", modules); // Log the updated modules object
        res.status(200).send("Module registered successfully");
    } else {
        res.status(400).send("Invalid request: ID and details are required");
    }
});

app.get("/api/modules", (req, res) => {
    console.log("Sending modules data:", modules); // Log the data being sent
    res.json(modules);
});

// Endpoint to get all registered modules
app.get("/api/modules", (req, res) => {
  res.json(modules);
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
