const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

name:{
type:String,
required:true
},

email:{
type:String,
required:true,
unique:true
},

password:{
type:String,
required:true
},

isVerified:{
type:Boolean,
default:false
},

otp:{
type:String
},

otpExpires:{
type:Date
},

role:{
    type:String,
    enum:["admin","doctor","staff"],
    default:"staff"
  }
},

{
  timestamps:true
})

module.exports = mongoose.model("User",userSchema);