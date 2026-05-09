import User from "../Model/User.js";
import bcrypt from "bcrypt";
import Bvn from "../Model/bvn.js";
import Account from "../Model/account.js";
import { generateToken } from "../utils/generateToken.js";
import { createBVN, createNibssAccount } from "../NibssAdapter/nibssExternal.js";


// REGISTER USER
export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      dob
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      dob
    });

    //call nibss api to verify BVN and link to user record 

      const bvn = await createBVN({
      firstName,
      lastName,
      dob,
      phone
    });

    //calls nibss to create account number and link to user record
    const accountResponse = await createNibssAccount({
      bvn,
      dob
    });

    if (!accountResponse || accountResponse.status !== "success") {
      throw new Error("Failed to create NIBSS account");
    }

    const accountNumber = accountResponse?.account?.accountNumber;

    if (!accountNumber) {
      throw new Error("No account number returned");
    }

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

    // 7️⃣ Save Account record
    await Account.create({
      user: user._id,
      bvn: bvnRecord._id,
      accountNumber,
      accountName: `${firstName} ${lastName}`,
      rawResponse: accountResponse
    });


    return res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: { bvn, accountNumber }
      
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};


// LOGIN USER
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid credentials"
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        status: "error",
        message: "Account is locked"
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.failedLoginAttempts += 1;

      // Lock after 5 attempts
      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
      }

      await user.save();

      return res.status(400).json({
        status: "error",
        message: "Invalid credentials"
      });
    }

    // Reset failed attempts
    user.failedLoginAttempts = 0;
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    return res.status(200).json({
      status: "success",
      token
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};


// GET PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    return res.status(200).json({
      status: "success",
      data: user
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};


// SET TRANSACTION PIN
export const setTransactionPin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({
        status: "error",
        message: "PIN must be 4 digits"
      });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { transactionPin: hashedPin },
      { new: true }
    );

    return res.status(200).json({
      status: "success",
      message: "Transaction PIN set successfully"
    });

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};