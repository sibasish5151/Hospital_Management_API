const bcrypt = require("bcryptjs");
const User = require("../Model/UserModel");



// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({
      message: "User created successfully",
      user
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// Get all users

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      count: users.length,
      users
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};



// Update a user  
exports.updateUser = async (req, res) => {
  try {
    const { name, role } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, role },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated",
      user
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


// Delete a user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

