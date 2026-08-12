const mongoose = require("mongoose");


const PathoBill = require("../../Model/Pathology/PathoModel");
const PathologyTest = require("../../Model/Master/PathologyModel");
const Patient = require("../../Model/Hospital/PatientModel");

const {generatePathoBillId} = require("../../utils/HospitalHelper");


exports.createPathoBill = async (req, res) => {
  try {
    const {
      patient_id, // ObjectId from frontend
      tests,
      status = "PAID"
    } = req.body;

    // ✅ 1. Validation
    if (!patient_id || !tests || tests.length === 0) {
      return res.status(400).json({
        message: "Patient ID and tests are required"
      });
    }

    // ✅ 2. Validate patient ObjectId
    if (!mongoose.Types.ObjectId.isValid(patient_id)) {
      return res.status(400).json({
        message: "Invalid patient ID"
      });
    }

    // ✅ 3. Validate test ObjectIds
    const invalidTestIds = tests.filter(
      id => !mongoose.Types.ObjectId.isValid(id)
    );

    if (invalidTestIds.length > 0) {
      return res.status(400).json({
        message: "Invalid test IDs",
        invalidTestIds
      });
    }

    // ✅ 4. Find patient using _id
    const patient = await Patient.findById(patient_id);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found"
      });
    }

    // ✅ 5. Fetch test details
    const testDocs = await PathologyTest.find({
      _id: { $in: tests }
    });

    if (!testDocs.length) {
      return res.status(404).json({
        message: "No valid tests found"
      });
    }

    // ✅ 6. Prepare items + total
    let total_amount = 0;

    const items = testDocs.map(test => {
      total_amount += test.price;

      return {
        test_name: test.testName, 
        test_id: test._id,
        price: test.price
      };
    });

    // ✅ 7. Generate bill ID
    const bill_id = await generatePathoBillId();

    // ✅ 8. Save bill
    const savedBill = await PathoBill.create({
      bill_id,
      patient: patient._id,
      items,
      total_amount,
      status
    });

    // ✅ 9. Enrich response (patient + test names)
    const enrichedItems = items.map(item => {
      const test = testDocs.find(
        t => t._id.toString() === item.test_id.toString()
      );

      return {
        test_id: item.test_id,
      name: test?.testName || null,
        price: item.price
      };
    });

    // ✅ 10. Final Response
    res.status(201).json({
      message: "Pathology bill created successfully",
      bill: {
        _id: savedBill._id,
        bill_id: savedBill.bill_id,

        patient: {
          _id: patient._id,
          patient_id: patient.patient_id,   
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          mob:patient.mobile
        },

        items: enrichedItems,

        total_amount,
        status,
        date: savedBill.date,
        createdAt: savedBill.createdAt,
        updatedAt: savedBill.updatedAt
      }
    });

  } catch (error) {
    console.error("Patho Bill Error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};

// exports.createPathoBill = async (req, res) => {
//   try {
//     const {
//       patient_id,
//       tests, // array of test_ids
//       status = "PAID"
//     } = req.body;

//     //  Validation
//     if (!patient_id || !tests || tests.length === 0) {
//       return res.status(400).json({
//         message: "Patient ID and tests are required"
//       });
//     }

//     //  1. Find patient
//     const patient = await Patient.findOne({ patient_id });

//     if (!patient) {
//       return res.status(404).json({
//         message: "Patient not found"
//       });
//     }

//     // 🔍 2. Fetch test details
//     const testDocs = await PathologyTest.find({
//       _id: { $in: tests }
//     });

//     if (!testDocs.length) {
//       return res.status(404).json({
//         message: "No valid tests found"
//       });
//     }

//     // 🧮 3. Prepare items + total
//     let total_amount = 0;

//     const items = testDocs.map(test => {
//       total_amount += test.price;

//       return {
//         test_id: test._id,
//         name: test.name,
//         price: test.price
//       };
//     });

//     // 🔢 4. Generate bill ID
//     const bill_id = await generatePathoBillId(patient);

//     // 💾 5. Save bill
//     const bill = await PathoBill.create({
//       bill_id,
//       patient: patient._id,
//       items,
//       total_amount,
//       status
//     });

//     res.status(201).json({
//       message: "Pathology bill created successfully",
//       bill
//     });

//   } catch (error) {
//     console.error("Patho Bill Error:", error);

//     res.status(500).json({
//       message: "Server error",
//       error: error.message
//     });
//   }
// };




// exports.createPathoBill = async (req, res) => {
//   try {
//     const {
//       patient_id,
//       tests,
//       status = "PAID"
//     } = req.body;

//     // ✅ 1. Validation
//     if (!patient_id || !tests || tests.length === 0) {
//       return res.status(400).json({
//         message: "Patient ID and tests are required"
//       });
//     }

//     // ✅ 2. Find patient
//     const patient = await Patient.findOne({ patient_id });

//     if (!patient) {
//       return res.status(404).json({
//         message: "Patient not found"
//       });
//     }

//     // ✅ 3. Fetch test details
//     const testDocs = await PathologyTest.find({
//       _id: { $in: tests }
//     });

//     if (!testDocs.length) {
//       return res.status(404).json({
//         message: "No valid tests found"
//       });
//     }

//     // ✅ 4. Prepare items + total
//     let total_amount = 0;

//     const items = testDocs.map(test => {
//       total_amount += test.price;

//       return {
//         test_id: test._id,
//         name: test.name,
//         price: test.price
//       };
//     });

//     // ✅ 5. Generate bill ID (FIXED ✅)
//     const bill_id = await generatePathoBillId();

//     // ✅ 6. Save bill
//     const bill = await PathoBill.create({
//       bill_id,
//       patient: patient._id,
//       items,
//       total_amount,
//       status
//     });

//     // ✅ 7. Response
//     res.status(201).json({
//       message: "Pathology bill created successfully",
//       bill
//     });

//   } catch (error) {
//     console.error("Patho Bill Error:", error);

//     res.status(500).json({
//       message: "Server error",
//       error: error.message
//     });
//   }
// };



exports.getAllPathoBills = async (req, res) => {
  try {
    const bills = await PathoBill.find()
      .populate(
        "patient",
        "name patient_id age gender mobile"
      )
      .populate("items.test_id", "name price")
      .sort({ createdAt: -1 });

    res.json(bills);
  } catch (error) {
    console.error("Get Patho Bills Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};