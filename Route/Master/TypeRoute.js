const express = require("express");
const router = express.Router();
const controller = require("../../Controller/Master/TypeController");

router.post("/addtype", controller.addType);
router.get("/gettypes", controller.getTypes);
router.put("/updatetype/:id", controller.updateType);
router.delete("/deletetype/:id", controller.deleteType);

module.exports = router;