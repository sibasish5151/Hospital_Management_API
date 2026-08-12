const express = require("express");
const router = express.Router();
const controller = require("../../Controller/Master/SupplierController");

router.post("/addsupplier", controller.addSupplier);
router.get("/getsuppliers", controller.getSuppliers);
router.put("/updatesupplier/:id", controller.updateSupplier);
router.delete("/deletesupplier/:id", controller.deleteSupplier);
module.exports = router;