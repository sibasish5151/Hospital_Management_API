
const mongoose = require("mongoose");

const Patient = require("../../Model/Hospital/PatientModel");
const Visit = require("../../Model/Hospital/VisitModel");
const IPD = require("../../Model/Hospital/IPDModel");

const Bed = require("../../Model/Master/BedMasterModel");
const BedAllocation = require("../../Model/Hospital/BedAllocationModel");
const RoomType = require("../../Model/Master/RoomTypeModel");


const {generatePatientId} = require("../../utils/HospitalHelper");
const {generateCaseNumber} = require("../../utils/HospitalHelper");


exports.createVisit = async (req, res) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    const {
      name,
      age,
      gender,
      mobile,
      doctor,
      religion,
      father,
      attendant,
      at,
      po,
      ps,
      dist,
      state,
     visit_date,
      visit_type,   // 🔥 REQUIRED
      bed           // only for CASUALTY
    } = req.body;

    // ✅ BASIC VALIDATION
    if (!name || !mobile) {
      throw new Error("Name and mobile are required");
    }

    if (!visit_type) {
      throw new Error("visit_type is required (OPD / CASUALTY)");
    }

    // ❌ OPD should NOT have bed
    if (visit_type === "OPD" && bed) {
      throw new Error("OPD patients cannot have bed");
    }

    // 1️⃣ FIND OR CREATE PATIENT
    let patient = await Patient.findOne({ mobile }).session(session);

    if (!patient) {
      const patient_id = await generatePatientId();

      const created = await Patient.create([{
        patient_id,
        name: name.trim(),
        age,
        gender,
        mobile,
        religion,
        visitCount: 1
      }], { session });

      patient = created[0];

    } else {
      patient.visitCount += 1;
      await patient.save({ session });
    }

    // 2️⃣ VISIT NUMBER
    const visitNumber = patient.visitCount;

    // 3️⃣ CASE NUMBER
    const case_number = await generateCaseNumber();

    // 4️⃣ CREATE VISIT (NO BED HERE)
    const visitArr = await Visit.create([{
      case_number,
      patient: patient._id,
      visit_type,
      doctor,
      visitNumber,
      father,
      attendant,
      address: {
        at,
        po,
        ps,
        dist,
        state
      },
      visit_date
    }], { session });

    const visit = visitArr[0];

    // 🔥 5️⃣ BED BOOKING (ONLY FOR CASUALTY)
    if (visit_type === "CASUALTY" && bed) {

      // ❗ Ensure patient doesn't already have an active bed
      const existing = await BedAllocation.findOne({
        patient: patient._id,
        status: "ACTIVE"
      }).session(session);

      if (existing) {
        throw new Error("Patient already has an active bed. Release first.");
      }

      // 🔒 Atomic bed update (prevents race condition)
      const updatedBed = await Bed.findOneAndUpdate(
        { _id: bed, status: "AVAILABLE" },
        { status: "OCCUPIED" },
        { new: true, session }
      );

      if (!updatedBed) {
        throw new Error("Bed already occupied or not available");
      }

      // 🧾 Create bed allocation
      await BedAllocation.create([{
        bed,
        patient: patient._id,
        visit: visit._id,
        allocation_type: "CASUALTY"
      }], { session });
    }

    // ✅ COMMIT
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Visit created successfully",
      patient,
      visit
    });

  } catch (err) {

    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};



// for Casualty patients billing discharge

exports.getAllCasualtyPatients = async (req, res) => {
  try {

    // 🔹 1. Get all CASUALTY visits with patient
    const visits = await Visit.find({
      visit_type: "CASUALTY"
    }).populate("patient");

    if (!visits.length) {
      return res.status(404).json({
        message: "No casualty patients found"
      });
    }

    // 🔹 2. Unique patient IDs
    const uniquePatientIds = [
      ...new Set(visits.map(v => v.patient._id.toString()))
    ];

    // 🔹 3. Fetch all data in parallel (optimized)
    const patientsData = await Promise.all(
      uniquePatientIds.map(async (patientId) => {

        const [patient, patientVisits, bedAllocations, ipdAdmissions] =
          await Promise.all([

            Patient.findById(patientId),

            Visit.find({ patient: patientId })
              .sort({ createdAt: -1 }),

            BedAllocation.find({ patient: patientId })
              .populate({
                path: "bed",
                populate: {
                  path: "roomType"
                }
              })
              .sort({ allocated_at: -1 }),

            IPD.find({ patient: patientId })
              .sort({ createdAt: -1 })

          ]);

        return {
          patient,

          visits: patientVisits,

          bed_history: bedAllocations.map(b => ({
            bedNumber: b.bed?.bedNumber,

            roomType: b.bed?.roomType?.name,

            hourlyCharge: b.bed?.roomType?.charges?.hourlyCharge || 0,

            status: b.status,

            allocated_at: b.allocated_at,

            released_at: b.released_at,

            allocation_type: b.allocation_type
          })),

          ipd: ipdAdmissions
        };
      })
    );

    res.status(200).json({
      success: true,
      count: patientsData.length,
      data: patientsData
    });

  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};



// get all (opd,ipd,casualty) patients for pathology billing
exports.getPathologyPatients = async (req, res) => {
  try {

    // -------------------------
    // 1. Active OPD + Casualty
    // -------------------------
    const visits = await Visit.find({
      visit_type: { $in: ["OPD", "CASUALTY"] },
      status: "ACTIVE"
    })
      .populate("patient")
      .sort({ createdAt: -1 });

    const opdCasualty = visits.map((visit) => ({
      patient_type: visit.visit_type,

      visit_id: visit._id,
      case_number: visit.case_number,
      visit_date: visit.visit_date,

      ipd_id: null,

      patient: {
        _id: visit.patient?._id,
        patient_id: visit.patient?.patient_id,
        name: visit.patient?.name,
        age: visit.patient?.age,
        gender: visit.patient?.gender,
        mobile: visit.patient?.mobile,
        religion: visit.patient?.religion,
        visitCount: visit.patient?.visitCount
      }
    }));


    // -------------------------
    // 2. Admitted IPD Patients
    // -------------------------
    const ipdPatients = await IPD.find({
      status: "ADMITTED"
    })
      .populate("patient")
      .populate("visit")
      .sort({ createdAt: -1 });

    const ipd = ipdPatients.map((record) => ({
      patient_type: "IPD",

      visit_id: record.visit?._id || null,
      ipd_id: record._id,

      case_number: record.visit?.case_number || null,
      visit_date: record.visit?.visit_date || null,

      patient: {
        _id: record.patient?._id,
        patient_id: record.patient?.patient_id,
        name: record.patient?.name,
        age: record.patient?.age,
        gender: record.patient?.gender,
        mobile: record.patient?.mobile,
        religion: record.patient?.religion,
        visitCount: record.patient?.visitCount
      }
    }));


    // -------------------------
    // 3. Merge
    // -------------------------
    const data = [...opdCasualty, ...ipd];

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {
    console.error("Pathology Patient List Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message
    });
  }
};





// for ipd
exports.getAllPatients = async (req, res) => {
  try {
    // 🔹 1. Get all active IPD patients
    const admittedPatients = await IPD.find({ status: "ADMITTED" })
      .select("patient");

    const admittedPatientIds = admittedPatients.map(p => p.patient.toString());

    // 🔹 2. Get patients who already have ACTIVE bed (casualty)
    const activeAllocations = await BedAllocation.find({
      status: "ACTIVE"
    }).select("patient");

    const allocatedPatientIds = activeAllocations.map(a => a.patient.toString());

    // 🔹 3. Get visits (OPD + CASUALTY only)
    const visits = await Visit.find({
      visit_type: { $in: ["OPD", "CASUALTY"] },
      status: "ACTIVE"
    })
      .populate("patient")
      .sort({ createdAt: -1 });

    // 🔹 4. Filter
    const filtered = visits.filter(v => {
      const pid = v.patient?._id.toString();

      return (
        !admittedPatientIds.includes(pid) &&   // not in IPD
        !allocatedPatientIds.includes(pid)     // not already on bed
      );
    });

    // 🔹 5. Format response
    const data = filtered.map((visit) => ({
      visit_id: visit._id,
      case_number: visit.case_number,
      visit_date: visit.visit_date,

      patient_id: visit.patient?._id,
      patient_code: visit.patient?.patient_id,
      name: visit.patient?.name,
      age: visit.patient?.age,
      mobile: visit.patient?.mobile,
      religion: visit.patient?.religion,
      visitCount: visit.patient?.visitCount,
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });

  } catch (error) {
    console.error("Get Patients Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
    });
  }
};




exports.dischargeCasualtyPatient = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { visitId, dischargeTime } = req.body;

    if (!visitId || !dischargeTime) {
      throw new Error("visitId and dischargeTime are required");
    }

    // 🔹 1. Get Visit
    const visit = await Visit.findById(visitId).session(session);

    if (!visit) throw new Error("Visit not found");

    if (visit.visit_type !== "CASUALTY") {
      throw new Error("Only CASUALTY can be discharged here");
    }

    if (visit.status === "DISCHARGED") {
      throw new Error("Already discharged");
    }

    // 🔹 2. Get Allocation
    const allocation = await BedAllocation.findOne({
      visit: visitId,
      status: "ACTIVE"
    })
      .populate({
        path: "bed",
        populate: { path: "roomType" }
      })
      .session(session);

    if (!allocation) {
      throw new Error("No active bed allocation found");
    }

    const allocatedTime = new Date(allocation.allocated_at);
    const discharge = new Date(dischargeTime);

    if (discharge <= allocatedTime) {
      throw new Error("Invalid discharge time");
    }

    // 🔹 3. Calculate hours
    const totalHours = Math.ceil(
      (discharge - allocatedTime) / (1000 * 60 * 60)
    );

    const hourlyRate =
      allocation.bed?.roomType?.charges?.hourlyCharge || 0;

    const totalAmount = totalHours * hourlyRate;

    // 🔹 4. Close Allocation ✅ (FIXED)
    allocation.status = "RELEASED";   // ✅ NOT RELEASED
    allocation.released_at = discharge;
    allocation.total_timing = totalHours;

    await allocation.save({ session });

    // 🔹 5. Free Bed
    await Bed.findByIdAndUpdate(
      allocation.bed._id,
      { status: "AVAILABLE" },
      { session }
    );

    // 🔹 6. Update Visit
    visit.status = "DISCHARGED";
    visit.discharge_date = discharge;
    visit.discharge_time = discharge.toTimeString().split(" ")[0]; // ✅ FIXED
    visit.billing = {
      total_hours: totalHours,
      hourly_rate: hourlyRate,
      total_amount: totalAmount
    };

    await visit.save({ session });

    // 🔹 7. Commit
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Patient discharged successfully",
      data: {
        visit,
        billing: visit.billing
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


// Active opd patients

exports.getActiveOPDVisits = async (req, res) => {
  try {

    const opdVisits = await Visit.find({
      visit_type: "OPD",
      status: "ACTIVE"   // ✅ THIS IS WHAT YOU NEED
    })
      .populate({
        path: "patient",
        select: "patient_id name age gender mobile religion"
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: opdVisits.length,
      data: opdVisits.map(v => ({
        _id: v._id,
        case_number: v.case_number,
        visit_type: v.visit_type,
        doctor: v.doctor,
        status: v.status,
        visit_date: v.visit_date,

        address: v.address,
        billing: v.billing,
        visitNumber: v.visitNumber,

        patient: v.patient
      }))
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
