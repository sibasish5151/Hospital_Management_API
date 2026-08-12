const express = require("express");
const router = express.Router();

const {
  createTest,
  getAllTests,
  //searchTests,
  //getTestById,
  updateTest,
  deleteTest
} = require("../../Controller/Master/PathologyController");


//  CREATE
router.post("/create", createTest);

//  GET ALL
router.get("/getall", getAllTests);

// //  SEARCH
// router.get("/search", searchTests);

// //get by id
// router.get("/:id", getTestById);

//  UPDATE
router.put("/:id", updateTest);

//  DELETE (soft)
router.delete("/:id", deleteTest);

module.exports = router;