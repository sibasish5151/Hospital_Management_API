const express = require("express");
const router = express.Router();

const {
  createBed,
  getBeds,
  getAvailableBeds,
  updateBed,
  deleteBed
} = require("../../Controller/Master/BedMasterController");
console.log("BED ROUTES LOADED");
router.post("/CreateBed", createBed);

router.get("/GetBed", getBeds);
router.get("/available", getAvailableBeds);

router.put("/UpdateBed/:id", updateBed);
router.delete("/DeleteBed/:id", deleteBed);

module.exports = router;