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

app.post("/api/activateTestLed", (req, res) => {
  const { macAddress } = req.body;
  if (connectedModules[macAddress]) {
    // Logic to send a command to the specific module to activate the test LED
    console.log(
      "Sending test LED activation command to module with MAC:",
      macAddress
    );
    // TODO: Implement the actual LED activation command here

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
  const { id, ipAddress } = req.body;
  connectedModules[macAddress] = { ipAddress, lastSeen: new Date() };
  res.status(200).send("Module registered");
});

app.get("/api/modules", (req, res) => {
  res.status(200).json(connectedModules);
});

let myBoolean = false;

app.post("/notifySuccess", (req, res) => {
  const { id, status } = req.body;
  if (id && status) {
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
  checkModuleStatus(); // This function updates the status of each module
  let currentTime = new Date();

  for (let moduleId in connectedModules) {
    let module = connectedModules[moduleId];
    let lastSeenTime = new Date(module.lastSeen);
    lastSeenTime.setHours(lastSeenTime.getHours() + 2);
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
            <p>Module ID: ${moduleId}</p>
            <p>Status: ${
              details.status === "success" ? "success" : "failed"
            }</p>
            <p>Last Seen: ${new Date(details.lastSeen).toLocaleString()}</p>
            <button onclick="activateTestLed('${
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
    //   <script>
    //     document.getElementById('changeButton').addEventListener('click', function() {
    //       fetch('/changeLedValue', { method: 'POST' })
    //         .then(response => response.text())
    //         .then(data => {
    //           console.log(data);
    //           document.getElementById('changeButton').textContent = 'LEDs Triggered';
    //           document.getElementById('changeButton').disabled = true;
    //         })
    //         .catch(error => {
    //           console.error('Error:', error);
    //         });
    //     });
    //   </script>
    <script>
    function activateTestLed(macAddress) {
        fetch('/api/activateTestLed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ macAddress: macAddress })
        })
        .then(response => response.text())
        .then(data => {
            console.log(data);
            alert("LED activation command sent to module with MAC: " + macAddress);
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
