import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    // Identity
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    
     failedLoginAttempts: {
      type: Number,
      default: 0
    },

    dob: {
      type: String,
      required: true,
      trim: true
    },

    // Contact
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    phone: {
      type: String,
      required: true,
      unique: true
    },

    // Authentication
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false // Exclude from default queries
    },

    // Verification
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isPhoneVerified: {
      type: Boolean,
      default: false
    },

    // Fintech-specific
    bvn: {
      type: String,
      unique: true,
      sparse: true // allows null but enforces uniqueness when present
    },

    // Security
    transactionPin: {
      type: String,
      select: false
    },

    failedLoginAttempts: {
      type: Number,
      default: 0
    },

    isLocked: {
      type: Boolean,
      default: false
    },

  },
  {
    timestamps: true
  }
);

export default mongoose.model("User", userSchema);