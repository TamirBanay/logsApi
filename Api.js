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
const bodyParser = require("body-parser");

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

const connectionString =
  "mongodb+srv://banay9329:XfKyfKqWnEHImqXm@cluster0.f3a2v25.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tls=true&tlsInsecure=true";

// Connect to MongoDB
mongoose
  .connect(connectionString)
  .then(() => console.log("MongoDB connected..."));

app.get("/download/alermSystemFile", (req, res) => {
  const filePath = path.join(__dirname, "uploads", "AlermSystem.ino");
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Failed to send file:", err);
      if (!res.headersSent) {
        res.status(500).send("Error sending file.");
      }
    }
  });
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
  };

  res.json({
    macAddress: req.body.macAddress,
    message: req.body.message,
  });

  setTimeout(() => {
    lastPongMessage.macAddress = "";
    lastPongMessage.message = "";
    // console.log("Pong message and MAC address reset after 10 seconds");
  }, 10000);
});

app.get("/api/pongReceivedFromModule", (req, res) => {
  res.json(lastPongMessage);
});

app.post("/api/moduleIsConnectIndicator/:macAddress", (req, res) => {
  const macAddress = req.params.macAddress;

  if (macAddressTimeouts[macAddress]) {
    clearTimeout(macAddressTimeouts[macAddress].timeoutId);
    macAddressTimeouts[macAddress].isConnected = true; // Mark as connected
  }

  const timeoutId = setTimeout(() => {
    console.log(`${macAddress} is disconnected`);
    if (macAddressTimeouts[macAddress]) {
      macAddressTimeouts[macAddress].isConnected = false;
    }
  }, 60000);

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

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
