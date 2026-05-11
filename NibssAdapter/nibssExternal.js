// services/nibss.service.js

import axios from "axios";

const BASE_URL = "https://nibssbyphoenix.onrender.com";


// 🔐 1. Get Token
export const getNibssToken = async () => {
  try {
    console.log("API KEY:", process.env.NIBSS_API_KEY);
    console.log("API SECRET:", process.env.NIBSS_API_SECRET);
    const res = await axios.post(`${BASE_URL}/api/auth/token`, {
      apiKey: process.env.NIBSS_API_KEY,
      apiSecret: process.env.NIBSS_API_SECRET
    });
    return res.data?.token;
  } catch (err) {
    console.error("Token error:", err.response?.data || err.message);
    throw new Error("Failed to authenticate with NIBSS");
  }
};

// 🎲 2. Generate BVN
export const generateBVN = () => {
  return Math.floor(
    10000000000 + Math.random() * 90000000000
  ).toString();
};


// 🆔 3. Create BVN
export const createBVN = async (data) => {
  try {

    const bvn = generateBVN();

    await axios.post(`${BASE_URL}/api/insertBvn`, {
      bvn,
      firstName: data.firstName,
      lastName: data.lastName,
      dob: data.dob,
      phone: data.phone
    });

    return bvn;

  } catch (err) {

    console.error(
      "BVN error:",
      err.response?.data || err.message
    );

    throw new Error("BVN creation failed");
  }
};


// 🏦 4. Create Account
export const createNibssAccount = async ({ bvn, dob }) => {
  try {

    // Get token first
    const token = await getNibssToken();

    console.log("Generated Token:", token);

    // Create account
    const res = await axios.post(
      `${BASE_URL}/api/account/create`,
      {
        kycType: "bvn",
        kycId: bvn,
        dob: dob
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return res.data;

  } catch (err) {
    console.error(
      console.error("NIBSS ERROR:", err.response?.data || err.message)
    );
    throw err;
  }
};


// 🔍 5. Name Enquiry
export const nameEnquiry = async (accountNumber) => {

  try {

    const token = await getNibssToken();

    const res = await axios.get(
      `${BASE_URL}/api/account/name-enquiry/${accountNumber}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return res.data;

  } catch (err) {

    console.error(
      "Name enquiry error:",
      err.response?.data || err.message
    );

    throw new Error("Name enquiry failed");
  }
};


// 💸 6. Transfer Funds
export const transferFunds = async (payload) => {

  try {

    const token = await getNibssToken();

    const res = await axios.post(
      `${BASE_URL}/api/transfer`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return res.data;

  } catch (err) {

    console.error(
      "Transfer error:",
      err.response?.data || err.message
    );

    throw new Error("Transfer failed");
  }
};
