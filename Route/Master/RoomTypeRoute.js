const express = require("express");
const router = express.Router();

const {
  createRoomType,
  getRoomTypes,
  getRoomTypeById,
  updateRoomType,
  deleteRoomType
} = require("../../Controller/Master/RoomTypeController");

router.post("/CreateRoom", createRoomType);
router.get("/GetRoom", getRoomTypes);
router.get("/getroom/:id", getRoomTypeById);
router.put("/update/:id", updateRoomType);
router.delete("/delete/:id", deleteRoomType);

module.exports = router;