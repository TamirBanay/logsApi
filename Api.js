const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");
app.use(
  cors({
    origin: "https://logs-foem.onrender.com/", // replace with your frontend's domain
  })
);
// Store logs in memory for this example
const logs = [];
let connectedModules = {};
const fetch = require("node-fetch"); // Make sure to install node-fetch if not already

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
  const { id, macAddress } = req.body;
  connectedModules[id] = { macAddress, lastSeen: new Date() };
  res.status(200).send("Module registered");
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
                              moduleDiv.innerHTML = \`
                                  <strong>Module ID:</strong> \${id}<br />
                                  <strong>MAC Address:</strong> \${details.macAddress || 'Not Available'}<br />
                                  <strong>Last Seen:</strong> \${new Date(details.lastSeen).toLocaleString()}
                              \`;
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
  let html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ping Module</title>
          <style>
              /* Basic styling */
              body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: #f4f4f4;
              }
              button {
                  padding: 10px 15px;
                  background-color: #007bff;
                  color: white;
                  border: none;
                  border-radius: 5px;
                  cursor: pointer;
                  font-size: 16px;
                  transition: background-color 0.2s;
              }
              button:hover {
                  background-color: #0056b3;
              }
          </style>
      </head>
      <body>
          <h1>Ping Module</h1>
          <input type="text" id="moduleIdInput" placeholder="Enter Module ID" />
          <button id="pingButton">Ping Module</button>
          <script>
          document.getElementById('pingButton').onclick = function() {
              var moduleId = document.getElementById('moduleIdInput').value;
              fetch('https://logs-foem.onrender.com/api/ping', { // Make sure this URL is correct
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: moduleId })
              })
              .then(response => {
                  if (!response.ok) {
                    throw new Error(\`HTTP error! status: \${response.status}\`);
                  }
                  return response.text();
              })
              .then(data => {
                  alert(data);
              })
              .catch(error => {
                  console.error('Error pinging the module:', error);
                  alert('Error pinging the module: ' + error.message);
              });
          };
        </script>
        
      
      </body>
      </html>
      `;
  res.send(html);
});

app.post("/api/ping", (req, res) => {
  const { id } = req.body; // 'id' is the identifier of the module

  // Check if the module is registered in the connectedModules object
  const moduleInfo = connectedModules[id];
  if (!moduleInfo) {
    return res.status(404).send("Module not found");
  }

  // Assuming the module's IP or hostname is stored in moduleInfo
  const moduleEndpoint = moduleInfo.pingEndpoint;
  if (!moduleEndpoint) {
    return res.status(404).send("Module ping endpoint not found");
  }

  // Ping the module at the stored endpoint
  fetch(moduleEndpoint)
    .then((moduleRes) => {
      if (!moduleRes.ok) {
        throw new Error(`Module responded with status: ${moduleRes.status}`);
      }
      return moduleRes.text();
    })
    .then((moduleResText) => {
      res.status(200).send(`Module response: ${moduleResText}`);
    })
    .catch((error) => {
      console.error("Error pinging module:", error);
      res.status(500).send(`Failed to ping module: ${error.message}`);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
