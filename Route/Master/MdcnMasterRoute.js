const express = require("express");
const router = express.Router();
const controller = require("../../Controller/Master/MdcnMasterController");

router.post("/addmedicine", controller.addMedicine);
router.get("/getmedicines", controller.getMedicines);
router.put("/updatemdcn/:id", controller.updateMedicine);
router.delete("/deletemdcn/:id", controller.deleteMedicine);

module.exports = router;