const express = require("express");
const router = express.Router();

const { createIPD ,getAllIPDPatients,getAllAdmittedIPDPatients,dischargeIPDPatient ,getDischargedIPDPatients,calculateIPDBillAPI } = require("../../Controller/Hospital/IPDController");

router.post("/ipdbook", createIPD);

//router.get("/PatientDetails", getFullPatientDetails);
router.get("/AdmittedIPDPatients", getAllAdmittedIPDPatients);


router.get("/DischargedIPDPatients", getDischargedIPDPatients);




router.post("/calculate-bill", calculateIPDBillAPI);


router.get("/AllIPDPatients", getAllIPDPatients);


// Discharge an IPD patient
router.post("/discharge", dischargeIPDPatient);



module.exports = router;