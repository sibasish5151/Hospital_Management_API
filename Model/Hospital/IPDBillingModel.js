const mongoose = require("mongoose");

const ipdPharmaSchema = new mongoose.Schema({

  //  Patient Context
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },

  visit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Visit"
  },

  ipd: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "IPD",
    required: true
  },

  // 🔥 DAY-WISE LEDGER
  days: [
    {
      date: {
        type: Date,
        required: true
      },

      items: [
        {
          product_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Inventory"
          },

          name: String,
          batch: String,
          expiry: Date,

          qty: Number,
          price: Number,
          total: Number
        }
      ],

      total: {
        type: Number,
        default: 0
      },

      paid: {
        type: Number,
        default: 0
      },

      due: {
        type: Number,
        default: 0
      }
    }
  ],

  // 🔥 FINAL SUMMARY
  grand_total: {
    type: Number,
    default: 0
  },

  total_paid: {
    type: Number,
    default: 0
  },

  total_due: {
    type: Number,
    default: 0
  },

  status: {
    type: String,
    enum: ["PAID", "UNPAID"],
    default: "UNPAID"
  }

}, { timestamps: true });

module.exports = mongoose.model("IPDPharma", ipdPharmaSchema);