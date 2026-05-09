// models/Account.js
import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    bvn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bvn",
      required: true
    },

    accountNumber: {
      type: String,
      required: true,
      unique: true
    },

    accountName: {
      type: String
    },

    bankName: {
      type: String,
      default: "NibssByPhoenix"
    },

    balance: {
      type: Number,
      default: 0
    },

    currency: {
      type: String,
      default: "NGN"
    },

    status: {
      type: String,
      enum: ["active", "inactive", "frozen"],
      default: "active"
    },

    rawResponse: {
      type: Object // store full API response
    }
  },
  {
    timestamps: true
  }
);

const Account = mongoose.model("Account", accountSchema);
export default Account;