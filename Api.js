const express = require("express");
const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors());
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
  const { id, pingEndpoint } = req.body;
  connectedModules[id] = { pingEndpoint, lastSeen: new Date() };
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

// Existing server code ...

// Add a new POST endpoint to handle pings
app.post("/api/ping", (req, res) => {
  const { id } = req.body;
  if (connectedModules[id]) {
    // Construct your ping logic here, for example:
    // You might send a request to the module's pingEndpoint
    console.log(`Pinging module with ID: ${id}`);
    // Simulate a ping for demonstration
    res.status(200).send(`Ping sent to module ${id}`);
  } else {
    res.status(404).send(`Module with ID ${id} not found`);
  }
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
                  fetch('/api/ping', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: moduleId })
                  })
                  .then(response => {
                      if (!response.ok) {
                          throw new Error(\`HTTP error! status: \${response.status}\`);
                      }
                      return response.text(); // Use text() instead of json() if the response is not in JSON format
                  })
                  .then(data => {
                      alert(data); // Display the server response
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
    const { id } = req.body;
    console.log(`Received ping request for module ID: ${id}`);
    console.log("Connected Modules: ", connectedModules);
  
    if (connectedModules[id]) {
      console.log(`Pinging module with ID: ${id}`);
      // Your ping logic here
      res.status(200).send(`Ping sent to module ${id}`);
    } else {
      console.log(`Module with ID ${id} not found in connectedModules`);
      res.status(404).send(`Module with ID ${id} not found`);
    }
  });
  

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
