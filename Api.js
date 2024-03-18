const express = require("express");
const mongoose = require("mongoose");
const moduleModel = require("./mongoDB/Modules");
const logsModel = require("./mongoDB/Logs");

const app = express();
const port = 3000;
app.use(express.json());
const cors = require("cors");

const corsOptions = {
  origin: "https://tamirbanay.github.io/myAdminApp",
};

app.use(cors(corsOptions));
// app.use(
//   cors({
//     origin: "*",
//   })
// );

const logs = [];
let lastModuleDetails = [];
let connectedModules = {};
let testLedIndecator = false;
let macAddress = "";
let macAddressTimeout;
let lastPongMessage = {};
let testType = "";

const mongoDB =
  "mongodb+srv://banay9329:XfKyfKqWnEHImqXm@cluster0.f3a2v25.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
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
    let module = await moduleModel.findOne({ macAddress: req.body.macAddress });

    if (!module) {
      module = new moduleModel({
        macAddress: req.body.macAddress,
        timestamp: req.body.timestamp,
        moduleName: req.body.moduleName,
        log: req.body.log,
        ipAddress: req.body.ipAddress,
        log: "module is connected", // This can be a default message or based on some logic
      });
      await module.save();
    }

    // The module either already existed or is newly created, now send back the response
    res.send({ success: true, module: module });
  } catch (err) {
    console.error("Error saving data:", err);
    res.status(500).send({ success: false, message: "Failed to save data" });
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
    // Create a new document for the Data collection
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

// const ModuleSchema = new mongoose.Schema({
//   macAddress: String,
//   lastSeen: String,
// });
// const moduleModel = mongoose.model("Module", ModuleSchema);
// const Logschema = new mongoose.Schema({
//   macAddress: String,
//   timestamp: String,
//   log: String,
// });

// Define a model
// const logsModel = mongoose.model("Logs", Logschema);

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
    console.log("Pong message and MAC address reset after 10 seconds");
  }, 10000);
});

app.get("/api/pongReceivedFromModule", (req, res) => {
  res.json(lastPongMessage);
});
app.post("/api/logs", (req, res) => {
  try {
    console.log("Log received:", req.body);
    logs.push(req.body);
    res.status(200).send(logs);
  } catch (error) {
    console.error("Error handling /api/logs:", error);
    res.status(500).send("Server error");
  }
});

app.post("/api/register", (req, res) => {
  const { moduleName, macAddress, ipAddress } = req.body;
  connectedModules[macAddress] = {
    moduleName,
    lastSeen: new Date(),
    macAddress: macAddress,
    ipAddress: ipAddress,
  };
  res.status(200).send("Module registered");
});

app.get("/api/modules", (req, res) => {
  res.status(200).json(connectedModules);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
