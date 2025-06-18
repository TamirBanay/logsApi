/*
 * ESP32 Alarm System API Server - Improved Version
 * Version: 1.1.0
 * Description: Enhanced API with better structure and deployment readiness
 */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// Import models
const moduleModel = require("./mongoDB/Modules");
const logsModel = require("./mongoDB/Logs");

// Initialize Express app
const app = express();

// ==================== CONFIGURATION ====================
const CONFIG = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 
        "mongodb+srv://banay9329:XfKyfKqWnEHImqXm@cluster0.f3a2v25.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&tls=true&tlsInsecure=true",
    LATEST_VERSION: process.env.LATEST_VERSION || "0.2.0",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
    CITIES_FILE_PATH: "./cities.json"
};

// ==================== MIDDLEWARE ====================
app.use(express.json({ limit: '10mb' }));

// CORS Configuration
const corsOptions = {
    origin: CONFIG.CORS_ORIGIN,
    optionsSuccessStatus: 200,
    credentials: true
};
app.use(cors(corsOptions));

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// ==================== GLOBAL VARIABLES ====================
let cityList = [];
let savedDataCities = {};
let savedData = {};
let macAddress = "";
let macAddressTimeout;
let lastPongMessage = {};
let testType = "";
const macAddressTimeouts = {};

// ==================== UTILITY FUNCTIONS ====================
function loadCities() {
    try {
        const data = fs.readFileSync(CONFIG.CITIES_FILE_PATH, "utf8");
        const cities = JSON.parse(data);
        cityList = Object.keys(cities).map((key) => cities[key].label);
        console.log(`✅ Loaded ${cityList.length} cities`);
    } catch (error) {
        console.error("❌ Error reading cities file:", error.message);
        cityList = [];
    }
}

function validateRequiredFields(obj, requiredFields) {
    const missing = requiredFields.filter(field => !obj[field]);
    return missing.length === 0 ? null : missing;
}

// ==================== DATABASE CONNECTION ====================
async function connectDatabase() {
    try {
        await mongoose.connect(CONFIG.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ MongoDB connected successfully");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

// ==================== API ROUTES ====================

// Health check endpoint
app.get("/", (req, res) => {
    res.json({
        message: "ESP32 Alarm System API Server",
        version: CONFIG.LATEST_VERSION,
        status: "running",
        timestamp: new Date().toISOString(),
        endpoints: [
            "GET /api/getModuels - Get all modules",
            "POST /api/getModuels - Update/create module",
            "GET /api/getLogs - Get all logs", 
            "POST /api/getLogs - Create new log",
            "GET /api/getLastVersion - Get latest firmware version",
            "GET /citiesjson - Get cities list",
            "GET /api/favicon - Get favicon"
        ]
    });
});

// ==================== FIRMWARE UPDATE ROUTES ====================
app.get("/api/update", (req, res) => {
    const filePath = path.join(__dirname, "uploads", "AlermSystem.ino.esp32da.bin");
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
            error: "Firmware file not found",
            message: "Please upload the latest firmware binary"
        });
    }

    res.setHeader("Content-Disposition", "attachment; filename=AlermSystem.bin");
    res.setHeader("Content-Type", "application/octet-stream");

    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("Failed to send firmware file:", err);
            if (!res.headersSent) {
                res.status(500).json({ error: "Error sending firmware file" });
            }
        } else {
            console.log("📦 Firmware file sent successfully");
        }
    });
});

app.get("/api/getLastVersion", (req, res) => {
    res.json({ 
        lastVersion: CONFIG.LATEST_VERSION,
        releaseDate: new Date().toISOString(),
        features: [
            "Improved performance",
            "Better error handling", 
            "Enhanced security",
            "Optimized memory usage"
        ]
    });
});

// ==================== MODULE MANAGEMENT ROUTES ====================
app.get("/api/getModuels", async (req, res) => {
    try {
        const modules = await moduleModel.find().sort({ timestamp: -1 });
        res.json({
            success: true,
            count: modules.length,
            data: modules
        });
    } catch (err) {
        console.error("Error fetching modules:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to fetch modules",
            message: err.message 
        });
    }
});

app.post("/api/getModuels", async (req, res) => {
    try {
        // Validate required fields
        const requiredFields = ['macAddress', 'moduleName'];
        const missing = validateRequiredFields(req.body, requiredFields);
        
        if (missing) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields",
                missing: missing
            });
        }

        const update = {
            macAddress: req.body.macAddress,
            timestamp: req.body.timestamp || new Date().toISOString(),
            moduleName: req.body.moduleName,
            log: req.body.log || "module is connected",
            ipAddress: req.body.ipAddress || "unknown",
            version: req.body.version || "unknown",
            targetCities: req.body.targetCities || [],
            lastSeen: new Date()
        };

        const filter = { macAddress: req.body.macAddress };
        const options = { upsert: true, new: true, setDefaultsOnInsert: true };

        const module = await moduleModel.findOneAndUpdate(filter, update, options);
        
        console.log(`📱 Module updated: ${update.moduleName} (${update.macAddress})`);
        
        res.json({ 
            success: true, 
            module: module,
            message: "Module updated successfully"
        });
    } catch (error) {
        console.error("Error updating module:", error);
        res.status(500).json({ 
            success: false, 
            error: "Failed to update module",
            message: error.message 
        });
    }
});

// ==================== LOGS MANAGEMENT ROUTES ====================
app.get("/api/getLogs", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const logs = await logsModel
            .find()
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit);
            
        const total = await logsModel.countDocuments();

        res.json({
            success: true,
            data: logs,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalLogs: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (err) {
        console.error("Error fetching logs:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to fetch logs",
            message: err.message 
        });
    }
});

app.post("/api/getLogs", async (req, res) => {
    try {
        const requiredFields = ['macAddress', 'moduleName', 'log'];
        const missing = validateRequiredFields(req.body, requiredFields);
        
        if (missing) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields",
                missing: missing
            });
        }

        const logData = new logsModel({
            macAddress: req.body.macAddress,
            timestamp: req.body.timestamp || new Date().toISOString(),
            moduleName: req.body.moduleName,
            log: req.body.log,
            level: req.body.level || 'info'
        });

        const savedLog = await logData.save();
        
        console.log(`📝 New log: ${req.body.moduleName} - ${req.body.log}`);

        res.json({ 
            success: true, 
            log: savedLog,
            message: "Log saved successfully"
        });
    } catch (err) {
        console.error("Error saving log:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to save log",
            message: err.message 
        });
    }
});

// ==================== PING/PONG SYSTEM ====================
app.post("/api/pingModule", (req, res) => {
    const { macAddress: postedMacAddress, testType: postedTestType } = req.body;

    if (!postedMacAddress) {
        return res.status(400).json({ 
            success: false,
            error: "MAC address is required" 
        });
    }

    if (macAddressTimeout) {
        clearTimeout(macAddressTimeout);
    }

    macAddress = postedMacAddress;
    testType = postedTestType || 'ping';

    // Clear after 10 seconds
    macAddressTimeout = setTimeout(() => {
        macAddress = "";
        testType = "";
    }, 10000);

    console.log(`📡 Ping sent to ${postedMacAddress} - Type: ${testType}`);

    res.json({ 
        success: true,
        macAddress: postedMacAddress, 
        testType: testType,
        timestamp: new Date().toISOString()
    });
});

app.get("/api/pingModule", (req, res) => {
    if (!macAddress) {
        return res.status(404).json({ 
            success: false,
            error: "No active ping request found" 
        });
    }
    
    res.json({ 
        success: true,
        macAddress, 
        testType,
        timestamp: new Date().toISOString()
    });
});

app.post("/api/pongReceivedFromModule", (req, res) => {
    const { macAddress, message, testType } = req.body;
    
    lastPongMessage = {
        macAddress,
        message: message || "pong received",
        testType: testType || "unknown",
        timestamp: new Date().toISOString()
    };

    console.log(`📡 Pong received from ${macAddress} - ${message}`);

    res.json({
        success: true,
        ...lastPongMessage
    });

    // Clear after 10 seconds
    setTimeout(() => {
        lastPongMessage = {};
    }, 10000);
});

app.get("/api/pongReceivedFromModule", (req, res) => {
    res.json({
        success: true,
        data: lastPongMessage,
        hasData: Object.keys(lastPongMessage).length > 0
    });
});

// ==================== CONNECTION INDICATOR ====================
app.post("/api/moduleIsConnectIndicator/:macAddress", (req, res) => {
    const macAddress = req.params.macAddress;

    if (macAddressTimeouts[macAddress]) {
        clearTimeout(macAddressTimeouts[macAddress].timeoutId);
    }

    const timeoutDuration = macAddressTimeouts[macAddress]?.isConnected ? 600000 : 120000;

    const timeoutId = setTimeout(() => {
        console.log(`📵 ${macAddress} is disconnected`);
        if (macAddressTimeouts[macAddress]) {
            macAddressTimeouts[macAddress].isConnected = false;
        }
    }, timeoutDuration);

    macAddressTimeouts[macAddress] = {
        timeoutId,
        isConnected: true,
        lastSeen: new Date().toISOString()
    };

    res.json({ 
        success: true,
        message: "connected", 
        macAddress, 
        isConnected: true,
        timestamp: new Date().toISOString()
    });
});

app.get("/api/moduleIsConnectIndicator/:macAddress", (req, res) => {
    const macAddress = req.params.macAddress;
    const moduleInfo = macAddressTimeouts[macAddress];
    
    res.json({ 
        success: true,
        macAddress, 
        isConnected: moduleInfo ? moduleInfo.isConnected : false,
        lastSeen: moduleInfo ? moduleInfo.lastSeen : null
    });
});

// ==================== CITIES MANAGEMENT ====================
app.get("/citiesjson", (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.json({
        success: true,
        count: cityList.length,
        data: cityList
    });
});

app.post("/api/saveCities", (req, res) => {
    const { macAddress, cities } = req.body;

    if (!macAddress || !cities || !Array.isArray(cities)) {
        return res.status(400).json({ 
            success: false,
            error: "Invalid data - macAddress and cities array required" 
        });
    }

    console.log(`🏙️ Cities saved for ${macAddress}: ${cities.join(", ")}`);

    savedData = { cities, macAddress, timestamp: new Date().toISOString() };

    res.json({
        success: true,
        message: "Cities saved successfully",
        macAddress: macAddress,
        cities: cities,
        timestamp: savedData.timestamp
    });
});

app.get("/api/getSavedCities", (req, res) => {
    res.json({
        success: true,
        data: savedData,
        hasData: Object.keys(savedData).length > 0
    });
});

// ==================== STATIC FILES ====================
app.get("/api/favicon", (req, res) => {
    const imagePath = path.join(__dirname, "./images/favicon.ico");
    
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).json({ 
            success: false,
            error: "Favicon not found" 
        });
    }
});

// ==================== ERROR HANDLING ====================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found",
        message: "The requested API endpoint does not exist",
        availableEndpoints: [
            "GET /api/getModuels",
            "POST /api/getModuels", 
            "GET /api/getLogs",
            "POST /api/getLogs",
            "GET /api/getLastVersion",
            "GET /citiesjson"
        ]
    });
});

app.use((error, req, res, next) => {
    console.error("❌ Server Error:", error);
    res.status(500).json({
        success: false,
        error: "Internal server error",
        message: CONFIG.NODE_ENV === 'development' ? error.message : "Something went wrong"
    });
});

// ==================== SERVER STARTUP ====================
async function startServer() {
    try {
        // Load cities
        loadCities();
        
        // Connect to database
        await connectDatabase();
        
        // Start server
        app.listen(CONFIG.PORT, "0.0.0.0", () => {
            console.log("🚀 ESP32 Alarm System API Server Started");
            console.log("=".repeat(50));
            console.log(`📍 Server running on port: ${CONFIG.PORT}`);
            console.log(`🌍 Environment: ${CONFIG.NODE_ENV}`);
            console.log(`🔗 Base URL: http://localhost:${CONFIG.PORT}`);
            console.log(`📚 API Docs: http://localhost:${CONFIG.PORT}/`);
            console.log(`📊 MongoDB: Connected`);
            console.log(`🏙️ Cities loaded: ${cityList.length}`);
            console.log("=".repeat(50));
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully');
    mongoose.connection.close(() => {
        console.log('💾 MongoDB connection closed');
        process.exit(0);
    });
});

// Start the server
startServer(); 