const express = require("express");
const router = express.Router();

const {
  createPathoBill,
  getAllPathoBills,
  getPathoBillsByPatient,
  getSinglePathoBill
} = require("../../Controller/Pathology/PathoController");


//  1. CREATE BILL
router.post("/create", createPathoBill);

// 2. GET ALL BILLS
router.get("/getall", getAllPathoBills);

//  3. GET BILLS BY PATIENT ID
//router.get("/patient/:patient_id", getPathoBillsByPatient);



//  2. GET ALL BILLS
//router.get("/getall", getAllPathoBills);


//  4. GET SINGLE BILL
// router.get("/:id", getSinglePathoBill);


module.exports = router;