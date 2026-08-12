
const mongoose = require("mongoose");


const RoomTypeSchema = new mongoose.Schema({
  name: {
    type: String, // "General Bed", "General Cabin", etc.
    required: true
  },

  category: {
    type: String, 
    enum: ["BED", "CABIN","ICU"],     // ADDED AS ICU NEW
    required: true
  },

type: {                             /// ADDED 
    type: String,
    enum: ["IPD","CASUALTY"],     
  },

  subType: {
    type: String,
    enum: ["GENERAL", "NARROW", "BROAD"],     
  },

  hasAC: {
    type: Boolean,
    default: false
  },

  hasCentralOxygen: {
    type: Boolean,
    default: false
  },


  // FLEXIBLE CHARGES 
  charges: {
    doctorVisitPerVisit: {
      type: Number,
      default: 300
    },
    visitsPerDay: {
      type: Number,
      default: 2
    },
    nursingCare: {
      type: Number,
      required: true
    },
    bedCharge: {
      type: Number,
      required: true
    },

    hourlyCharge: {                                    // added 
      type: Number,   
    },

        // 👇 ICU specific new
   PreviousbedCharge: {
      type: Number,   
    },
       monitorCharge: {
      type: Number,   
    },
       cleanlinessCharge: {
      type: Number,   
    },
       biomedicalWasteCharge: {
      type: Number,   
    }

  }

}, { timestamps: true });


module.exports = mongoose.model("RoomType", RoomTypeSchema);