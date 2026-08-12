const mongoose = require("mongoose");

const mdcnmasterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

 type: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "MedicineType"
},

brand: {
    type: String
  },

  composition: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("MedicineMaster", mdcnmasterSchema);