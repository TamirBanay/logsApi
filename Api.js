const express = require("express");
const app = express();
const port = 3000;
const cors = require("cors");

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
  const { id, ipAddress } = req.body; // Assuming the module sends its IP in the request body
  connectedModules[id] = { ipAddress, lastSeen: new Date() };
  res.status(200).send("Module registered");
});

app.get("/api/modules", (req, res) => {
  res.status(200).json(connectedModules);
});

app.get("/test1", (req, res) => {
  res.json(false);
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
                                  <strong>Ip Address:</strong> \${details.ipAddress  || 'Not Available'}<br />
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

          
          <input type="text" id="ipInput" placeholder="Enter ESP32 IP address"/>
          <button id="testButton">Test LED</button>

          <script>
              document.getElementById('testButton').onclick = function() {
                  var ip = document.getElementById('ipInput').value;
                  if(ip) {
                      fetch('/api/test', { 
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({ ip: ip })
                      })
                      .then(response => {
                          if(response.ok) {
                              console.log("LED should be now on.");
                          } else {
                              console.error('Server responded with status ' + response.status);
                          }
                      })
                      .catch(error => {
                          console.error('Error:', error);
                      });
                  } else {
                      alert('Please enter the IP address.');
                  }
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
const axios = require("axios"); // Ensure you have this at the top of your file

app.post("/api/test", (req, res) => {
  const ipAddress = req.body.ip;
  console.log("Received IP: ", ipAddress); // Log the received IP address
  if (!ipAddress) {
    return res.status(400).send("IP address is required");
  }

  console.log(
    "Test endpoint hit, triggering LED on the module with IP: " + ipAddress
  );

  // The axios call should be within the scope of the route handler
  axios
    .post(`http://${ipAddress}/trigger-led`)
    .then((response) => {
      console.log("LED should be now on.");
      res.status(200).send("Triggered LED successfully.");
    })
    .catch((error) => {
      console.error("Error triggering LED:", error.message);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log("Error", error.message);
      }
      res.status(500).send("Error triggering LED");
    });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
