
const mongoose = require("mongoose");

const salesSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  marketing: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    required: true
  },
  sales: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Sales", salesSchema);
