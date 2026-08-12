const PathologyTest = require("../../Model/Master/PathologyModel");

// ======================================
// CREATE PATHOLOGY TEST
// ======================================
exports.createTest = async (req, res) => {
  try {
    const {
      department,
      profile,
      section,
      testCode,
      testName,
      shortName,
      description,
      method,
      unit,
      price,
      discountPrice,
      inputType,
      references,
      displayOrder,
      remarks,
   
    } = req.body;

    // =========================
    // Required Field Validation
    // =========================
    if (!department ||  !testName || price == null ) {
      return res.status(400).json({
        success: false,
        message:
          "Department, Test Name and Price are required."
      });
    }

    // =========================
    // Price Validation
    // =========================
    if (price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative."
      });
    }

   

    // =========================
    // Create Test
    // =========================
    const pathologyTest = await PathologyTest.create({
      department: department.trim(),
      profile: profile.trim(),
      section: section?.trim() || "",

      testCode: testCode?.trim(),

      testName: testName.trim(),
      shortName: shortName?.trim() || "",
      description: description?.trim() || "",

      method: method?.trim() || "",
      unit: unit?.trim() || "",

      price,
      discountPrice: discountPrice || 0,

      inputType,

      references: references || [],

      displayOrder: displayOrder || 0,

      remarks: remarks?.trim() || "",

     
    });

    return res.status(201).json({
      success: true,
      message: "Pathology Test created successfully.",
      data: pathologyTest
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message
    });
  }
};





// ======================================
// GET ALL PATHOLOGY TESTS
// ======================================
exports.getAllTests = async (req, res) => {
  try {
    const tests = await PathologyTest.find().sort({
      department: 1,
      profile: 1,
      displayOrder: 1,
      testName: 1,
    });

    return res.status(200).json({
      success: true,
      count: tests.length,
      data: tests,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message,
    });
  }
};



// // ======================================
// // SEARCH PATHOLOGY TESTS
// // ======================================
// exports.searchTests = async (req, res) => {
//   try {

//     const { search } = req.query;

//     if (!search || !search.trim()) {
//       return res.status(400).json({
//         success: false,
//         message: "Search keyword is required."
//       });
//     }

//     const keyword = search.trim();

//     const tests = await PathologyTest.find({
//       status: "ACTIVE",
//       $or: [
//         {
//           testName: {
//             $regex: keyword,
//             $options: "i"
//           }
//         },
//         {
//           shortName: {
//             $regex: keyword,
//             $options: "i"
//           }
//         },
//         {
//           testCode: {
//             $regex: keyword,
//             $options: "i"
//           }
//         }
//       ]
//     })
//       .sort({
//         department: 1,
//         profile: 1,
//         displayOrder: 1,
//         testName: 1
//       })
//       .limit(20);

//     return res.status(200).json({
//       success: true,
//       count: tests.length,
//       data: tests
//     });

//   } catch (error) {

//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong.",
//       error: error.message
//     });

//   }
// };



// // ======================================
// // GET SINGLE PATHOLOGY TEST
// // ======================================
// exports.getTestById = async (req, res) => {
//   try {

//     const { id } = req.params;

//     const test = await PathologyTest.findById(id);

//     if (!test) {
//       return res.status(404).json({
//         success: false,
//         message: "Pathology Test not found."
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       data: test
//     });

//   } catch (error) {

//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong.",
//       error: error.message
//     });

//   }
// };


// ======================================
// UPDATE PATHOLOGY TEST
// ======================================
exports.updateTest = async (req, res) => {
  try {

    const { id } = req.params;

    const test = await PathologyTest.findById(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Pathology Test not found."
      });
    }

    const {
      department,
      profile,
      section,
      testCode,
      testName,
      shortName,
      description,
      method,
      unit,
      price,
      discountPrice,
      inputType,
      references,
      displayOrder,
      remarks,
      
    } = req.body;

    // =========================
    // Price Validation
    // =========================
    if (price !== undefined && price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price cannot be negative."
      });
    }

    // =========================
    // Duplicate Test Name Check
    // =========================
    if (testName) {

      const existingTest = await PathologyTest.findOne({
        _id: { $ne: id },
        testName: testName.trim()
      }).collation({ locale: "en", strength: 2 });

      if (existingTest) {
        return res.status(400).json({
          success: false,
          message: "Test Name already exists."
        });
      }
    }

    // =========================
    // Duplicate Test Code Check
    // =========================
    if (testCode) {

      const existingCode = await PathologyTest.findOne({
        _id: { $ne: id },
        testCode: testCode.trim()
      });

      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: "Test Code already exists."
        });
      }
    }

    // =========================
    // Update Fields
    // =========================
    if (department !== undefined) test.department = department.trim();
    if (profile !== undefined) test.profile = profile.trim();
    if (section !== undefined) test.section = section.trim();

    if (testCode !== undefined) test.testCode = testCode.trim();

    if (testName !== undefined) test.testName = testName.trim();
    if (shortName !== undefined) test.shortName = shortName.trim();
    if (description !== undefined) test.description = description.trim();

    if (method !== undefined) test.method = method.trim();
    if (unit !== undefined) test.unit = unit.trim();

    if (price !== undefined) test.price = price;
    if (discountPrice !== undefined) test.discountPrice = discountPrice;

    if (inputType !== undefined) test.inputType = inputType;

    if (references !== undefined) test.references = references;

    if (displayOrder !== undefined) test.displayOrder = displayOrder;

    if (remarks !== undefined) test.remarks = remarks.trim();


    await test.save();

    return res.status(200).json({
      success: true,
      message: "Pathology Test updated successfully.",
      data: test
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate value found."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong.",
      error: error.message
    });

  }
};




// ======================================
// DELETE (SOFT DELETE)
// ======================================
exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await PathologyTest.findById(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: "Pathology Test not found.",
      });
    }

    if (test.status === "INACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Pathology Test is already inactive.",
      });
    }

    test.status = "INACTIVE";
    await test.save();

    return res.status(200).json({
      success: true,
      message: "Pathology Test deactivated successfully.",
      data: test,
    });
  } catch (error) {
    console.error("Delete Test Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error.",
      error: error.message,
    });
  }
};