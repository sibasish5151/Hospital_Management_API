const express = require("express");
const router = express.Router();

const {  addStock , getInventoryByCode ,getAllInventory,searchMedicineByName,getExpiryMedicines,getLowStock,getallinvoice , getDashboard } = require("../Controller/InventoryController");

 router.post("/add-stock", addStock);      // add stock

 router.get("/dashboard", getDashboard);         //get dashboard data

router.get("/full", getAllInventory);       // get all inventory


router.get("/invoice", getallinvoice);     //get inventory by code for invoice generation
router.get("/search", searchMedicineByName);  //search medicine by name 

router.get("/expiry", getExpiryMedicines);    //get expiry medicines

router.get("/lowstock", getLowStock);        //get low stock alert


router.get("/:code", getInventoryByCode);     //search medicine by code

module.exports = router;