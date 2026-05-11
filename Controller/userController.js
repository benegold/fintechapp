import User from "../Model/User.js";
import bcrypt from "bcrypt";
import Bvn from "../Model/bvn.js";
import Account from "../Model/account.js";
import { generateToken } from "../utils/generateToken.js";
import { createBVN, createNibssAccount } from "../NibssAdapter/nibssExternal.js";


// ========================= REGISTER USER =========================
export const register = async (req, res) => {
  try {
    console.log("register body:", req.body);
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      dob
    } = req.body;

    // 1️⃣ Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User already exists"
      });
    }

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      dob
    });

    console.log("✅ User created:", user._id);

    // 4️⃣ Generate BVN from NIBSS
    const bvn = await createBVN({
      firstName,
      lastName,
      dob,
      phone
    });

    console.log("✅ BVN generated:", bvn);

    // 5️⃣ Create NIBSS account
    const accountResponse = await createNibssAccount({
      bvn,
      dob
    });

    console.log("✅ Account Response:", accountResponse);

    if (!accountResponse || !accountResponse.accountNumber) {
      throw new Error("Failed to create NIBSS account");
    }

    const accountNumber = accountResponse.accountNumber;

    // 6️⃣ Save BVN record
    const bvnRecord = await Bvn.create({
      user: user._id,
      bvn,
      firstName,
      lastName,
      dob,
      phone,
      status: "verified",
      rawResponse: null
    });

    console.log("✅ BVN record saved");

    // 7️⃣ Save account record
    const account = await Account.create({
      user: user._id,
      bvn: bvnRecord._id,
      accountNumber,
      accountName: `${firstName} ${lastName}`,
      rawResponse: accountResponse
    });

    console.log("✅ Account saved:", account.accountNumber);

    // 8️⃣ Generate JWT token
    const token = generateToken(user);

    // 9️⃣ Send success response
    return res.status(201).json({
      status: "success",
      message: "User created successfully",
      token,
      data: {
        user,
        bvn,
        accountNumber
      }
    });

  } catch (error) {
    console.error("❌ FULL REGISTER ERROR:", error);
    console.error("❌ ERROR MESSAGE:", error.message);

    if (error.response) {
      console.error("❌ ERROR RESPONSE DATA:", error.response.data);
    }

    return res.status(500).json({
      status: "error",
      message: error.message,
      error: error.response?.data || null
    });
  }
};


// ========================= LOGIN USER =========================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Find user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid credentials"
      });
    }

    // 2️⃣ Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        status: "error",
        message: "Account is locked"
      });
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.failedLoginAttempts += 1;

      // Lock account after 5 failed attempts
      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
      }

      await user.save();

      return res.status(400).json({
        status: "error",
        message: "Invalid credentials"
      });
    }

    // 4️⃣ Reset failed attempts
    user.failedLoginAttempts = 0;
    await user.save();

    // 5️⃣ Generate token
    const token = generateToken(user);

    // 6️⃣ Success response
    return res.status(200).json({
      status: "success",
      token
    });

  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};


// ========================= GET PROFILE =========================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    return res.status(200).json({
      status: "success",
      data: user
    });

  } catch (error) {
    console.error("❌ PROFILE ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};


// ========================= SET TRANSACTION PIN =========================
export const setTransactionPin = async (req, res) => {
  try {
    const { pin } = req.body;

    // Validate PIN
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        status: "error",
        message: "PIN must be exactly 4 digits"
      });
    }

    // Hash PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // Update user
    await User.findByIdAndUpdate(
      req.user.id,
      {
        transactionPin: hashedPin
      },
      {
        new: true
      }
    );

    return res.status(200).json({
      status: "success",
      message: "Transaction PIN set successfully"
    });

  } catch (error) {
    console.error("❌ PIN ERROR:", error);

    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};
