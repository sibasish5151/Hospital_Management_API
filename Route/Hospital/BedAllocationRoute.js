const express = require("express");
const router = express.Router();

const {
  getAvailableBeds,
  dischargeBed
} = require("../../Controller/Hospital/BedAllocationController");

router.get("/available", getAvailableBeds);

router.post("/discharge", dischargeBed);

module.exports = router;              