const mongoose = require("mongoose");

const Patient = require("../../Model/Hospital/PatientModel");
const Bed = require("../../Model/Master/BedMasterModel");
const Visit = require("../../Model/Hospital/VisitModel");
const IPD = require("../../Model/Hospital/IPDModel");
const BedAllocation = require("../../Model/Hospital/BedAllocationModel");

const RoomType = require("../../Model/Master/RoomTypeModel");

const { generateIPDID ,calculateIPDBill,generateCaseNumber} = require("../../utils/HospitalHelper");







// ipd 
exports.createIPD = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { visit_id, bed_id, visit_date } = req.body;

    if (!visit_id || !bed_id) {
      throw new Error("visit_id and bed_id are required");
    }

    // 🔹 1. Time
    const admissionDateTime = visit_date
      ? new Date(visit_date)
      : new Date();

    // 🔹 2. Get original visit (OPD / CASUALTY)
    const visit = await Visit.findById(visit_id).session(session);
    if (!visit) throw new Error("Visit not found");

    if (visit.visit_type === "IPD") {
      throw new Error("This visit is already IPD");
    }

    const patient_id = visit.patient;

    // 🔹 3. Prevent duplicate IPD
    const existingIPD = await IPD.findOne({
      patient: patient_id,
      status: "ADMITTED"
    }).session(session);

    if (existingIPD) {
      throw new Error("Patient already admitted in IPD");
    }

    // 🔹 4. Close original visit (OPD / CASUALTY)
    visit.status = "DISCHARGED";
    visit.discharge_date = admissionDateTime;
    visit.discharge_time = admissionDateTime.toTimeString().split(" ")[0];
    await visit.save({ session });

    // 🔹 5. Allocate Bed
    const bed = await Bed.findOneAndUpdate(
      { _id: bed_id, status: "AVAILABLE" },
      { status: "OCCUPIED" },
      { new: true, session }
    );

    if (!bed) throw new Error("Bed not available");

    // 🔥 🔹 6. Generate Case Number (FIX)
    const case_number = await generateCaseNumber();

    // 🔹 7. Create NEW IPD Visit ✅
    const ipdVisit = await Visit.create([{
      case_number,  // ✅ FIX ADDED HERE
      patient: patient_id,
      visit_type: "IPD",
      doctor: visit.doctor,
      address: visit.address,
      visit_date: visit_date, 
      visitNumber: visit.visitNumber + 1,
      status: "ACTIVE"
    }], { session });

    // 🔹 8. Create IPD
    const ipd = await IPD.create([{
      ipd_id: await generateIPDID(),
      patient: patient_id,
      visit: ipdVisit[0]._id,
      case_from: visit.visit_type,
      bed: bed._id,
      admission_date: admissionDateTime,
      status: "ADMITTED"
    }], { session });

    // 🔹 9. Bed Allocation
    await BedAllocation.create([{
      bed: bed._id,
      patient: patient_id,
      visit: ipdVisit[0]._id,
      allocation_type: "IPD",
      status: "ACTIVE",
      allocated_at: admissionDateTime,
      ipd_admission: ipd[0]._id
    }], { session });

    // 🔹 10. Update patient visit count
    await Patient.findByIdAndUpdate(
      patient_id,
      { $inc: { visitCount: 1 } },
      { session }
    );

    // 🔹 11. Commit
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "IPD Admission Successful",
      data: ipd[0]
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

exports.getAllIPDPatients = async (req, res) => {
  try {

    // 🔹 1. Get all IPD visits
    const visits = await Visit.find({
      visit_type: "IPD"
    }).populate("patient");

    if (!visits.length) {
      return res.status(404).json({
        message: "No IPD patients found"
      });
    }

    // 🔹 2. Unique patient IDs
    const uniquePatientIds = [
      ...new Set(visits.map(v => v.patient._id.toString()))
    ];

    // 🔹 3. Fetch all data
    const patientsData = await Promise.all(
      uniquePatientIds.map(async (patientId) => {

        const [patient, patientVisits, bedAllocations, ipdAdmissions] =
          await Promise.all([

            Patient.findById(patientId),

            Visit.find({
              patient: patientId,
              visit_type: "IPD"
            }).sort({ createdAt: -1 }),

            BedAllocation.find({
              patient: patientId,
              allocation_type: "IPD"
            })
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
            allocation_id: b._id,

            bedNumber: b.bed?.bedNumber,

            roomType: b.bed?.roomType?.name,

            // 🔥 IPD charges (NOT hourly)
            bedCharge: b.bed?.roomType?.charges?.bedCharge || 0,
            nursingCare: b.bed?.roomType?.charges?.nursingCare || 0,
            doctorVisitCharge: b.bed?.roomType?.charges?.doctorVisitPerVisit || 0,
            visitsPerDay: b.bed?.roomType?.charges?.visitsPerDay || 0,

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



exports.getAllAdmittedIPDPatients = async (req, res) => {
  try {
    const ipdList = await IPD.find({ status: "ADMITTED" })
      .populate("patient")
      .populate("visit")
      .populate({
        path: "bed",
        populate: {
          path: "roomType"
        }
      })
      .sort({ admission_date: -1 });

    const data = ipdList.map((ipd) => ({
      ipd_id: ipd._id,
      ipd_code: ipd.ipd_id,

      // patient
      patient_id: ipd.patient?._id,
      patient_code: ipd.patient?.patient_id,
      name: ipd.patient?.name,
      age: ipd.patient?.age,
      gender: ipd.patient?.gender,
      mobile: ipd.patient?.mobile,

      // visit
      visit_id: ipd.visit?._id,
      visit_number: ipd.visit?.visitNumber,
      doctor: ipd.visit?.doctor,

      // admission
      case_from: ipd.case_from,
      admission_date: ipd.admission_date,

      // bed
      bed_id: ipd.bed?._id,
      bed_number: ipd.bed?.bedNumber,
      room_type: ipd.bed?.roomType?.name,

      status: ipd.status
    }));

    res.status(200).json({
      success: true,
      count: data.length,
      data
    });

  } catch (error) {
    console.error("IPD Fetch Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch IPD patients"
    });
  }
};



 


// calculate the bill 
// exports.calculateIPDBillAPI = async (req, res) => {
//   try {
//     const { ipdId, dischargeDate, discount = 0 } = req.body;

//     if (!ipdId) {
//       throw new Error("ipdId is required");
//     }

//     const now = dischargeDate ? new Date(dischargeDate) : new Date();

//     // 🔹 1. Get IPD
//     const ipd = await IPD.findById(ipdId)
//       .populate({
//         path: "bed",
//         populate: { path: "roomType" }
//       });

//     if (!ipd) {
//       throw new Error("IPD not found");
//     }

//     if (!ipd.admission_date) {
//       throw new Error("Admission date missing");
//     }

//     // 🔹 2. Get charges
//     const charges = ipd.bed?.roomType?.charges;

//     if (!charges) {
//       throw new Error("Room charges not configured");
//     }

//     // 🔥 3. Use YOUR FUNCTION (IMPORTANT)
//     const bill = calculateIPDBill(
//       ipd.admission_date,
//       now,
//       charges
//     );

//     // 🔹 4. Discount logic
//     const finalDiscount = Number(discount) || 0;

//     if (finalDiscount > bill.total_amount) {
//       throw new Error("Discount cannot exceed total amount");
//     }

//     const grand_total = bill.total_amount - finalDiscount;

//     // 🔹 5. Response ONLY (NO DB WRITE)
//     return res.status(200).json({
//       success: true,
//       data: {
//         ipdId,
//         admission_date: ipd.admission_date,
//         discharge_date: now,

//         total_days: bill.total_days,
//         daily_charge: bill.daily_charge,

//         breakdown: bill.breakdown,

//         total_amount: bill.total_amount,
//         discount: finalDiscount,
//         grand_total
//       }
//     });

//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: error.message
//     });
//   }
// };
/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// exports.calculateIPDBillAPI = async (req, res) => {
//   try {
//     const { ipdId, discharge_date, discount = 0 } = req.body;

//     if (!ipdId) throw new Error("ipdId is required");

//     const now = discharge_date ? new Date(discharge_date) : new Date();

//     const ipd = await IPD.findById(ipdId)
//       .populate("visit")
//       .populate({
//         path: "bed",
//         populate: { path: "roomType" }
//       });

//     if (!ipd) throw new Error("IPD not found");

//     const charges = ipd.bed?.roomType?.charges;
//     if (!charges) throw new Error("Room charges not configured");

//     const bill = calculateIPDBill(
//       ipd.admission_date,
//       now,
//       charges
//     );

//     const finalDiscount = Number(discount) || 0;

//     if (finalDiscount > bill.total_amount) {
//       throw new Error("Discount cannot exceed total amount");
//     }

//     const grand_total = bill.total_amount - finalDiscount;

//     // 🔥 SAVE INTO VISIT
//     await Visit.findByIdAndUpdate(ipd.visit._id, {
//       $set: {
//         "billing.billing_type": "IPD",

//         "billing.total_days": bill.total_days,
//         "billing.daily_charge": bill.daily_charge,

//         "billing.total_amount": bill.total_amount,
//         "billing.discount": finalDiscount,
//         "billing.grand_total": grand_total,

//         "billing.breakdown": bill.breakdown
//       }
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Billing stored successfully",
//       data: {
//         breakdown: bill.breakdown,
//         total_amount: bill.total_amount,
//         grand_total
//       }
//     });

//   } catch (error) {
//     return res.status(400).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

exports.calculateIPDBillAPI = async (req, res) => {

  try {

    console.log("\n================ IPD BILL START ================\n");

    console.log("BODY => ", req.body);

    const {
      ipdId,
      discharge_date,
      discharge_time,
      discount = 0
    } = req.body;

    console.log("\n[1] EXTRACTED VALUES");

    console.log("IPD ID => ", ipdId);

    console.log("DISCHARGE DATE => ", discharge_date);

    console.log("DISCHARGE TIME => ", discharge_time);

    console.log("DISCOUNT => ", discount);

    if (!ipdId) {
      throw new Error("ipdId is required");
    }

    // =====================================================
    // BUILD DISCHARGE DATETIME
    // =====================================================

    let now = new Date();

    if (discharge_date && discharge_time) {

      now = new Date(
        `${discharge_date}T${discharge_time}:00`
      );

    } else if (discharge_date) {

      now = new Date(discharge_date);
    }

    console.log("\n[2] FINAL DISCHARGE DATETIME");

    console.log("NOW => ", now);

    console.log("NOW ISO => ", now.toISOString());

    console.log("NOW TIMESTAMP => ", now.getTime());

    // =====================================================
    // FETCH IPD
    // =====================================================

    console.log("\n[3] FETCHING IPD...\n");

    const ipd = await IPD.findById(ipdId)
      .populate("visit")
      .populate({
        path: "bed",
        populate: {
          path: "roomType"
        }
      });

    if (!ipd) {
      throw new Error("IPD not found");
    }

    console.log("[3] IPD FOUND");

    console.log({
      ipd_id: ipd._id,

      admission_date: ipd.admission_date,

      admission_iso:
        ipd.admission_date?.toISOString?.(),

      visit: ipd.visit?._id,

      bed: ipd.bed?._id,

      roomType: ipd.bed?.roomType?._id
    });

    // =====================================================
    // CHECK CHARGES
    // =====================================================

    console.log("\n[4] CHECKING CHARGES...\n");

    const charges = ipd.bed?.roomType?.charges;

    console.log("CHARGES => ", charges);

    if (!charges) {
      throw new Error("Room charges not configured");
    }

    // =====================================================
    // DATE DIFFERENCE DEBUG
    // =====================================================

    console.log("\n[5] DATE DIFFERENCE DEBUG\n");

    const admissionDate = new Date(ipd.admission_date);

    console.log(
      "ADMISSION DATE => ",
      admissionDate
    );

    console.log(
      "ADMISSION ISO => ",
      admissionDate.toISOString()
    );

    console.log(
      "DISCHARGE DATE => ",
      now
    );

    console.log(
      "DISCHARGE ISO => ",
      now.toISOString()
    );

    const diffMs = now - admissionDate;

    const diffHours =
      diffMs / (1000 * 60 * 60);

    const diffDays =
      diffMs / (1000 * 60 * 60 * 24);

    console.log("DIFF MS => ", diffMs);

    console.log("DIFF HOURS => ", diffHours);

    console.log("DIFF DAYS RAW => ", diffDays);

    console.log(
      "DIFF DAYS CEIL => ",
      Math.ceil(diffDays)
    );

    // =====================================================
    // CALCULATE BILL
    // =====================================================

    console.log("\n[6] CALCULATING BILL...\n");

    const bill = calculateIPDBill(
      ipd.admission_date,
      now,
      charges
    );

    console.log("BILL RESULT => ", bill);

    // =====================================================
    // DISCOUNT
    // =====================================================

    console.log("\n[7] APPLYING DISCOUNT...\n");

    const finalDiscount =
      Number(discount) || 0;

    console.log(
      "FINAL DISCOUNT => ",
      finalDiscount
    );

    if (finalDiscount > bill.total_amount) {
      throw new Error(
        "Discount cannot exceed total amount"
      );
    }

    const grand_total =
      bill.total_amount - finalDiscount;

    console.log(
      "GRAND TOTAL => ",
      grand_total
    );

    // =====================================================
    // UPDATE VISIT
    // =====================================================

    console.log("\n[8] UPDATING VISIT...\n");

    const updateResult =
      await Visit.findByIdAndUpdate(
        ipd.visit._id,
        {
          $set: {

            "billing.billing_type":
              "IPD",

            "billing.total_days":
              bill.total_days,

            "billing.daily_charge":
              bill.daily_charge,

            "billing.total_amount":
              bill.total_amount,

            "billing.discount":
              finalDiscount,

            "billing.grand_total":
              grand_total,

            "billing.breakdown":
              bill.breakdown
          }
        },
        {
          returnDocument: "after"
        }
      );

    console.log(
      "VISIT UPDATE RESULT => ",
      updateResult?._id
    );

    console.log("\n================ SUCCESS ================\n");

    return res.status(200).json({
      success: true,
      message: "Billing stored successfully",
      data: {
        breakdown: bill.breakdown,
        total_days: bill.total_days,
        daily_charge: bill.daily_charge,
        total_amount: bill.total_amount,
        grand_total
      }
    });

  } catch (error) {

    console.log(
      "\nXXXXXXXXXXXXXXXX ERROR XXXXXXXXXXXXXXXX\n"
    );

    console.log("MESSAGE => ", error.message);

    console.log("FULL ERROR => ", error);

    console.log("STACK => ", error.stack);

    console.log(
      "\nXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n"
    );

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};





// make the patient discharge from IPD 
// exports.dischargeIPDPatient = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const { ipdId, dischargeDate } = req.body;

//     if (!ipdId) {
//       throw new Error("ipdId is required");
//     }

//     const now = dischargeDate ? new Date(dischargeDate) : new Date();

//     // 🔹 1. Get IPD
//     const ipd = await IPD.findById(ipdId)
//       .populate("bed")
//       .session(session);

//     if (!ipd) {
//       throw new Error("IPD record not found");
//     }

//     if (ipd.status !== "ADMITTED") {
//       throw new Error("Patient already discharged or invalid");
//     }

//     // 🔹 2. Get Visit
//     const visit = await Visit.findById(ipd.visit).session(session);
//     if (!visit) {
//       throw new Error("Visit not found");
//     }

//     // 🔹 3. Get Active Bed Allocation
//     const allocation = await BedAllocation.findOne({
//       ipd_admission: ipd._id,
//       status: "ACTIVE"
//     }).session(session);

//     if (!allocation) {
//       throw new Error("No active bed allocation found");
//     }

//     // 🔹 4. DISCHARGE IPD
//     ipd.status = "DISCHARGED";
//     ipd.discharge_date = now;
//     await ipd.save({ session });

//     // 🔹 5. DISCHARGE VISIT
//     visit.status = "DISCHARGED";
//     visit.discharge_date = now;
//     visit.discharge_time = now.toTimeString().split(" ")[0];

//     await visit.save({ session });

//     // 🔹 6. RELEASE BED ALLOCATION
//     allocation.status = "RELEASED";
//     allocation.released_at = now;
//     await allocation.save({ session });

//     // 🔹 7. FREE BED
//     await Bed.findByIdAndUpdate(
//       ipd.bed._id,
//       { status: "AVAILABLE" },
//       { session }
//     );

//     // 🔹 8. COMMIT TRANSACTION
//     await session.commitTransaction();
//     session.endSession();

//     res.status(200).json({
//       success: true,
//       message: "IPD patient discharged successfully",
//       data: {
//         ipd_id: ipd._id,
//         patient: ipd.patient,
//         status: "DISCHARGED"
//       }
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();

//     res.status(400).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

exports.dischargeIPDPatient = async (req, res) => {

  try {

    console.log("\n================ DISCHARGE START ================");

    console.log("BODY => ", req.body);

    const {
      ipdId,
      discharge_date,
      discharge_time
    } = req.body;

    if (!ipdId) {
      throw new Error("ipdId is required");
    }

    // =====================================================
    // DATE TIME
    // =====================================================

    let now = new Date();

    if (discharge_date && discharge_time) {

      now = new Date(
        `${discharge_date}T${discharge_time}:00`
      );
    }

    console.log("NOW => ", now);

    // =====================================================
    // 1. GET IPD
    // =====================================================

    console.log("\n[1] Fetching IPD...");

    const ipd = await IPD.findById(ipdId);

    if (!ipd) {
      throw new Error("IPD record not found");
    }

    console.log("[1] IPD FOUND => ", {
      id: ipd._id,
      status: ipd.status,
      bed: ipd.bed,
      visit: ipd.visit
    });

    if (ipd.status !== "ADMITTED") {
      throw new Error("Patient already discharged");
    }

    // =====================================================
    // 2. UPDATE IPD
    // =====================================================

    console.log("\n[2] Updating IPD...");

    await IPD.updateOne(
      { _id: ipd._id },
      {
        $set: {
          status: "DISCHARGED",
          discharge_date: now
        }
      }
    );

    console.log("[2] IPD UPDATED");

    // =====================================================
    // 3. UPDATE VISIT
    // =====================================================

    console.log("\n[3] Updating Visit...");

    await Visit.updateOne(
      { _id: ipd.visit },
      {
        $set: {
          status: "DISCHARGED",
          discharge_date: now,
          discharge_time
        }
      }
    );

    console.log("[3] VISIT UPDATED");

    // =====================================================
    // 4. RELEASE ALLOCATION
    // =====================================================

    console.log("\n[4] Releasing Allocation...");

    await BedAllocation.updateOne(
      {
        ipd_admission: ipd._id,
        status: "ACTIVE"
      },
      {
        $set: {
          status: "RELEASED",
          released_at: now
        }
      }
    );

    console.log("[4] ALLOCATION RELEASED");

    // =====================================================
    // 5. FREE BED
    // =====================================================

    console.log("\n[5] Updating Bed Status...");

    await Bed.updateOne(
      { _id: ipd.bed },
      {
        $set: {
          status: "AVAILABLE"
        }
      }
    );

    console.log("[5] BED FREED");

    console.log("\n================ SUCCESS ================\n");

    return res.status(200).json({
      success: true,
      message: "IPD patient discharged successfully",
      data: {
        ipd_id: ipd._id,
        status: "DISCHARGED"
      }
    });

  } catch (error) {

    console.log("\nXXXXXXXXXXXXXXXX ERROR XXXXXXXXXXXXXXXX");

    console.log(error);

    console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n");

    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};




// Get discharged IPD patients with filters and pagination
exports.getDischargedIPDPatients = async (req, res) => {
  try {
    const { page = 1, limit = 10, from, to, search } = req.query;

    const query = {
      status: "DISCHARGED"
    };

    // 🔹 Date filter (from IPD discharge_date)
    if (from || to) {
      query.discharge_date = {};
      if (from) query.discharge_date.$gte = new Date(from);
      if (to) query.discharge_date.$lte = new Date(to);
    }

    const ipdData = await IPD.find(query)
      .populate({
        path: "patient",
        select: "patient_id name age gender mobile religion"
      })
      .populate({
        path: "visit",
        select: "case_number doctor billing discharge_time address"
      })
      .populate({
        path: "bed",
        select: "bed_number"
      })
      .sort({ discharge_date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // 🔹 Optional search (by patient name / mobile)
    const filtered = search
      ? ipdData.filter(item =>
          item.patient?.name?.toLowerCase().includes(search.toLowerCase()) ||
          item.patient?.mobile?.includes(search)
        )
      : ipdData;

    const total = await IPD.countDocuments(query);

    res.status(200).json({
      success: true,
      count: filtered.length,
      total,
      page: Number(page),
      data: filtered.map(item => ({
        ipd_id: item._id,   // ✅ CHANGED HERE (ObjectId instead of custom ID)
        admission_date: item.admission_date,
        discharge_date: item.discharge_date,

        patient: item.patient,

        visit: {
          case_number: item.visit?.case_number,
          doctor: item.visit?.doctor,
          billing: item.visit?.billing,
          discharge_time: item.visit?.discharge_time,
          address: item.visit?.address

        },

        bed: item.bed
      }))
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


