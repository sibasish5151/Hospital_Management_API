const Medicine = require("../Model/MedicineModel");
const Inventory = require("../Model/InventoryModel");
const Supplier = require("../Model/Master/SupplierModel");
const Bill = require("../Model/BillingModel");
  

// exports.addStock = async (req, res) => {
//   try {
//     const {
//       supplier,
//       invoice_number,
//       items
//     } = req.body;

//     // 1. Basic validation
//     if (!supplier || !invoice_number || !items?.length) {
//       return res.status(400).json({
//         message: "Supplier, invoice and items are required"
//       });
//     }

//     // 2. Validate supplier once
//     const supplierDoc = await Supplier.findById(supplier);
//     if (!supplierDoc) {
//       return res.status(404).json({
//         message: "Supplier not found"
//       });
//     }

//     const results = [];
//     const errors = [];

//     // 3. Loop all medicines
//     for (let i = 0; i < items.length; i++) {
//       const item = items[i];

//       try {
//         const {

  
//           medicine,
//           medicine_name,
//           type,
//           manufacturer,

//           batch_number,
//           expiry_date,

//           boxes,
//           strips_per_box,
//           tablets_per_strip,

//           purchase_price,
//           selling_price,

//           gst,
//           gst_percent,
//           discount
//         } = item;

//         // 🔹 Resolve Medicine
//         let medicineId = medicine;

//         if (!medicineId) {
//           if (!medicine_name || !type) {
//             throw new Error("Medicine details missing");
//           }

//           let medicineDoc = await Medicine.findOne({
//             name: medicine_name.trim(),
//             type,
//             manufacturer
//           });

//           if (!medicineDoc) {
//             medicineDoc = await Medicine.create({
//               name: medicine_name,
//               type,
//               manufacturer
//             });
//           }

//           medicineId = medicineDoc._id;
//         }

//         // 🔹 Required validation
//         if (!batch_number || !expiry_date || !purchase_price || !selling_price || !tablets_per_strip) {
//           throw new Error("Required fields missing");
//         }

//         // 🔹 Safe calculations
//         const safeBoxes = Number(boxes) || 0;
//         const safeStrips = Number(strips_per_box) || 0;
//         const safeTabs = Number(tablets_per_strip) || 0;

//         const total_strips = safeBoxes * safeStrips;
//         const total_tablets = total_strips * safeTabs;

//         const cost_per_tablet = safeTabs
//           ? +(purchase_price / safeTabs).toFixed(2)
//           : 0;

//         const selling_per_tablet = safeTabs
//           ? +(selling_price / safeTabs).toFixed(2)
//           : 0;

//         const safeGst = gst ?? gst_percent ?? 0;
//         const safeDiscount = discount === "" ? 0 : Number(discount) || 0;

      

//         // 🔹 Save (IMPORTANT: invoice added)
//         const inventory = await Inventory.create({
//           code,
//           medicine: medicineId,
//           supplier,

//           invoice_number,

//           batch_number,
//           expiry_date: new Date(expiry_date),

//           boxes: safeBoxes,
//           strips_per_box: safeStrips,
//           tablets_per_strip: safeTabs,

//           total_strips,
//           total_tablets,

//           purchase_price: Number(purchase_price),
//           selling_price: Number(selling_price),

//           cost_per_tablet,
//           selling_per_tablet,

//           gst: Number(safeGst),
//           discount: safeDiscount
//         });

//         results.push(inventory);

//       } catch (err) {
//         errors.push({
//           row: i + 1,
//           error: err.message
//         });
//       }
//     }

//     // 4. Final response
//     res.status(201).json({
//       message: "Bulk stock processed",
//       success_count: results.length,
//       error_count: errors.length,
//       errors
//     });

//   } catch (error) {
//     console.error("Bulk Stock Error:", error);

//     res.status(500).json({
//       message: "Server Error",
//       error: error.message
//     });
//   }
// };



//get inventory by code



//      CHECK FOR THE BARCODE FIELDS AND ALSO CHECK FOR CODE FIELDS FROM PREVIOUS CODE 
exports.addStock = async (req, res) => {
  try {
    const { supplier, invoice_number, items } = req.body;

    // 1. Basic validation
    if (!supplier || !invoice_number || !items?.length) {
      return res.status(400).json({
        message: "Supplier, invoice and items are required"
      });
    }

    // 2. Validate supplier
    const supplierDoc = await Supplier.findById(supplier);
    if (!supplierDoc) {
      return res.status(404).json({
        message: "Supplier not found"
      });
    }

    // 3. Check duplicate codes (bulk)
    const codes = items.map(i => i.code).filter(Boolean);

    const existingCodes = await Inventory.find({
      code: { $in: codes }
    }).select("code");

    const existingCodeSet = new Set(existingCodes.map(i => i.code));

    const results = [];
    const errors = [];

    // 4. Loop through items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        const {
          code,

          medicine,
          medicine_name,
          type,
          manufacturer,

          batch_number,
          expiry_date,

          boxes,
          strips_per_box,
          tablets_per_strip,

          purchase_price,
          selling_price,

          gst,
          gst_percent,
          discount
        } = item;

        // Code validation
        if (!code) throw new Error("Code is required");
        if (existingCodeSet.has(code)) throw new Error("Code already exists");

        // Resolve medicine
        let medicineId = medicine;

        if (!medicineId) {
          if (!medicine_name || !type) {
            throw new Error("Medicine details missing");
          }

          let medicineDoc = await Medicine.findOne({
            name: medicine_name.trim(),
            type,
            manufacturer
          });

          if (!medicineDoc) {
            medicineDoc = await Medicine.create({
              name: medicine_name,
              type,
              manufacturer
            });
          }

          medicineId = medicineDoc._id;
        }

        // Required validation
        if (
          !batch_number ||
          !expiry_date ||
          !purchase_price ||
          !selling_price ||
          !tablets_per_strip
        ) {
          throw new Error("Required fields missing");
        }

        // Calculations
        const safeBoxes = Number(boxes) || 0;
        const safeStrips = Number(strips_per_box) || 0;
        const safeTabs = Number(tablets_per_strip) || 0;

        const total_strips = safeBoxes * safeStrips;
        const total_tablets = total_strips * safeTabs;

        const cost_per_tablet = safeTabs
          ? +(purchase_price / safeTabs).toFixed(2)
          : 0;

        const selling_per_tablet = safeTabs
          ? +(selling_price / safeTabs).toFixed(2)
          : 0;

        const safeGst = gst ?? gst_percent ?? 0;
        const safeDiscount =
          discount === "" ? 0 : Number(discount) || 0;

        // Save
        const inventory = await Inventory.create({
          code,
          medicine: medicineId,
          supplier,

          invoice_number,

          batch_number,
          expiry_date: new Date(expiry_date),

          boxes: safeBoxes,
          strips_per_box: safeStrips,
          tablets_per_strip: safeTabs,

          total_strips,
          total_tablets,

          purchase_price: Number(purchase_price),
          selling_price: Number(selling_price),

          cost_per_tablet,
          selling_per_tablet,

          gst: Number(safeGst),
          discount: safeDiscount
        });

        results.push(inventory);

      } catch (err) {
        errors.push({
          row: i + 1,
          error: err.message
        });
      }
    }

    // Final response
    res.status(201).json({
      message: "Bulk stock processed",
      success_count: results.length,
      error_count: errors.length,
      errors
    });

  } catch (error) {
    console.error("Bulk Stock Error:", error);

    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};


exports.getInventoryByCode = async (req, res) => {

  try {

    const { code } = req.params;

    const inventory = await Inventory.findOne({ code })
      .populate("medicine")
      .populate("supplier");

    if (!inventory) {
      return res.status(404).json({
        message: "Medicine not found"
      });
    }

    res.json({

      id: inventory._id,
      code: inventory.code,
      name: inventory.medicine.name,
      type: inventory.medicine.type,
      manufacturer: inventory.medicine.manufacturer,

      supplier: inventory.supplier.name,

      batch_number: inventory.batch_number,
      expiry_date: inventory.expiry_date,

      boxes: inventory.boxes,
      strips_per_box: inventory.strips_per_box,
      total_strips: inventory.total_strips,

      purchase_price: inventory.purchase_price,
      selling_price: inventory.selling_price
    });

  } catch (error) {

    res.status(500).json({
      message: "Server Error",
      error: error.message
    });

  }

};


//get all inventory

exports.getAllInventory = async (req, res) => {
  try {

    const inventory = await Inventory.find()
      .populate("medicine")
      .populate("supplier")
      .sort({ createdAt: -1 });

    const formattedData = inventory.map(item => ({


       id: inventory._id,
      // id: item._id,
      code: item.code,
      medicine_name: item.medicine.name,
      type: item.medicine.type,
      manufacturer: item.medicine.manufacturer,

      supplier: item.supplier ? item.supplier.name : null,

      batch_number: item.batch_number,
      expiry_date: item.expiry_date,

      boxes: item.boxes,
      strips_per_box: item.strips_per_box,
      total_strips: item.total_strips,

      purchase_price: item.purchase_price,
      selling_price: item.selling_price
    }));

    res.json(formattedData);

  } catch (error) {

    res.status(500).json({
      message: "Server error",
      error: error.message
    });

  }
};


//search medicine by name

exports.searchMedicineByName = async (req, res) => {
  try {

    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        message: "Medicine name required"
      });
    }

    const medicines = await Medicine.find({
      name: { $regex: "^" + name, $options: "i" }
    });

    const medicineIds = medicines.map(m => m._id);

    const inventory = await Inventory.find({
      medicine: { $in: medicineIds }
    })
    .populate("medicine")
    .populate("supplier");

    res.json(inventory);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }
};



// get expiry medicines         // remove the console.log
exports.getExpiryMedicines = async (req, res) => {
  try {
    console.log("👉 req.query:", req.query);

    const date = req.query.date; // ✅ FIXED

    console.log("📥 Input date:", date);

    if (!date) {
      return res.status(400).json({ message: "Date is required" });
    }

    const [day, month, year] = date.split("/");
    const selectedDate = new Date(`${year}-${month}-${day}T23:59:59.999Z`);

    console.log("📅 Converted Date:", selectedDate);

    const inventories = await Inventory.find({
      expiry_date: { $lte: selectedDate }
    })
    .populate({
      path: "medicine",
      select: "name type manufacturer"
    })
    .populate({
      path: "supplier",
      select: "name"
    });

    res.status(200).json({
      message: "Expiry medicines fetched",
      count: inventories.length,
      data: inventories

    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};




// get low stock alert
exports.getLowStock = async (req, res) => {
  try {
    // 1. Get threshold from query OR default = 50
    const threshold = req.query.threshold
      ? Number(req.query.threshold)
      : 50;

    console.log("👉 Threshold:", threshold);

    // 2. Fetch medicines with low stock
    const lowStockItems = await Inventory.find({
    total_strips: { $lte: threshold }
    })
    .sort({ total_strips: 1 })
    .populate({
      path: "medicine",
      select: "name type brand composition",
      populate: {
        path: "type",
        select: "name"
      }
    })
    .populate({
      path: "supplier",
      select: "name"
    });
   
    // lowest first

    // 3. Send response
    res.status(200).json({
      message: "Low stock medicines fetched",
      threshold,
      count: lowStockItems.length,
      data: lowStockItems
    });

  } catch (error) {
    console.error("Low Stock Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};




exports.getDashboard = async (req, res) => {
  try {
    const threshold = 50;
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    // 1. Summary
    const totalSales = await Bill.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$grand_total" },
          count: { $sum: 1 }
        }
      }
    ]);

    const lowStockCount = await Inventory.countDocuments({
      total_strips: { $lte: threshold }
    });

    const expiryCount = await Inventory.countDocuments({
      expiry_date: { $lte: next30Days }
    });

    // 2. Low Stock Preview
    const lowStock = await Inventory.find({
      total_strips: { $lte: threshold }
    })
      .sort({ total_strips: 1 })
      .limit(5)
      .populate("medicine", "name");

    // 3. Expiry Preview
    const expiry = await Inventory.find({
      expiry_date: { $lte: next30Days }
    })
      .sort({ expiry_date: 1 })
      .limit(5)
      .populate("medicine", "name");

    // 4. Monthly Sales
    const monthlySales = await Bill.aggregate([
      {
        $group: {
          _id: { month: { $month: "$date" } },
          total: { $sum: "$grand_total" }
        }
      }
    ]);

    // 5. Top Selling
    const topSelling = await Bill.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product_id",
          qty: { $sum: "$items.qty" }
        }
      },
      { $sort: { qty: -1 } },
      { $limit: 5 }
    ]);

    // 6. Recent Bills
    const recentBills = await Bill.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("bill_number grand_total createdAt");

    res.status(200).json({
      summary: {
        totalSales: totalSales[0]?.total || 0,
        totalBills: totalSales[0]?.count || 0,
        lowStockCount,
        expiryCount
      },
      lowStock,
      expiry,
      monthlySales,
      topSelling,
      recentBills
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};





exports.getallinvoice = async (req, res) => {
  try {

    const limit = Number(req.query.limit) || 10;

    const invoices = await Inventory.aggregate([

      {
        $match: {
          invoice_number: { $exists: true, $ne: null }
        }
      },

      // 🔥 Join medicine
      {
        $lookup: {
          from: "medicines",
          localField: "medicine",
          foreignField: "_id",
          as: "medicine"
        }
      },
      { $unwind: "$medicine" },

      // 🔥 Join supplier
      {
        $lookup: {
          from: "suppliers",
          localField: "supplier",
          foreignField: "_id",
          as: "supplier"
        }
      },
      { $unwind: "$supplier" },

      // 🔥 Group by invoice
      {
        $group: {
          _id: "$invoice_number",

          createdAt: { $max: "$createdAt" },

          supplier: { $first: "$supplier" },

          medicines: {
            $push: {
              code: "$code",

              medicine_name: "$medicine.name",
              type: "$medicine.type",
              manufacturer: "$medicine.manufacturer",

              batch_number: "$batch_number",
              expiry_date: "$expiry_date",

              boxes: "$boxes",
              strips_per_box: "$strips_per_box",
              tablets_per_strip: "$tablets_per_strip",

              total_strips: "$total_strips",
              total_tablets: "$total_tablets",

              purchase_price: "$purchase_price",
              selling_price: "$selling_price",

              cost_per_tablet: "$cost_per_tablet",
              selling_per_tablet: "$selling_per_tablet",

              gst: "$gst",
              discount: "$discount"
            }
          },

          total_items: { $sum: 1 }
        }
      },

      // 🔥 Sort latest first
      { $sort: { createdAt: -1 } },

      // 🔥 Limit
      { $limit: limit },

      // 🔥 Clean response
      {
        $project: {
          _id: 0,
          invoice_number: "$_id",
          createdAt: 1,

          supplier: {
            name: "$supplier.name",
            phone: "$supplier.phone",
            email: "$supplier.email",
            address: "$supplier.address",
            gst_number: "$supplier.gst_number"
          },

          total_items: 1,
          medicines: 1
        }
      }

    ]);

    res.status(200).json({
      message: "All invoices fetched successfully",
      count: invoices.length,
      data: invoices
    });

  } catch (error) {
    console.error("Get All Invoices Error:", error);

    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};






