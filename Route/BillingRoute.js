const express = require("express");
const router = express.Router();
const {
  createBill,
  getAllBills,
  getBillById,
  updateBill,
  deleteBill,
} = require("../Controller/BillingController");



router.post("/create",  createBill);
router.get("/getallbills",  getAllBills);
router.get("/:id", getBillById);
router.put("/:id", updateBill);
router.delete("/:id", deleteBill);

module.exports = router;