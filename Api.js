const express = require("express");
const app = express();
const port = 3000;

// Use an object to store logs grouped by idTitle
const logs = {};

app.use(express.json());

app.post("/api/logs", (req, res) => {
  try {
    const log = req.body;
    console.log("Log received:", log);

    // Check if the idTitle is provided and not empty
    if (log.idTitle && log.idTitle.trim()) {
      // If logs for this idTitle don't exist yet, initialize an empty array
      if (!logs[log.idTitle]) {
        logs[log.idTitle] = [];
      }

      // Add the log to the array for this idTitle
      logs[log.idTitle].push(log);
    } else {
      console.warn("Log received without idTitle:", log);
    }

    res.status(200).send("Log received");
  } catch (error) {
    console.error("Error handling /api/logs:", error);
    res.status(500).send("Server error");
  }
});

// Serve an HTML page with the logs
app.get('/logs', (req, res) => {
  let html = `<html><head><title>Logs</title></head><body>`;
  html += `<h1>Logs</h1>`;

  // Create a table for the logs
  html += `<table border="1"><tr><th>Module ID</th><th>Logs</th></tr>`;

  // Loop through each idTitle and its logs
  for (const idTitle in logs) {
    html += `<tr><td>${idTitle}</td><td><ul>`;

    // Add each log for this idTitle to the HTML as a list item inside the table cell
    logs[idTitle].forEach(log => {
      html += `<li>${JSON.stringify(log)}</li>`;
    });

    html += `</ul></td></tr>`;
  }

  html += `</table>`;
  html += `</body></html>`;
  res.send(html);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
