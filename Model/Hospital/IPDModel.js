const mongoose = require("mongoose");

const IPDSchema = new mongoose.Schema(
  {
    ipd_id: {
      type: String,
      required: true,
      unique: true
    },

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true
    },

    case_from: {
      type: String,
      enum: ["OPD", "CASUALTY"],
      required: true
    },

    visit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Visit"
    },


    bed: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      required: true
    },

    status: {
      type: String,
      enum: ["ADMITTED", "DISCHARGED"],
      default: "ADMITTED"
    },

    admission_date: {
      type: Date,
      default: Date.now
    },

    discharge_date: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("IPD", IPDSchema);