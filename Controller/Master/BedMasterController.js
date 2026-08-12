const Bed = require("../../Model/Master/BedMasterModel");

// ➤ Create Single Bed
exports.createBed = async (req, res) => {
  try {
    const bed = await Bed.create(req.body);

    res.status(201).json({
      success: true,
      data: bed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating bed",
      error: error.message,
    });
  }
};



//get all beds

exports.getBeds = async (req, res) => {
  try {
    const beds = await Bed.find().populate("roomType");

    res.status(200).json({
      success: true,
      count: beds.length,
      data: beds,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching beds",
      error: error.message,
    });
  }
};


//get avalable beds
exports.getAvailableBeds = async (req, res) => {
  try {
    const beds = await Bed.find({ isOccupied: false }).populate("roomType");

    res.status(200).json({
      success: true,
      data: beds,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching available beds",
      error: error.message,
    });
  }
};


// ➤ Update Bed

exports.updateBed = async (req, res) => {
  try {
    const bed = await Bed.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: bed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating bed",
      error: error.message,
    });
  }
};

// ➤ Delete Bed
exports.deleteBed = async (req, res) => {
  try {
    await Bed.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Bed deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting bed",
      error: error.message,
    });
  }
};