const MedicineType = require("../../Model/Master/TypeModel");


// Add new type

exports.addType = async (req, res) => {
  try {

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Type name required" });
    }

    const existing = await MedicineType.findOne({ name });

    if (existing) {
      return res.status(400).json({ message: "Type already exists" });
    }

    const type = await MedicineType.create({ name });

    res.status(201).json({
      message: "Type added",
      type
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all types

exports.getTypes = async (req, res) => {
  try {
    const types = await MedicineType.find().sort({ name: 1 });
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Update type by id  

exports.updateType = async (req, res) => {
  try {

    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Type name is required"
      });
    }

    const existing = await MedicineType.findOne({ name });

    if (existing && existing._id.toString() !== id) {
      return res.status(400).json({
        message: "Type already exists"
      });
    }



    const updated = await MedicineType.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Type not found"
      });
    }

    res.json({
      message: "Type updated successfully",
      updated
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Delete type by id

exports.deleteType = async (req, res) => {
  try {

    const { id } = req.params;

    const deleted = await MedicineType.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        message: "Type not found"
      });
    }

    res.json({
      message: "Type deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};