const mongoose = require("mongoose");
const LogSchema = new mongoose.Schema({
  macAddress: String,
  timestamp: String,
  moduleName: String,
  log: String,
});

const logsModel = mongoose.model("Log", LogSchema);

module.exports = logsModel;
