const express = require("express");
const router = express.Router();


const {
  createUser,
  getAllUsers,
  updateUser,
  deleteUser,

} = require("../Controller/UserController");


router.post("/Create-user", createUser);
router.get("/getall-user", getAllUsers);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);


module.exports = router;