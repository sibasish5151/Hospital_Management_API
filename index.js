
const dns = require('node:dns/promises');
dns.setServers(['1.1.1.1', '8.8.8.8']);

require("dotenv").config();

console.log("Environment variables loaded");
///// above all for bypass DNS resolution issues in some environments like local run 


require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");

const app = express();
app.use(cookieParser());
// connect database
connectDB();

// app.use(cors({
//   origin: true,
//    credentials: true         // local 
// }));



app.use(cors({
  origin: ["https://chiraghospital.cloud"],
  credentials: true
}));




app.use(express.json());


const authRoutes = require("./Route/AuthRoute");
const inventoryRoutes = require("./Route/InventoryRoute");
const typeRoutes = require("./Route/Master/TypeRoute");
const supplierRoutes = require("./Route/Master/SupplierRoute");
const userRoutes = require("./Route/UserRoute");

const billingRoutes = require("./Route/BillingRoute");

const pathologyRoutes = require("./Route/Master/PathologyRoute");


// Master Routes
const roomTypeRoutes = require("./Route/Master/RoomTypeRoute");
const bedMasterRoutes = require("./Route/Master/BedMasterRoute");
const mdcnMasterRoutes = require("./Route/Master/MdcnMasterRoute");


//Hospital Management Routes
const visitRoutes = require("./Route/Hospital/VisitRoute");
const ipdRouts = require("./Route/Hospital/IPDRoute")
const bedAllocationRoutes = require("./Route/Hospital/BedAllocationRoute");
const ipdBillingRoutes = require("./Route/Hospital/IPDBillingRoute");

//Pathology Routes
const pathoRoutes = require("./Route/Pathology/PathoRoute");


////Hospital Management Routes CALL 
app.use("/api/visit", visitRoutes);
app.use("/api/bedallocation", bedAllocationRoutes);
app.use("/api/ipdbilling", ipdBillingRoutes);


//Pathology Routes CALL
app.use("/api/patho", pathoRoutes);
app.use("/api/ipd",ipdRouts)


app.use("/api/auth",authRoutes);

app.use("/api/inventory", inventoryRoutes);

app.use("/api/type", typeRoutes);

app.use("/api/supplier", supplierRoutes);

app.use("/api/user", userRoutes);

app.use("/api/billing", billingRoutes);

app.use("/api/pathology", pathologyRoutes);


// Master Routes CALL
app.use("/api/roomtype", roomTypeRoutes);
app.use("/api/bedmaster", bedMasterRoutes);
app.use("/api/mdcnmaster", mdcnMasterRoutes);





const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("New code added");
});