const mongoose = require("mongoose");
const MedicineMaster = require("../../Model/Master/MdcnMasterModel");
console.log("Controller loaded. Mongoose type:", typeof mongoose);


// Add new medicine

exports.addMedicine = async (req, res) => {
  try {

    const { name , type , brand, composition } = req.body;

    if (!name || !type || !brand || !composition) {
      return res.status(400).json({ message: "Medicine name required" });
    }

    const existing = await MedicineMaster.findOne({ name });

    if (existing) {
      return res.status(400).json({ message: "Medicine already exists" });
    }

    const medicine = await MedicineMaster.create({ name, type, brand, composition });

    res.status(201).json({
      message: "Medicine added successfully",
      medicine
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// Get all medicines

exports.getMedicines = async (req, res) => {
  try {


    const medicines = await MedicineMaster.find()
      .populate("type", "name")
      .sort({ name: 1 });

    res.json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Update medicine by id




exports.updateMedicine = async (req, res) => {
  try { 
    const { id } = req.params;
    const { name , type , brand, composition } = req.body;  
    if (!name || !type || !brand || !composition) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const existing = await MedicineMaster.findOne({ name });

    if (existing && existing._id.toString() !== id) {
      return res.status(400).json({
        message: "Medicine already exists"
      });
    }

    const updated = await MedicineMaster.findByIdAndUpdate(
        id,
        { name, type, brand, composition },
        { new: true }    
    );

    if (!updated) {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }

    res.status(200).json({
        message: "Medicine updated",
        updated              
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  } 
};


// Delete medicine by id

exports.deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MedicineMaster.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }
    res.status(200).json({
      message: "Medicine deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};      
