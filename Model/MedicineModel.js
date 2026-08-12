const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

 type: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "MedicineType"
},

  manufacturer: {
    type: String
  },
  
  master_medicine: {
   type: mongoose.Schema.Types.ObjectId,
   ref: "MedicineMaster"
},

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Medicine", medicineSchema);