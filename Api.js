const express = require("express");
const app = express();
const port = 3000;

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

function generateNavMenu(currentRoute) {
  return `
      <nav>
        <ul style="list-style-type: none; display: flex; justify-content:space-around; padding-left:0px;">
          <li style="background-color: #fff;
          margin: 10px 0;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><a style="color:black; text-decoration: none;font-weight:bold;" href="/" ${
            currentRoute === "/" ? 'style="font-weight:bold;"' : ""
          }>Home</a></li>
          <li style="background-color: #fff;
          margin: 10px 0;
          padding: 10px;
          border-radius: 5px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><a style="color:black; text-decoration: none;font-weight:bold;" href="/logs" ${
            currentRoute === "/logs" ? 'style="font-weight:bold;"' : ""
          }>Logs</a></li>
          <li style="background-color: #fff;
          margin: 10px 0;
          padding: 10px;
          border-radius: 5px;
      
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><a style="color:black; text-decoration: none;font-weight:bold;" href="/testresult" ${
            currentRoute === "/testresult" ? 'style="font-weight:bold;"' : ""
          }>Test</a></li>
        </ul>
      </nav>
    `;
}

// ... previous code ...
app.post("/api/activateTestLedByMacAdrress", (req, res) => {
  console.log("Received body:", req.body); // Log the received body for debugging
  const { macAddress } = req.body;

  if (macAddress && connectedModules[macAddress]) {
    console.log(
      "Sending test LED activation command to module with MAC:",
      macAddress
    );
    res
      .status(200)
      .send(
        "Test LED activation command sent to module with MAC: " + macAddress
      );
  } else {
    res.status(404).send("Module with specified MAC address not found");
  }
});

app.post("/api/register", (req, res) => {
  const { moduleName, macAddress } = req.body;
  connectedModules[macAddress] = {
    moduleName,
    lastSeen: new Date(),
    macAddress: macAddress,
  };
  res.status(200).send("Module registered");
});

app.get("/api/modules", (req, res) => {
  res.status(200).json(connectedModules);
});

let myBoolean = false;

app.post("/notifySuccess", (req, res) => {
  const { macAddress, status, moduleName, ipAddress } = req.body;
  if (macAddress && status && moduleName && ipAddress) {
    connectedModules[macAddress] = {
      status,
      moduleName,
      ipAddress,
      lastSeen: new Date(),
    };
    res.status(200).send("Success notification received for " + moduleName);
  } else {
    res.status(400).send("MAC address, module name, or status missing");
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

function checkModuleStatus() {
  const now = new Date();
  Object.entries(connectedModules).forEach(([moduleId, details]) => {
    const lastSeen = new Date(details.lastSeen);
    const timeSinceLastSeen = now - lastSeen;
    const TIMEOUT_THRESHOLD = 30000;

    if (timeSinceLastSeen > TIMEOUT_THRESHOLD) {
      connectedModules[moduleId].status = "failed";
    }
  });
}

app.get("/testresult", (req, res) => {
  checkModuleStatus();
  let currentTime = new Date();

  for (let moduleId in connectedModules) {
    let module = connectedModules[moduleId];
    let lastSeenTime = new Date(module.lastSeen);
    lastSeenTime.setHours(lastSeenTime.getHours());
    const TIMEOUT_THRESHOLD = 5000;
    if (
      currentTime - lastSeenTime > TIMEOUT_THRESHOLD &&
      module.status !== "success"
    ) {
      module.status = "failed";
    }
  }

  let detailsHtml = Object.entries(connectedModules)
    .map(
      ([moduleId, details]) => `
      <div class="module">
          <p>Module ID: ${details.moduleName}</p>
          <p>Status: ${details.status === "success" ? "success" : "failed"}</p>
          <p>Mac Address: ${details.macAddress}</p>
          <p>Last Seen: ${new Date(details.lastSeen + 2).toLocaleString()}</p>
          <button onclick="activateTestLedByMacAdrress('${
            details.macAddress
          }')">Activate Test LED</button>

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
    #changeButton {
      display: block;
      width: 150px;
      margin: 20px auto;
      padding: 10px;
      text-align: center;
      background-color: #007bff;
      color: #ffffff;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.2s;
    }
    #changeButton:hover {
      background-color: #0056b3;
    }
    #changeButton:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
  </style>
    </head>
    <body>
    ${generateNavMenu("/testresult")}

    ${detailsHtml}
    <button id="changeButton">Trigger LEDs</button>
      <script>
        document.getElementById('changeButton').addEventListener('click', function() {
          fetch('/changeLedValue', { method: 'POST' })
            .then(response => response.text())
            .then(data => {
              console.log(data);
              document.getElementById('changeButton').textContent = 'LEDs Triggered';
              document.getElementById('changeButton').disabled = true;
            })
            .catch(error => {
              console.error('Error:', error);
            });
        });
      </script>
      <script>
      function activateTestLedByMacAdrress(macAddress) {
        console.log("Activating test LED for MAC:", macAddress); // This should show the MAC address
      
        fetch('/api/activateTestLedByMacAdrress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ macAddress: macAddress })
        })
          .then(response => response.text())
          .then(data => {
              console.log(data);
              // Handle successful response
          })
          .catch(error => {
              console.error('Error:', error);
          });
      }
      </script>


    </body>
    </html>`);
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
      ${generateNavMenu("/")}

          <h1>Connected Modules</h1>
          <button id="fetchModules">Get Connected Modules</button>
          <div id="modulesInfo"></div>
  
          <script>
              document.getElementById('fetchModules').onclick = function() {
                  fetch('/api/modules')
                      .then(response => response.json())
                      .then(data => {
                          const modulesInfo = document.getElementById('modulesInfo');
                          modulesInfo.innerHTML = ''; 
  
                          for (const [id, details] of Object.entries(data)) {
                              const moduleDiv = document.createElement('div');
                              moduleDiv.classList.add('module');
                              moduleDiv.innerHTML = \`
                                  <strong>Module Name:</strong> \${details.moduleName}<br />
                                  <strong>Ip Address:</strong> \${details.ipAddress  || 'Not Available'}<br />
                                  <strong>Mac Address:</strong> \${details.macAddress  || 'Not Available'}<br />
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
    ${generateNavMenu("/logs")}

        <h1>Logs</h1>


        <ul>`;
  logs.forEach((log) => {
    html += `<li>${JSON.stringify(log, null, 2)}</li>`;
  });
  html += `</ul>
    </body>
    </html>`;
  res.send(html);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
