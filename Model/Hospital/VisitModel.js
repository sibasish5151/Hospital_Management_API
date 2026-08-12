const mongoose = require("mongoose");

const visitSchema = new mongoose.Schema({

  case_number: {
    type: String,
    unique: true, // CASE-001
  },

  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: true
  },


visit_type: {
    type: String,
    enum: ["OPD", "IPD", "CASUALTY"],
    required: true
  },

  doctor: {
    type: String 
  },

  //  COMMON EXTRA FIELDS (from your payload)
 


   father: {
    type: String 
  },
  attendant: {
    type: String 
  },


  address: {
    at: {
      type: String
    },
    po: {
      type: String
    },
    ps: {
      type: String
    },
    dist: {
      type: String
    },
    state: {
      type: String
    }
  },

   //  ADMISSION (mainly IPD / Casualty)
  // admit_date: {
  //   type: Date,
  // },                                                       // change
  // admit_time: {
  //   type: String,
  // },

//  bed: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Bed"
// },

  //  DISCHARGE (future)
  discharge_date: {
    type: Date
  },
  discharge_time: {
    type: String
  },


   status: {
    type: String,
    enum: ["ACTIVE", "DISCHARGED"],
    default: "ACTIVE"
  },

billing: {
  billing_type: {
    type: String,
    enum: ["CASUALTY", "IPD"]
  },

  // casualty
  total_hours: Number,
  hourly_rate: Number,

  // ipd
  total_days: Number,
  daily_charge: Number,

  // common
  total_amount: Number,

 discount: {
    type: Number,
    default: 0
  },

  // common 
  grand_total: Number,

  breakdown: {
    bedCharge: Number,
    nursingCare: Number,
    monitorCharge: Number,
    cleanlinessCharge: Number,
    biomedicalWasteCharge: Number,

    doctor: {
      per_visit: Number,
      visits_per_day: Number,
      total_per_day: Number
    }
  }
},


    visitNumber: {           // ✅ ADD THIS
    type: Number,
    required: true                             
  },

  
  visit_date: {
    type: String,                                                    // chnaged here 
   required: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Visit", visitSchema);