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
    const { id } = req.body;
    if (id) {
      // Store or update the module details
      connectedModules[id] = {
        lastSeen: new Date().toISOString(), // Store the current time as the last seen time
      };
      res.status(200).send("Module registered successfully");
    } else {
      res.status(400).send("Invalid request: ID is required");
    }
  } catch (error) {
    console.error("Error in /api/register:", error);
    res.status(500).send("Server error");
  }
});

app.get("/api/modules", (req, res) => {
  res.status(200).json(connectedModules);
});

app.get("/", (req, res) => {
  console.log("Root endpoint accessed");
  let html = `
    <!DOCTYPE html>
    <html lang='en'>
    <head>
        <title>Module Details</title>
        <style>
            /* Add some basic styling */
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f4f4f4;
            }
            #modulesInfo {
                margin-top: 20px;
            }
            .module {
                background: #fff;
                padding: 10px;
                margin-bottom: 10px;
                border-radius: 5px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
        </style>
    </head>
    <body>
        <h1>Connected Modules</h1>
        <button id="fetchModules">Get Connected Modules</button>
        <div id="modulesInfo"></div>

        <script>
            document.getElementById('fetchModules').onclick = function() {
                fetch('/api/modules')
                    .then(response => response.json())
                    .then(data => {
                        const modulesInfo = document.getElementById('modulesInfo');
                        modulesInfo.innerHTML = ''; // Clear previous content

                        for (const [id, details] of Object.entries(data)) {
                            const moduleDiv = document.createElement('div');
                            moduleDiv.classList.add('module');
                            moduleDiv.innerHTML = \`<strong>Module ID:</strong> \${id}<br /><strong>Last Seen:</strong> \${new Date(details.lastSeen).toLocaleString()}\`;
                            modulesInfo.appendChild(moduleDiv);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching modules:', error);
                        const modulesInfo = document.getElementById('modulesInfo');
                        modulesInfo.innerHTML = 'Error fetching modules. Check console for details.';
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
