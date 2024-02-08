const express = require("express");
const app = express();
const port = 3000;
app.use(express.json());
const cors = require("cors");
app.use(
  cors({
    origin: "http://localhost:3001", // or '*' for any domain
  })
);

const logs = [];
let lastModuleDetails = [];
let connectedModules = {};
let testLedIndecator = false;
let macAddress = "";
let macAddressTimeout;
let lastPongMessage = {};
let testType = "";
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
