const mongoose = require("mongoose");

const pathoItemSchema = new mongoose.Schema({
  test_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PathologyTest",
    required: true
  },

    test_name: {
        type: String,
        required: true
    },


  price: {
    type: Number,
    required: true
  }
});


const pathoBillSchema = new mongoose.Schema({

  bill_id: {
    type: String,
    unique: true
  },

  date: {
    type: Date,
    default: Date.now
  },

  case_number: {
    type: String,
  
    index: true
  },

  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },

  items: [pathoItemSchema],

  total_amount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["PAID", "PENDING"],
    default: "PAID"
  }

}, { timestamps: true });

module.exports = mongoose.model("PathoBill", pathoBillSchema);