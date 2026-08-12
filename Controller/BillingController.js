
const Bill = require("../Model/BillingModel");
const Inventory = require("../Model/InventoryModel");
const { generateBillNumber } = require("../utils/generatebillnumber");


// ==============================
// CREATE BILL
// ==============================



// exports.createBill = async (req, res) => {
//   try {

//     const {
//       created_by,
//       items,
//       payment_method,
//       subtotal,
//       total,
//       discount,
//       gst,
//       cgst,
//       sgst
//     } = req.body;

//     // ✅ Validation
//     if (!created_by) {
//       return res.status(400).json({ message: "created_by is required" });
//     }

//     if (!items || items.length === 0) {
//       return res.status(400).json({ message: "Items are required" });
//     }

//     // 🔁 Generate bill number
//     let newBill;
//     for (let i = 0; i < 3; i++) {
//       try {

//         const billNumber = await generateBillNumber();

//         newBill = await Bill.create({
//           bill_number: billNumber,
//           created_by,
//           items,

//           subtotal,
//           discount,
//           gst,
//           cgst,
//           sgst,
//           total,

//           payment_method
//         });

//         break;

//       } catch (err) {
//         if (err.code === 11000) continue;
//         throw err;
//       }
//     }

//     if (!newBill) {
//       return res.status(500).json({
//         message: "Failed to generate bill number"
//       });
//     }

//     // 🔥 STOCK DEDUCTION
//     for (const item of items) {
//       await Inventory.findByIdAndUpdate(
//         item.product_id,
//         {
//           $inc: { total_strips: -item.qty }
//         }
//       );
//     }

//     res.status(201).json({
//       message: "Bill created successfully",
//       bill: newBill
//     });

//   } catch (error) {

//     res.status(500).json({
//       message: "Internal server error",
//       error: error.message
//     });

//   }
// };

exports.createBill = async (req, res) => {
  try {

    const {
      created_by,

      patient_name,
      contact_number,
      patient_type,

      case_number,
      reg_no,
      prescribed_by,
      date,

      items,

      payment, //  from frontend

      subtotal,
      total,
      discount,
      gst,
      cgst,
      sgst
    } = req.body;

    // ✅ Validation
    if (!created_by) {
      return res.status(400).json({ message: "created_by is required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    // 🔁 Generate bill number
    let newBill;
    for (let i = 0; i < 3; i++) {
      try {

        const billNumber = await generateBillNumber();

        // 🔥 ENRICH ITEMS (batch + expiry)
        const enrichedItems = [];

        for (const item of items) {
          const inventory = await Inventory.findById(item.product_id);

          if (!inventory) {
            throw new Error(`Product not found for ID ${item.product_id}`);
          }

          enrichedItems.push({
            product_id: item.product_id,
            name: item.name,
            batch: inventory.batch_number,
            expiry: inventory.expiry_date,

            qty: item.qty,
            price: item.price,
            total: item.total
          });
        }

        newBill = await Bill.create({
          bill_number: billNumber,
          created_by,

          // 🔥 NEW FIELDS
          patient_name,
          contact_number,
          patient_type,

          case_number,
          reg_no,
          prescribed_by,
          date,

          items: enrichedItems,

          subtotal: Number(subtotal.toFixed(2)),
          discount,
          gst,
          cgst,
          sgst,
          total: Number(total.toFixed(2)),

          payment_method: payment // 🔥 FIX
        });

        break;

      } catch (err) {
        if (err.code === 11000) continue;
        throw err;
      }
    }

    if (!newBill) {
      return res.status(500).json({
        message: "Failed to generate bill number"
      });
    }

    // 🔥 STOCK DEDUCTION (TABLET LEVEL)
    for (const item of items) {

      await Inventory.findByIdAndUpdate(
        item.product_id,
        {
          $inc: {
            total_tablets: -item.qty // ✅ CORRECT
          }
        }
      );

    }

    res.status(201).json({
      message: "Bill created successfully",
      bill: newBill
    });

  } catch (error) {

    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });

  }
};


// ==============================
// GET ALL BILLS
// ==============================
exports.getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .sort({ createdAt: -1 })
      .populate("created_by", "name email");

    res.json(bills);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching bills" });
  }
};


// ==============================
// GET SINGLE BILL
// ==============================
exports.getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate("created_by", "name email");

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    res.json(bill);

  } catch (error) {
    res.status(500).json({ message: "Error fetching bill" });
  }
};


// ==============================
// UPDATE BILL (Optional)
// ==============================
exports.updateBill = async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    res.json({
      message: "Bill updated",
      bill,
    });

  } catch (error) {
    res.status(500).json({ message: "Error updating bill" });
  }
};


// ==============================
// DELETE BILL (Soft Delete Recommended)
// ==============================
exports.deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findByIdAndDelete(req.params.id);

    if (!bill) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    res.json({
      message: "Bill deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: "Error deleting bill" });
  }
};