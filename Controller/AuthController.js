

const User = require("../Model/UserModel");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendMail");



exports.register = async (req,res)=>{
try{

const {name,email,password} = req.body;

const existingUser = await User.findOne({email});

if(existingUser){
return res.status(400).json({message:"User already exists"});
}

const hashedPassword = await bcrypt.hash(password,10);

const user = await User.create({
name,
email,
password:hashedPassword
});

res.status(201).json({
message:"User registered successfully"
});

}catch(error){
res.status(500).json({message:error.message});
}
}







exports.login = async (req,res)=>{
try{

const {email,password} = req.body;

const user = await User.findOne({email});

if(!user){
return res.status(404).json({message:"User not found"});
}

const isMatch = await bcrypt.compare(password,user.password);

if(!isMatch){
return res.status(400).json({message:"Invalid password"});
}

// generate 6 digit OTP
const otp = crypto.randomInt(100000,999999).toString();

// console OTP
console.log("LOGIN OTP:",otp);

user.otp = otp;
user.otpExpires = Date.now() + 5*60*1000;

await user.save();

await sendEmail(email, otp);

res.json({
message:"OTP sent to email (check console for now)"
});

}catch(error){
res.status(500).json({message:error.message});
}
}



exports.verifyOtp = async (req,res)=>{
try{

const {email,otp} = req.body;

const user = await User.findOne({email});

if(!user){
return res.status(404).json({message:"User not found"});
}

if(user.otp !== otp){
return res.status(400).json({message:"Invalid OTP"});
}

if(user.otpExpires < Date.now()){
return res.status(400).json({message:"OTP expired"});
}

// clear OTP
user.otp = null;
user.otpExpires = null;

await user.save();

// generate token
const token = jwt.sign(
{ id:user._id ,
  mail:user.email,
  role:user.role
},
process.env.JWT_SECRET,
{ expiresIn:"1d" }
);




// set cookie

res.cookie("token", token, {                                          
  httpOnly: true,
  secure: false,
  sameSite: "lax",   
  maxAge: 24 * 60 * 60 * 1000
});


// devlopment

// res.cookie("token", token, {
//   httpOnly: true,           
//   secure: true,        // ✅ REQUIRED (HTTPS)
//   sameSite: "none",    // ✅ REQUIRED (cross-domain)
//   maxAge: 24 * 60 * 60 * 1000
// });

res.json({
message:"Login successful",
name:user.name,
email:user.email,
role:user.role,
id:user._id  
});

}catch(error){
res.status(500).json({message:error.message});
}
}




// verify token for protected routes

exports.verifyToken = (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.json({ dashboard: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return res.json({
      dashboard: true,
      user: decoded
    });

  } catch (err) {
    return res.json({ dashboard: false });
  }
};








exports.forgotPassword = async(req,res)=>{

const {email} = req.body;

const user = await User.findOne({email});

if(!user){
return res.status(404).json({message:"User not found"});
}

const otp = otpGenerator.generate(6,{upperCase:false,specialChars:false});

user.otp = otp;
user.otpExpires = Date.now()+10*60*1000;

await user.save();

res.json({
message:"OTP sent for password reset",
otp
})

}


exports.resetPassword = async(req,res)=>{

const {email,otp,newPassword} = req.body;

const user = await User.findOne({email});

if(user.otp !== otp){
return res.status(400).json({message:"Invalid OTP"});
}

const hashedPassword = await bcrypt.hash(newPassword,10);

user.password = hashedPassword;
user.otp = null;

await user.save();

res.json({message:"Password reset successful"});

}




exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false, // true if using https
    sameSite: "lax"
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};


//change password


exports.changePassword = async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    // 1. Validate input
    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3. Compare old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    // 4. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 5. Update password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({ message: "Password changed successfully" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

