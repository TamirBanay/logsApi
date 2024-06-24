const express = require("express");
const mongoose = require("mongoose");
const moduleModel = require("./mongoDB/Modules");
const logsModel = require("./mongoDB/Logs");
const citiesFilePath = "./cities.json";
const favicon = "./images/favicon";
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
const cors = require("cors");

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
let savedDataCities = {};
let savedData = {};

let macAddress = "";
let macAddressTimeout;
let lastPongMessage = {};
let testType = "";
const macAddressTimeouts = {};
const lastVersion = "0.1.8";
const connectionString =
  "mongodb+srv://banay9329:XfKyfKqWnEHImqXm@cluster0.f3a2v25.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tls=true&tlsInsecure=true";

// Connect to MongoDB
mongoose
  .connect(connectionString)
  .then(() => console.log("MongoDB connected..."));

app.get("/api/update", (req, res) => {
  // Set the directory where the .bin files are stored
  const filePath = path.join(
    __dirname,
    "uploads",
    "AlermSystem.ino.esp32da.bin"
  );

  // Set headers to instruct the browser to download the file
  res.setHeader("Content-Disposition", "attachment; filename=AlermSystem.bin");
  res.setHeader("Content-Type", "application/octet-stream");

  // Send the file for download
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Failed to send file:", err);
      if (!res.headersSent) {
        res.status(500).send("Error sending file.");
      }
    }
  });
});
app.get("/api/getLastVersion", (req, res) => {
  res.json({ lastVersion: lastVersion });
});

app.get("/api/getModuels", (req, res) => {
  moduleModel
    .find()
    .then((modules) => res.json(modules))
    .catch((err) => res.json(err));
});

app.post("/api/getModuels", async (req, res) => {
  console.log("Request Body:", JSON.stringify(req.body, null, 2)); // Log the request body for debugging

  const update = {
    macAddress: req.body.macAddress,
    timestamp: req.body.timestamp,
    moduleName: req.body.moduleName,
    log: req.body.log || "module is connected",
    ipAddress: req.body.ipAddress,
    version: req.body.version,
    targetCities: req.body.targetCities || [], // Include targetCities
  };

  try {
    const filter = { macAddress: req.body.macAddress };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    let module = await moduleModel.findOneAndUpdate(filter, update, options);
    if (!module) {
      module = new moduleModel(update); // Fix typo here
      await module.save();
    }

    res.status(200).json({ success: true, module });
  } catch (error) {
    console.error("Error updating module:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/getLogs", (req, res) => {
  logsModel
    .find()
    .then((logs) => res.json(logs))
    .catch((err) => res.json(err));
});

app.post("/api/getLogs", async (req, res) => {
  try {
    const LogsData = new logsModel({
      macAddress: req.body.macAddress,
      timestamp: req.body.timestamp,
      moduleName: req.body.moduleName,
      log: req.body.log,
    });

    const logs = await LogsData.save();

    res.send({ success: true, logs: logs });
  } catch (err) {
    console.error("Error saving data:", err);
    res.status(500).send({ success: false, message: "Failed to save data" });
  }
});

app.post("/api/pingModule", (req, res) => {
  const postedMacAddress = req.body.macAddress;
  const postedtestType = req.body.testType;

  if (!postedMacAddress) {
    return res.status(400).json({ error: "MAC address is missing." });
  }

  if (macAddressTimeout) {
    clearTimeout(macAddressTimeout);
  }

  macAddress = postedMacAddress;
  testType = postedtestType;

  macAddressTimeout = setTimeout(() => {
    macAddress = "";
    testType = "";
  }, 10000);

  res.json({ macAddress: postedMacAddress, testType: postedtestType });
});

app.get("/api/pingModule", (req, res) => {
  if (!macAddress) {
    return res
      .status(404)
      .json({ error: "No MAC address has been posted or it has been reset." });
  }
  res.status(200).json({ macAddress, testType });
});

app.post("/api/pongReceivedFromModule", (req, res) => {
  lastPongMessage = {
    macAddress: req.body.macAddress,
    message: req.body.message,
    testType: req.body.testType,
  };

  res.json({
    macAddress: req.body.macAddress,
    message: req.body.message,
    testType: req.body.testType,
  });

  setTimeout(() => {
    lastPongMessage.macAddress = "";
    lastPongMessage.message = "";
    lastPongMessage.testType = "";

    // console.log("Pong message and MAC address reset after 10 seconds");
  }, 10000);
});

app.get("/api/pongReceivedFromModule", (req, res) => {
  res.json(lastPongMessage);
});

app.post("/api/moduleIsConnectIndicator/:macAddress", (req, res) => {
  const macAddress = req.params.macAddress;

  // Clear any existing timeout
  if (macAddressTimeouts[macAddress]) {
    clearTimeout(macAddressTimeouts[macAddress].timeoutId);
  }

  // Define the timeout period based on current connection status
  const timeoutDuration =
    macAddressTimeouts[macAddress] && macAddressTimeouts[macAddress].isConnected
      ? 600000
      : 120000;

  // Set a new timeout to update the isConnected status
  const timeoutId = setTimeout(() => {
    console.log(`${macAddress} is disconnected`);
    if (macAddressTimeouts[macAddress]) {
      macAddressTimeouts[macAddress].isConnected = false;
    }
  }, timeoutDuration);

  // Update the macAddressTimeouts object
  macAddressTimeouts[macAddress] = {
    timeoutId,
    isConnected: true,
  };

  res.json({ message: "connected", macAddress, isConnected: true });
});

app.get("/api/moduleIsConnectIndicator/:macAddress", (req, res) => {
  const macAddress = req.params.macAddress;
  const moduleInfo = macAddressTimeouts[macAddress];
  if (moduleInfo) {
    res.json({ macAddress, isConnected: moduleInfo.isConnected });
  } else {
    res.json({ macAddress, isConnected: false });
  }
});

function loadCities() {
  try {
    const data = fs.readFileSync(citiesFilePath, "utf8");
    const cities = JSON.parse(data);

    cityList = Object.keys(cities).map((key) => cities[key].label);
  } catch (error) {
    console.error("Error reading cities file:", error);
    cityList = [];
  }
}
loadCities();

app.get("/citiesjson", (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.json(cityList);
});

app.get("/api/favicon", (req, res) => {
  const imagePath = path.join(__dirname, "./images/favicon.ico");
  res.sendFile(imagePath);
});

app.post("/internal/updateCities", (req, res) => {
  const { macAddress, cities } = req.body;

  console.log(`Internal Update for MAC Address: ${macAddress}`);
  console.log(`Cities: ${cities.join(", ")}`);

  res.status(200).json({
    success: true,
    message: `Cities updated for module ${macAddress}`,
    cities: cities,
  });
});

const sendCitiesToModule = (macAddress, cities) => {
  const options = {
    hostname: "localhost",
    port: port,
    path: "/internal/updateCities",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const http = require("http");
  const req = http.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log(`Response from internal update: ${data}`);
    });
  });

  req.on("error", (error) => {
    console.error(`Error in internal update request: ${error}`);
  });

  req.write(JSON.stringify({ macAddress, cities }));
  req.end();
};

app.post("/api/saveCities", (req, res) => {
  const { macAddress, cities } = req.body;

  if (!macAddress || !cities || !Array.isArray(cities)) {
    return res.status(400).json({ error: "Invalid data" });
  }

  console.log(`MAC Address: ${macAddress}`);
  console.log(`Selected Cities: ${cities.join(", ")}`);

  savedData = { cities, macAddress};

  res.status(200).json({
    success: true,
    message: "Cities saved successfully",
    macAddress: macAddress,
    cities: cities,
    
  });

  sendCitiesToModule(macAddress, cities);
});

app.get("/api/getSavedCities", (req, res) => {
  console.log("Returning saved data:", savedData);
  res.status(200).json(savedData);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
