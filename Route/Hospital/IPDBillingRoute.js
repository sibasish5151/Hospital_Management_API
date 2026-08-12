const express = require("express");
const router = express.Router();

const { addIPDMedicine ,getPatientIPDPharma,getPatientIPDSummary } = require("../../Controller/Hospital/IPDBillingController");

//  Add medicine (day-wise)
router.post("/addmedicine", addIPDMedicine);

router.get("/getpatientbillrecord/:patient_id", getPatientIPDPharma);

router.get("/patient-ipd-summary/:patient_id",getPatientIPDSummary);

module.exports = router;