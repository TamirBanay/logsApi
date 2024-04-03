const mongoose = require("mongoose");
const ModuleSchema = new mongoose.Schema({
  macAddress: String,
  timestamp: String,
  moduleName: String,
  log: String,
  ipAddress: String,
  version: String,
});
const moduleModel = mongoose.model("Module", ModuleSchema);

module.exports = moduleModel;
