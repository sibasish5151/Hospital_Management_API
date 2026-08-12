const RoomType = require("../../Model/Master/RoomTypeModel");

//  Create Room Type
exports.createRoomType = async (req, res) => {
  try {
    const { name, category,type, charges } = req.body;

    if (!name || !category || !type) {
      return res.status(400).json({
        success: false,
        message: "Name, category, and type are required",
      });
    }

    const roomType = await RoomType.create(req.body);

    res.status(201).json({
      success: true,
      data: roomType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating room type",
      error: error.message,
    });
  }
};

//  Get All Room Types
exports.getRoomTypes = async (req, res) => {
  try {
    const data = await RoomType.find();

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching room types",
      error: error.message,
    });
  }
};

//  Get Single Room Type
exports.getRoomTypeById = async (req, res) => {
  try {
    const data = await RoomType.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Room type not found",
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching room type",
      error: error.message,
    });
  }
};

//  Update Room Type
exports.updateRoomType = async (req, res) => {
  try {
    const data = await RoomType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating room type",
      error: error.message,
    });
  }
};

//  Delete Room Type
exports.deleteRoomType = async (req, res) => {
  try {
    await RoomType.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Room type deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting room type",
      error: error.message,
    });
  }
};