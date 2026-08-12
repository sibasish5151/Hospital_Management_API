

const mongoose = require("mongoose");

const billItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: true,
  },
  name: String,
  batch: String,
  expiry: Date,
  qty: Number,
  price: Number,
  total: Number,
});

const billSchema = new mongoose.Schema(
  {
    bill_number: {
      type: String,
      required: true,
      unique: true,
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    //  NEW FIELDS (PATIENT + CASE)
    patient_name: String,
    contact_number: String,
    patient_type: String, // Casualty / OPD / IPD

    case_number: String,
    reg_no: String,

    prescribed_by: String,

    date: {
      type: Date,
      default: Date.now,
    },

    //  ITEMS
    items: [billItemSchema],

    //  BILL CALCULATION
    subtotal: Number,
    discount: Number,
    gst: Number,
    cgst: Number,
    sgst: Number,
    total: Number,

    //  PAYMENT
    payment_method: {
      type: String,
      enum: ["Cash", "UPI", "Card"],
      default: "Cash",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", billSchema);