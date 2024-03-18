const express = require("express");
const mongoose = require("mongoose");
const moduleModel = require("./mongoDB/Modules");
const logsModel = require("./mongoDB/Logs");

const app = express();
const port = 3000;
app.use(express.json());
const cors = require("cors");

const corsOptions = {
  origin: "https://tamirbanay.github.io",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

let macAddress = "";
let macAddressTimeout;
let lastPongMessage = {};
let testType = "";

const connectionString =
  "mongodb+srv://banay9329:XfKyfKqWnEHImqXm@cluster0.f3a2v25.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tls=true&tlsInsecure=true";

// Connect to MongoDB
mongoose
  .connect(connectionString)
  .then(() => console.log("MongoDB connected..."));

app.get("/api/getModuels", (req, res) => {
  moduleModel
    .find()
    .then((modules) => res.json(modules))
    .catch((err) => res.json(err));
});

app.post("/api/getModuels", async (req, res) => {
  try {
    const update = {
      macAddress: req.body.macAddress,
      timestamp: req.body.timestamp,
      moduleName: req.body.moduleName,
      log: req.body.log || "module is connected", 
      ipAddress: req.body.ipAddress,
    };

    const module = await moduleModel.findOneAndUpdate(
      {
        macAddress: req.body.macAddress,
        timestamp: req.body.timestamp,
        moduleName: req.body.moduleName,
        log: req.body.log || "module is connected", 
        ipAddress: req.body.ipAddress,
      },
      update,
      { new: true, upsert: true }
    );

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

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
