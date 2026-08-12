const IPDPharma = require("../../Model/Hospital/IPDBillingModel");
const Inventory = require("../../Model/InventoryModel");
const IPD = require("../../Model/Hospital/IPDModel");
const PathoBill = require("../../Model/Pathology/PathoModel");


exports.addIPDMedicine = async (req, res) => {
  try {
    const { ipd_id, patient_id, visit_id, date, items, paid = 0 } = req.body;

    if (!ipd_id || !patient_id || !items || items.length === 0) {
      return res.status(400).json({
        message: "ipd_id, patient_id and items are required"
      });
    }

    // 🔍 Find existing billing or create new
    let billing = await IPDPharma.findOne({ ipd: ipd_id });

    if (!billing) {
      billing = await IPDPharma.create({
        patient: patient_id,
        visit: visit_id,
        ipd: ipd_id,
        days: []
      });
    }

    // 🔥 ENRICH ITEMS + CALCULATE TOTAL
    let enrichedItems = [];
    let newDayTotal = 0;

    for (const item of items) {
      const inventory = await Inventory.findById(item.product_id);

      if (!inventory) {
        throw new Error(`Inventory not found for ID ${item.product_id}`);
      }

      const total = item.qty * item.price;
      newDayTotal += total;

      enrichedItems.push({
        product_id: item.product_id,
        name: item.name,
        batch: inventory.batch_number,
        expiry: inventory.expiry_date,
        qty: item.qty,
        price: item.price,
        total
      });

      // 🔥 STOCK DEDUCTION
      await Inventory.findByIdAndUpdate(item.product_id, {
        $inc: { total_tablets: -item.qty }
      });
    }

    const entryDate = new Date(date);

    // 🔍 Check if same date already exists
    const existingDay = billing.days.find(d =>
      new Date(d.date).toDateString() === entryDate.toDateString()
    );

    if (existingDay) {
      // 👉 Append items
      existingDay.items.push(...enrichedItems);

      // 👉 Recalculate totals
      existingDay.total += newDayTotal;
      existingDay.paid += paid;
      existingDay.due = existingDay.total - existingDay.paid;

    } else {
      // 👉 Create new day
      billing.days.push({
        date: entryDate,
        items: enrichedItems,
        total: newDayTotal,
        paid: paid,
        due: newDayTotal - paid
      });
    }

    // 🔥 RECALCULATE GRAND TOTALS
    let grandTotal = 0;
    let totalPaid = 0;

    billing.days.forEach(day => {
      grandTotal += day.total;
      totalPaid += day.paid;
    });

    billing.grand_total = grandTotal;
    billing.total_paid = totalPaid;
    billing.total_due = grandTotal - totalPaid;

    // 🔥 STATUS UPDATE
    billing.status = billing.total_due === 0 ? "PAID" : "UNPAID";

    await billing.save();

    res.status(200).json({
      message: "Medicine added to IPD billing",
      billing
    });

  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};



exports.getPatientIPDPharma = async (req, res) => {
  try {
    const { patient_id } = req.params;

    if (!patient_id) {
      return res.status(400).json({
        message: "patient_id is required"
      });
    }

    // 🔥 Get latest IPD billing for patient
    const billing = await IPDPharma.findOne({ patient: patient_id })
      .populate("patient")
      .populate("visit")
      .populate("ipd")
      .sort({ createdAt: -1 });

    if (!billing) {
      return res.status(404).json({
        message: "No IPD pharma record found for this patient"
      });
    }

    // 🔥 Format day-wise response (UI friendly)
    const formattedDays = billing.days.map(day => ({
      date: day.date,
      total: day.total,
      paid: day.paid,
      due: day.due,
      items: day.items.map(item => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        total: item.total,
        batch: item.batch,
        expiry: item.expiry
      }))
    }));

    res.status(200).json({
      patient: billing.patient,
      visit: billing.visit,
      ipd: billing.ipd,

      days: formattedDays,

      summary: {
        grand_total: billing.grand_total,
        total_paid: billing.total_paid,
        total_due: billing.total_due,
        status: billing.status
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};



exports.getPatientIPDSummary = async (req, res) => {
  try {
    const { patient_id } = req.params;

    if (!patient_id) {
      return res.status(400).json({
        success: false,
        message: "patient_id is required"
      });
    }

    // ============================
    // Pharma Billing Record
    // ============================
    const pharma = await IPDPharma.findOne({
      patient: patient_id
    })
      .populate("patient")
      .sort({ createdAt: -1 });

    if (!pharma) {
      return res.status(404).json({
        success: false,
        message: "No IPD Pharma record found"
      });
    }

    // ============================
    // IPD Record
    // ============================
    const ipd = await IPD.findOne({
      patient: patient_id
    })
      .populate("visit")
      .populate("bed")
      .sort({ createdAt: -1 });

    // ============================
    // Pathology Bills
    // ============================
    const pathoBills = await PathoBill.find({
      patient: patient_id
    }).sort({ createdAt: 1 });

    // ============================
    // Pharmacy Day-wise Summary
    // ============================
    const formattedDays = pharma.days.map(day => ({
      date: day.date,
      total: day.total,
      paid: day.paid,
      due: day.due,

      items: day.items.map(item => ({
        name: item.name,
        qty: item.qty,
        price: item.price,
        total: item.total,
        batch: item.batch,
        expiry: item.expiry
      }))
    }));

    // ============================
    // Pathology Summary
    // ============================
    const pathology = pathoBills.map(bill => ({
      _id: bill._id,
      bill_id: bill.bill_id,
      date: bill.date,
      status: bill.status,
      total_amount: bill.total_amount,

      items: bill.items.map(item => ({
        test_id: item.test_id,
        test_name: item.test_name,
        price: item.price
      }))
    }));

    // ============================
    // Final Response
    // ============================
    return res.status(200).json({
      success: true,

      patient: pharma.patient,

      visit: ipd?.visit || null,

      ipd: ipd
        ? {
            _id: ipd._id,
            ipd_id: ipd.ipd_id,
            patient: ipd.patient,
            case_from: ipd.case_from,
            visit: ipd.visit?._id || ipd.visit,
            bed: ipd.bed,
            status: ipd.status,
            admission_date: ipd.admission_date,
            discharge_date: ipd.discharge_date || null,
            createdAt: ipd.createdAt,
            updatedAt: ipd.updatedAt
          }
        : null,

      pharmacy: {
        days: formattedDays,

        summary: {
          grand_total: pharma.grand_total,
          total_paid: pharma.total_paid,
          total_due: pharma.total_due,
          status: pharma.status
        }
      },

      pathology: {
        total_bills: pathology.length,
        bills: pathology
      }
    });

  } catch (error) {
    console.error("IPD Summary Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
