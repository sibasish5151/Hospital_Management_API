const mongoose = require("mongoose");

const bedAllocationSchema = new mongoose.Schema({

  bed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bed",
    required: true
  },

  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },

  visit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Visit",
    required: true
  },

  ipd_admission: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "IPD",
},

  allocated_at: {
    type: Date,
    default: Date.now
  },

  allocation_type: {
    type: String,
    enum: ["CASUALTY", "IPD", "TRANSFER"],
    default: "IPD"
  },
  released_at:{
   type: Date,
  } ,

  total_timing: {
    type: Number,   // in hours
  },

  status: {
    type: String,
    enum: ["ACTIVE", "RELEASED"],
    default: "ACTIVE"
  }

}, { timestamps: true });


//   INDEX 
bedAllocationSchema.index(
  { bed: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);
module.exports = mongoose.model("BedAllocation", bedAllocationSchema);