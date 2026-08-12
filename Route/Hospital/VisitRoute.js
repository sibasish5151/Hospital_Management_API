const express = require("express");
const router = express.Router();

const { createVisit , getAllPatients,getAllCasualtyPatients, dischargeCasualtyPatient,getActiveOPDVisits,getPathologyPatients} = require("../../Controller/Hospital/VisitController");

router.post("/create", createVisit);


router.get("/getallcasualitypatient",getAllCasualtyPatients);
router.get("/getallpatient",getAllPatients);

router.get("/getpathologypatients", getPathologyPatients);

router.post("/dischargecasualtypatient", dischargeCasualtyPatient);


router.get("/getactiveopdvisits", getActiveOPDVisits);

module.exports = router;