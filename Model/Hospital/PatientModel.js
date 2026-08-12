const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({

  patient_id: {
    type: String,
    unique: true, // PAT0001
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  age: {
    type: Number,
    required: true
  },

  gender: {
    type: String,
    enum: ["Male", "Female", "Other"]
  },

   mobile: {                 // ✅ NEW (IMPORTANT)
    type: String,
    required: true,
    unique: true
  },

  visitCount: {             // ✅ NEW
    type: Number,
    default: 0
  },


religion:{
    type: String,
  
  },  



}, { timestamps: true });

module.exports = mongoose.model("Patient", patientSchema);