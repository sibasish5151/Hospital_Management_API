// utils/generateBillNumber.js

const Bill = require("../Model/BillingModel");

const generateBillNumber = async () => {
  const lastBill = await Bill.findOne()
    .sort({ createdAt: -1 })
    .select("bill_number");

  let next = 1;

  if (lastBill?.bill_number) {
    const num = parseInt(lastBill.bill_number.replace("S", ""));
    next = num + 1;
  }

  return `S${String(next).padStart(4, "0")}`;
};



const generateTokenNumber = async () => {
  const lastOPD = await OPD.findOne()
    .sort({ createdAt: -1 })
    .select("tokenNo");
  let nextToken = 1;

  if (lastOPD?.tokenNo) {
    nextToken = lastOPD.tokenNo + 1;
  }
  return nextToken;
  
};
  
module.exports = {
  generateBillNumber,
  generateTokenNumber
};