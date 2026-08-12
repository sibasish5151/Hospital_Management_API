const express = require("express");
const router = express.Router();

const authController = require("../Controller/AuthController");

router.post("/register",authController.register);
router.post("/verify-otp",authController.verifyOtp);
router.get("/verify-token",authController.verifyToken);
router.post("/login",authController.login);
router.post("/forgot-password",authController.forgotPassword);
router.post("/reset-password",authController.resetPassword);
router.post("/logout",authController.logout);
router.post("/change-password",authController.changePassword);
module.exports = router;