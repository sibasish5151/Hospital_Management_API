const mongoose = require("mongoose");


const BedSchema = new mongoose.Schema({
  bedNumber: {
    type: String, // GB-1, 101, C-1 etc.
    unique: true,
    required: true
  },

  roomType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RoomType",
    required: true
  },

  floor: {
    type: String // First Floor, Second Floor
  },


    status: {
    type: String,
    enum: ["AVAILABLE", "OCCUPIED", "MAINTENANCE"],
    default: "AVAILABLE"
  }

}, { timestamps: true });

BedSchema.index({ status: 1 });
BedSchema.index({ roomType: 1 });
module.exports = mongoose.model("Bed", BedSchema);