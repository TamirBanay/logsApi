const express = require("express");
const mongoose = require("mongoose");
const moduleModel = require("./mongoDB/Modules");
const logsModel = require("./mongoDB/Logs");
const citiesFilePath = "./cities.json";
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());
const cors = require("cors");

const corsOptions = {
  origin: [
    "https://tamirbanay.github.io",
    "http://localhost:3001",
    "http://localhost",
  ],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

let macAddress = "";
let macAddressTimeout;
let lastPongMessage = {};
let testType = "";
const macAddressTimeouts = {};
const lastVersion = "0.1.0";
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
  const update = {
    macAddress: req.body.macAddress,
    timestamp: req.body.timestamp,
    moduleName: req.body.moduleName,
    log: req.body.log || "module is connected",
    ipAddress: req.body.ipAddress,
    version: req.body.version,
  };

  console.log("Attempting to update:", update);

  try {
    const module = await moduleModel.findOneAndUpdate(
      { macAddress: req.body.macAddress },
      update,
      { new: true, upsert: true }
    );

    console.log("Updated or inserted document:", module);
    res.send({ success: true, module: module });
  } catch (err) {
    console.error("Error updating or saving data:", err);
    res
      .status(500)
      .send({ success: false, message: "Failed to update or save data" });
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

function checkModuleConnection(macAddress) {
  // Simulated connection check logic
  console.log(`Simulated connection check for ${macAddress}`);
  // Randomly return true or false for demonstration purposes
  return Math.random() < 0.5;
}

function scheduleCheck(macAddress, isConnected) {
  if (
    macAddressTimeouts[macAddress] &&
    macAddressTimeouts[macAddress].checkTimeoutId
  ) {
    clearTimeout(macAddressTimeouts[macAddress].checkTimeoutId);
  }

  const nextCheckInterval = isConnected ? 10 * 60 * 1000 : 1 * 60 * 1000; // 10 mins for connected, 1 min for not connected

  const checkTimeoutId = setTimeout(() => {
    console.log(`Checking connection status for ${macAddress}`);
    const isConnected = checkModuleConnection(macAddress);

    if (macAddressTimeouts[macAddress]) {
      macAddressTimeouts[macAddress].isConnected = isConnected;
    }

    scheduleCheck(macAddress, isConnected);
  }, nextCheckInterval);

  macAddressTimeouts[macAddress] = {
    ...macAddressTimeouts[macAddress],
    checkTimeoutId,
    isConnected,
  };
}

app.post("/api/moduleIsConnectIndicator/:macAddress", (req, res) => {
  const macAddress = req.params.macAddress;
  scheduleCheck(macAddress, true);

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

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
