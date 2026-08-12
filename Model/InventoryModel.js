const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({

  code: {
    type: String,
    required: true,
    unique: true
  },

  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Medicine",
    required: true
  },

  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    index: true
  },

  invoice_number: {
    type: String,
    required: true,
    index: true
  },

  batch_number: {
    type: String,
    required: true
  },

  expiry_date: {
    type: Date,
    required: true
  },

  boxes: {
    type: Number,
    default: 0
  },

  strips_per_box: {
    type: Number,
    default: 0
  },

  tablets_per_strip: {
    type: Number,
    required: true
  },

  total_strips: {
    type: Number
  },

  total_tablets: {
    type: Number
  },

  purchase_price: {
    type: Number,
    required: true
  },

  selling_price: {
    type: Number,
    required: true
  },

  cost_per_tablet: {
    type: Number
  },

  selling_per_tablet: {
    type: Number
  },

  gst: {
    type: Number,
    default: 0
  },

  discount: {
    type: Number,
    default: 0
  }

}, { timestamps: true });

//  Important index
inventorySchema.index({
  medicine: 1,
  batch_number: 1,
  invoice_number: 1
});

module.exports = mongoose.model("Inventory", inventorySchema);