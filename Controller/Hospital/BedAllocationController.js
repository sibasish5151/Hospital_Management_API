
const Bed = require("../../Model/Master/BedMasterModel");
const BedAllocation = require("../../Model/Hospital/BedAllocationModel");


//  1. GET AVAILABLE BEDS
exports.getAvailableBeds = async (req, res) => {
  try {

    const { roomType, floor } = req.query;

    const query = {
      status: "AVAILABLE"
    };

    if (roomType) query.roomType = roomType;
    if (floor) query.floor = floor;

    const beds = await Bed.find(query)
      .populate("roomType");

    res.json({
      count: beds.length,
      beds
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching beds",
      error: error.message
    });
  }
};



//  3. DISCHARGE BED
exports.dischargeBed = async (req, res) => {
  try {

    const { bed_id } = req.body;

    if (!bed_id) {
      return res.status(400).json({
        message: "bed_id is required"
      });
    }

    // 🔍 Find active allocation
    const allocation = await BedAllocation.findOne({
      bed: bed_id,
      status: "ACTIVE"
    });

    if (!allocation) {
      return res.status(404).json({
        message: "No active allocation found"
      });
    }

    // 🔥 Release allocation
    allocation.status = "RELEASED";
    allocation.released_at = new Date();
    await allocation.save();

    // 🔥 Update bed
    await Bed.findByIdAndUpdate(bed_id, {
      status: "AVAILABLE"
    });

    res.json({
      message: "Bed discharged successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error discharging bed",
      error: error.message
    });
  }
};