const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Import models
const moduleModel = require("./mongoDB/Modules");
const logsModel = require("./mongoDB/Logs");

const app = express();

// Configuration
const CONFIG = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 
        "mongodb+srv://banay9329:XfKyfKqWnEHImqXm@cluster0.f3a2v25.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tls=true&tlsInsecure=true",
    LATEST_VERSION: "0.2.0"
};

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: "*", optionsSuccessStatus: 200 }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Global variables
let cityList = [];
let savedData = {};
const macAddressTimeouts = {};

// Load cities function
function loadCities() {
    try {
        const data = fs.readFileSync("./cities.json", "utf8");
        const cities = JSON.parse(data);
        cityList = Object.keys(cities).map((key) => cities[key].label);
        console.log(`✅ Loaded ${cityList.length} cities`);
    } catch (error) {
        console.error("❌ Error reading cities file:", error.message);
        cityList = [];
    }
}

// Database connection
async function connectDatabase() {
    try {
        await mongoose.connect(CONFIG.MONGODB_URI);
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

// Routes
app.get("/", (req, res) => {
    res.json({
        message: "ESP32 Alarm System API Server",
        version: CONFIG.LATEST_VERSION,
        status: "running",
        timestamp: new Date().toISOString()
    });
});

// Firmware routes
app.get("/api/update", (req, res) => {
    const filePath = path.join(__dirname, "uploads", "AlermSystem.ino.esp32da.bin");
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Firmware file not found" });
    }

    res.setHeader("Content-Disposition", "attachment; filename=AlermSystem.bin");
    res.setHeader("Content-Type", "application/octet-stream");
    res.sendFile(filePath);
});

app.get("/api/getLastVersion", (req, res) => {
    res.json({ lastVersion: CONFIG.LATEST_VERSION });
});

// Module routes
app.get("/api/getModuels", async (req, res) => {
    try {
        const modules = await moduleModel.find().sort({ timestamp: -1 });
        res.json(modules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/getModuels", async (req, res) => {
    try {
        const update = {
            macAddress: req.body.macAddress,
            timestamp: req.body.timestamp || new Date().toISOString(),
            moduleName: req.body.moduleName,
            log: req.body.log || "module is connected",
            ipAddress: req.body.ipAddress,
            version: req.body.version,
            targetCities: req.body.targetCities || []
        };

        const filter = { macAddress: req.body.macAddress };
        const options = { upsert: true, new: true, setDefaultsOnInsert: true };

        const module = await moduleModel.findOneAndUpdate(filter, update, options);
        res.json({ success: true, module });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Logs routes
app.get("/api/getLogs", async (req, res) => {
    try {
        const logs = await logsModel.find().sort({ timestamp: -1 }).limit(100);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/getLogs", async (req, res) => {
    try {
        const logData = new logsModel({
            macAddress: req.body.macAddress,
            timestamp: req.body.timestamp || new Date().toISOString(),
            moduleName: req.body.moduleName,
            log: req.body.log
        });

        const savedLog = await logData.save();
        res.json({ success: true, log: savedLog });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Cities routes
app.get("/citiesjson", (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.json(cityList);
});

app.post("/api/saveCities", (req, res) => {
    const { macAddress, cities } = req.body;

    if (!macAddress || !cities || !Array.isArray(cities)) {
        return res.status(400).json({ error: "Invalid data" });
    }

    savedData = { cities, macAddress, timestamp: new Date().toISOString() };
    
    res.json({
        success: true,
        message: "Cities saved successfully",
        macAddress,
        cities
    });
});

app.get("/api/getSavedCities", (req, res) => {
    res.json(savedData);
});

// Connection indicator
app.post("/api/moduleIsConnectIndicator/:macAddress", (req, res) => {
    const macAddress = req.params.macAddress;

    if (macAddressTimeouts[macAddress]) {
        clearTimeout(macAddressTimeouts[macAddress].timeoutId);
    }

    const timeoutId = setTimeout(() => {
        if (macAddressTimeouts[macAddress]) {
            macAddressTimeouts[macAddress].isConnected = false;
        }
    }, 120000);

    macAddressTimeouts[macAddress] = {
        timeoutId,
        isConnected: true
    };

    res.json({ 
        message: "connected", 
        macAddress, 
        isConnected: true 
    });
});

app.get("/api/moduleIsConnectIndicator/:macAddress", (req, res) => {
    const macAddress = req.params.macAddress;
    const moduleInfo = macAddressTimeouts[macAddress];
    
    res.json({ 
        macAddress, 
        isConnected: moduleInfo ? moduleInfo.isConnected : false 
    });
});

// Static files
app.get("/api/favicon", (req, res) => {
    const imagePath = path.join(__dirname, "./images/favicon.ico");
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).json({ error: "Favicon not found" });
    }
});

// Error handling
app.use((req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});

// Start server
async function startServer() {
    try {
        loadCities();
        await connectDatabase();
        
        app.listen(CONFIG.PORT, "0.0.0.0", () => {
            console.log(`🚀 Server running on port ${CONFIG.PORT}`);
            console.log(`🌍 Environment: ${CONFIG.NODE_ENV}`);
            console.log(`📊 MongoDB: Connected`);
            console.log(`🏙️ Cities loaded: ${cityList.length}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

startServer(); 