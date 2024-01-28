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
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            .back-button {
                display: block;
                width: 150px;
                margin: 20px auto;
                padding: 10px;
                text-align: center;
                background-color: #007bff;
                color: #ffffff;
                border: none;
                border-radius: 5px;
                text-decoration: none;
                cursor: pointer;
            }
            .back-button:hover {
                background-color: #0056b3;
            }
            #fetchModules {
                padding: 10px 15px;
                background-color: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                transition: background-color 0.2s;
              }
        
              #fetchModules:hover {
                background-color: #0056b3;
              }

        </style>
    </head>
    <body>
        <h1>Connected Modules</h1>
        <button id="fetchModules">Get Connected Modules</button>
        <div id="modulesInfo"></div>
        <a href="/logs" class="back-button">See Logs</a>

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
  let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Logs</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 20px;
                color: #333;
            }
            h1 {
                text-align: center;
            }
            ul {
                list-style-type: none;
                padding: 0;
            }
            li {
                background-color: #fff;
                margin: 10px 0;
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .back-button {
                display: block;
                width: 150px;
                margin: 20px auto;
                padding: 10px;
                text-align: center;
                background-color: #007bff;
                color: #ffffff;
                border: none;
                border-radius: 5px;
                text-decoration: none;
                cursor: pointer;
            }
            .back-button:hover {
                background-color: #0056b3;
            }

        </style>
    </head>
    <body>
        <h1>Logs</h1>
        <a href="/" class="back-button">Back to Home</a>

        <ul>`;
  logs.forEach((log) => {
    html += `<li>${JSON.stringify(log, null, 2)}</li>`; // pretty-print the JSON
  });
  html += `</ul>
    </body>
    </html>`;
  res.send(html);
});

app.get("/ping", (req, res) => {
  // Assume connectedModules is a global or higher scope variable that contains the modules' data
  let htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Module Ping</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f4f4f4;
          }
          #pingResults div {
              margin-top: 5px;
              padding: 10px;
              background: #e0e0e0;
              border-radius: 5px;
          }
      </style>
  </head>
  <body>
      <h1>Ping Modules</h1>
      <button id="pingModules">Ping All Modules</button>
      <div id="pingResults"></div>
  
      <script>
      const connectedModules = ${JSON.stringify(connectedModules || {})};
  
      document.getElementById('pingModules').onclick = function() {
          Object.keys(connectedModules).forEach(moduleId => {
              const moduleData = connectedModules[moduleId];
              if (moduleData && moduleData.pingEndpoint) {
                  fetch(moduleData.pingEndpoint)
                      .then(response => {
                          if (!response.ok) {
                              throw new Error('Network response was not ok');
                          }
                          return response.text(); // Change this if your endpoint returns JSON
                      })
                      .then(pingMessage => {
                          const pingResults = document.getElementById('pingResults');
                          const resultDiv = document.createElement('div');
                          resultDiv.innerHTML = 'Module ' + moduleId + ': ' + pingMessage;
                          pingResults.appendChild(resultDiv);
                      })
                      .catch(error => {
                          const pingResults = document.getElementById('pingResults');
                          const resultDiv = document.createElement('div');
                          resultDiv.innerHTML = 'Module ' + moduleId + ': Error pinging (' + error.message + ')';
                          pingResults.appendChild(resultDiv);
                      });
              } else {
                  const pingResults = document.getElementById('pingResults');
                  const resultDiv = document.createElement('div');
                  resultDiv.innerHTML = 'Module ' + moduleId + ': Ping endpoint not defined';
                  pingResults.appendChild(resultDiv);
              }
          });
      };
      </script>
  </body>
  </html>
    `;
  res.send(htmlContent);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
