import express from "express";
import { register, login, getProfile, setTransactionPin } from "../Controller/userController.js";

const router = express.Router();

// ✅ Register
router.post("/register", register);

// ✅ Login
router.post("/login", login);

// ✅ Get Profile (protected)
router.get("/profile", getProfile);

// ✅ Set Transaction PIN (protected)
router.post("/set-pin", setTransactionPin);

export default router;