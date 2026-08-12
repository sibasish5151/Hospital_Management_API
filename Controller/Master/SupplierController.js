const Supplier = require("../../Model/Master/SupplierModel");



// Add new supplier

exports.addSupplier = async (req, res) => {
  try {

    const { name, phone, email, address, gst_number } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Supplier name required" });
    }

    const existing = await Supplier.findOne({ name });

    if (existing) {
      return res.status(400).json({ message: "Supplier already exists" });
    }

    const supplier = await Supplier.create({
      name,
      phone,
      email,
      address,
      gst_number
    });

    res.status(201).json({
      message: "Supplier added",
      supplier
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get all suppliers

exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ name: 1 });
    res.json(suppliers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Update supplier by id

exports.updateSupplier = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      name,
      phone,
      email,
      address,
      gst_number
    } = req.body;

    const existing = await Supplier.findOne({ name });

    if (existing && existing._id.toString() !== id) {
      return res.status(400).json({
        message: "Supplier already exists"
      });
    }

    const updated = await Supplier.findByIdAndUpdate(
      id,
      {
        name,
        phone,
        email,
        address,
        gst_number
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        message: "Supplier not found"
      });
    }

    res.json({
      message: "Supplier updated successfully",
      updated
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Delete supplier by id

exports.deleteSupplier = async (req, res) => {
  try {

    const { id } = req.params;

    const deleted = await Supplier.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        message: "Supplier not found"
      });
    }

    res.json({
      message: "Supplier deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};