const express = require("express");
const app = express();
const port = 3000;

const logs = [];
let connectedModules = {};
let moduleDetails = {};

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
  const { id, ipAddress } = req.body;
  connectedModules[id] = { ipAddress, lastSeen: new Date() };
  res.status(200).send("Module registered");
});

app.get("/api/modules", (req, res) => {
  res.status(200).json(connectedModules);
});

let myBoolean = false;

app.post("/notifySuccess", (req, res) => {
  const { id, status } = req.body; // Assume the body will have an 'id' and 'status'
  if (id && status) {
    // Update the connectedModules with the new status
    connectedModules[id] = { status, lastSeen: new Date() };
    res.status(200).send("Success notification received");
  } else {
    res.status(400).send("ID or status missing");
  }
});

app.get("/testLed", (req, res) => {
  res.json(myBoolean);
});

app.post("/changeLedValue", (req, res) => {
  myBoolean = true;
  res.send("Value changed to true");

  setTimeout(() => {
    myBoolean = false;
    console.log("Value reverted to false");
  }, 3000);
});
app.get("/change", (req, res) => {
  // Assuming connectedModules is updated elsewhere in your server code
  let currentTime = new Date();

  // Update the status based on the lastSeen timestamp
  for (let moduleId in connectedModules) {
    let module = connectedModules[moduleId];
    let lastSeenTime = new Date(module.lastSeen);
    // Set a threshold for failure (e.g., 5 seconds)
    if (currentTime - lastSeenTime > 5000 && module.status !== "success") {
      module.status = "failed";
    }
  }

  let detailsHtml = Object.entries(connectedModules)
    .map(
      ([moduleId, details]) => `
        <div class="module">
          <p>Module ID: ${moduleId}</p>
          <p>Status: ${details.status}</p>
          <p>Last Seen: ${new Date(details.lastSeen).toLocaleString()}</p>
        </div>
      `
    )
    .join("");

  if (!detailsHtml) {
    detailsHtml = "<p>No module details available.</p>";
  }
  res.send(`<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Module Status</title>
      <style>
        /* CSS for the modules */
        .module {
          background-color: #f9f9f9; /* Light gray background */
          border: 1px solid #ddd; /* Gray border */
          padding: 10px; /* Padding around the text */
          margin-bottom: 10px; /* Margin between modules */
          border-radius: 5px; /* Rounded corners */
        }
        /* CSS for the button */
        #changeButton {
          font-size: 20px; /* Large font size */
          padding: 15px 30px; /* Padding around the text */
          background-color: #4CAF50; /* Green background */
          color: white; /* White text */
          border: none; /* No border */
          border-radius: 5px; /* Rounded corners */
          cursor: pointer; /* Pointer cursor on hover */
          transition: background-color 0.3s; /* Smooth transition for background color */
        }
        #changeButton:hover {
          background-color: #45a049; /* Darker shade of green on hover */
        }
        #changeButton:disabled {
          background-color: #ccc; /* Gray background for disabled state */
          cursor: not-allowed; /* Not-allowed cursor for disabled state */
        }
      </style>
    </head>
    <body>
    ${detailsHtml}
    <button id="changeButton">Trigger LEDs</button>
      <script>
      document.getElementById('changeButton').addEventListener('click', function() {
        fetch('/updateStatus', { method: 'POST' })
          .then(response => response.json()) // Expecting a JSON response
          .then(data => {
            console.log(data.message);
            document.getElementById('changeButton').textContent = data.message;
            // You could also trigger a refresh of the module status here if needed
          })
          .catch(error => {
            console.error('Error:', error);
          });
      });
      </script>
    </body>
    </html>`);
});

// Node.js server code
app.post("/updateStatus", (req, res) => {
  // Here you will need to identify which module is making the request
  // This could be done by sending the module ID in the request body, for example
  // For this example, let's assume the module ID is sent in the request body

  const moduleId = req.body.moduleId; // You'll need to set this up on the client side as well

  if (connectedModules[moduleId]) {
    // Update the status of the module
    connectedModules[moduleId].status = "success";
    connectedModules[moduleId].lastSeen = new Date().toISOString();
    res.json({ message: "Module status updated to success" });
  } else {
    // Handle the case where the module ID is not found
    res.status(404).json({ message: "Module not found" });
  }
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

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
