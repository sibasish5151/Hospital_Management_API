const Visit = require("../Model/Hospital/VisitModel");

const Patient = require("../Model/Hospital/PatientModel");

const PathoBill = require("../Model/Pathology/PathoModel");

const Bed = require("../Model/Master/BedMasterModel");
const roomtype = require("../Model/Master/RoomTypeModel");

const IPD = require("../Model/Hospital/IPDModel");






// ✅ Format Date → DD-MM-YYYY
const formatDate = (date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};


// 🧑‍⚕️ Generate Patient ID
const generatePatientId = async () => {
  const today = new Date();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const dateStr = formatDate(today);

  const count = await Patient.countDocuments({
    createdAt: { $gte: start, $lte: end }
  });

  return `CHIRAG-PAT-${dateStr}-${String(count + 1).padStart(3, "0")}`;
};


// 🏥 Generate Visit Case Number
const generateCaseNumber = async () => {
  const today = new Date();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const dateStr = formatDate(today);

  const count = await Visit.countDocuments({
    createdAt: { $gte: start, $lte: end }
  });

  return `CHIRAG-VIS-${dateStr}-${String(count + 1).padStart(3, "0")}`;
};


// 🧪 Generate Pathology Bill ID (YOUR REQUIREMENT)
const generatePathoBillId = async () => {
  const today = new Date();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const dateStr = formatDate(today);

  const count = await PathoBill.countDocuments({
    createdAt: { $gte: start, $lte: end }
  });

  return `CHIRAG-PATHO-${dateStr}-${String(count + 1).padStart(2, "0")}`;
};



const generateIPDID = async () => {
  const today = new Date();

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const dateStr = formatDate(today);

  const count = await IPD.countDocuments({
    createdAt: { $gte: start, $lte: end }
  });

  return `CHIRAG-IPD-${dateStr}-${String(count + 1).padStart(2, "0")}`;
};



// const calculateIPDBill = (admissionDate, dischargeDate, charges) => {
//   // 🔹 1. Days
//   const days = Math.max(
//     1,
//     Math.ceil(
//       (new Date(dischargeDate) - new Date(admissionDate)) /
//       (1000 * 60 * 60 * 24)
//     )
//   );

//   // 🔹 2. Doctor calculation (dynamic)
//   const doctorVisitCharge = charges.doctorVisitPerVisit || 0;
//   const visitsPerDay = charges.visitsPerDay || 0;

//   const doctorPerDay = doctorVisitCharge * visitsPerDay;

//   // 🔹 3. Other charges (safe fallback)
//   const bedCharge = charges.bedCharge || 0;
//   const nursingCare = charges.nursingCare || 0;
//   const monitorCharge = charges.monitorCharge || 0;
//   const cleanlinessCharge = charges.cleanlinessCharge || 0;
//   const biomedicalWasteCharge = charges.biomedicalWasteCharge || 0;

//   // 🔹 4. Daily total
//   const dailyCharge =
//     bedCharge +
//     nursingCare +
//     monitorCharge +
//     cleanlinessCharge +
//     biomedicalWasteCharge +
//     doctorPerDay;

//   // 🔹 5. Final total
//   const totalAmount = dailyCharge * days;

//   return {
//     total_days: days,
//     daily_charge: dailyCharge,
//     total_amount: totalAmount,

//     // 🔥 IMPORTANT (for UI + invoice)
//     breakdown: {
//       bedCharge,
//       nursingCare,
//       monitorCharge,
//       cleanlinessCharge,
//       biomedicalWasteCharge,
//       doctor: {
//         per_visit: doctorVisitCharge,
//         visits_per_day: visitsPerDay,
//         total_per_day: doctorPerDay
//       }
//     }
//   };
// };


const calculateIPDBill = (admissionDate, dischargeDate, charges) => {
  // =====================================================
  // 1. CALCULATE BILLABLE DAYS (2 HOURS GRACE)
  // =====================================================

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const MS_PER_HOUR = 60 * 60 * 1000;

  // Make grace period configurable (default: 2 hours)
  const GRACE_HOURS = charges.graceHours ?? 2;

  const diffMs =
    new Date(dischargeDate) - new Date(admissionDate);

  // Complete 24-hour blocks
  const fullDays = Math.floor(diffMs / MS_PER_DAY);

  // Remaining hours after complete days
  const remainingMs = diffMs % MS_PER_DAY;
  const remainingHours = remainingMs / MS_PER_HOUR;

  let days = fullDays;

  // Charge one extra day only if grace period exceeded
  if (remainingHours > GRACE_HOURS) {
    days++;
  }

  // Minimum billing is 1 day
  days = Math.max(days, 1);

  // =====================================================
  // 2. DOCTOR CHARGES
  // =====================================================

  const doctorVisitCharge = charges.doctorVisitPerVisit || 0;
  const visitsPerDay = charges.visitsPerDay || 0;

  const doctorPerDay =
    doctorVisitCharge * visitsPerDay;

  // =====================================================
  // 3. OTHER CHARGES
  // =====================================================

  const bedCharge = charges.bedCharge || 0;
  const nursingCare = charges.nursingCare || 0;
  const monitorCharge = charges.monitorCharge || 0;
  const cleanlinessCharge = charges.cleanlinessCharge || 0;
  const biomedicalWasteCharge =
    charges.biomedicalWasteCharge || 0;

  // =====================================================
  // 4. DAILY CHARGE
  // =====================================================

  const dailyCharge =
    bedCharge +
    nursingCare +
    monitorCharge +
    cleanlinessCharge +
    biomedicalWasteCharge +
    doctorPerDay;

  // =====================================================
  // 5. TOTAL AMOUNT
  // =====================================================

  const totalAmount = dailyCharge * days;

  // =====================================================
  // 6. RETURN
  // =====================================================

  return {
    total_days: days,
    daily_charge: dailyCharge,
    total_amount: totalAmount,

    breakdown: {
      bedCharge,
      nursingCare,
      monitorCharge,
      cleanlinessCharge,
      biomedicalWasteCharge,
      doctor: {
        per_visit: doctorVisitCharge,
        visits_per_day: visitsPerDay,
        total_per_day: doctorPerDay
      }
    }
  };
};



module.exports = {
  generatePatientId,
  generateCaseNumber,
  generatePathoBillId,
  generateIPDID,
  calculateIPDBill
};