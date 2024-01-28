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
    logs.push(req.body);
    res.status(200).send("Log received");
  } catch (error) {
    console.error("Error handling /api/logs:", error);
    res.status(500).send("Server error");
  }
});

app.post("/api/register", (req, res) => {
  try {
    console.log("Register request received:", req.body);
    const { id, details } = req.body;
    connectedModules[id] = { ...details, lastSeen: new Date() };
    console.log("Module registered:", id);
    res.status(200).send("Module registered");
  } catch (error) {
    console.error("Error handling /api/register:", error);
    res.status(500).send("Server error");
  }
});

app.get("/api/modules", (req, res) => {
  console.log("Sending connected modules data");
  res.status(200).json(connectedModules);
});

app.get("/", (req, res) => {
  console.log("Root endpoint accessed");
  let html = `
    <!DOCTYPE html>
    <html lang='en'>
    <head>
        <title>Module Details</title>
    </head>
    <body>
        <button id="fetchModules">Get Connected Modules</button>
        <div id="modulesInfo"></div>

        <script>
            document.getElementById('fetchModules').onclick = function() {
                fetch('/api/modules')
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('modulesInfo').innerHTML = JSON.stringify(data, null, 2);
                    });
            };
        </script>
    </body>
    </html>
    `;
  res.send(html);
});

app.get("/logs", (req, res) => {
  console.log("Logs endpoint accessed");
  let html = `<html><head><title>Logs</title></head><body>`;
  html += `<h1>Logs</h1>`;
  html += `<ul>`;
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
