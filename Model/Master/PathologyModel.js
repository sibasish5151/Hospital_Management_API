const mongoose = require("mongoose");

const referenceSchema = new mongoose.Schema(
  {
    condition: {
      gender: {
        type: String,
        required: true,
        enum: ["Male", "Female", "Other","All"],
      },

      ageFrom: {
        type: Number,
      },

      ageTo: {
        type: Number,
      },
    },

    type: {
      type: String,
      enum: ["RANGE", "MAX", "MIN", "OPTIONS", "TEXT"],
     
    },

    min: Number,
    max: Number,
    value: Number,

    options: [String],

    normal: String,
  },
  { _id: false }
);

const pathologyTestSchema = new mongoose.Schema(
  {
    // =========================
    // Classification
    // =========================

    department: {
      type: String,
      required: true,
      trim: true,
    },

    profile: {
      type: String,
      trim: true,
    },

    section: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================
    // Test Details
    // =========================

  

    testName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    shortName: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================
    // Laboratory
    // =========================

    method: {
      type: String,
      trim: true,
      default: "",
    },

    unit: {
      type: String,
      trim: true,
      default: "",
    },

    // =========================
    // Billing
    // =========================

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    // =========================
    // Result Configuration
    // =========================

    inputType: {
      type: String,
      enum: ["NUMBER", "TEXT", "SELECT"],
   
    },

    // =========================
    // Reference Range
    // =========================

    references: {
      type: [referenceSchema],
      default: [],
    },

    // =========================
    // Report
    // =========================

    displayOrder: {
      type: Number,
      default: 0,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

   
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PathologyTest", pathologyTestSchema);