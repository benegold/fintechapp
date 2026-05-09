// services/nibss.service.js
import axios from "axios";


const BASE_URL = "https://nibssbyphoenix.onrender.com";

// 🔐 1. Get Token
export const getNibssToken = async () => {
  try {
    const res = await axios.post(`${BASE_URL}/auth/token`, {
      apiKey: process.env.NIBSS_API_KEY,
      apiSecret: process.env.NIBSS_API_SECRET
    });

    return res.data?.access_token;
  } catch (err) {
    throw new Error("Failed to authenticate with NIBSS");
  }
};

// 🎲 2. Generate BVN
export const generateBVN = () => {
  return Math.floor(10000000000 + Math.random() * 90000000000).toString();
};

// 🆔 3. Create BVN
export const createBVN = async (data) => {
  try {
    const bvn = generateBVN();

    await axios.post(`${BASE_URL}/api/insertBvn`, {
      bvn,
      ...data
    });

    return bvn;
  } catch (err) {
    throw new Error("BVN creation failed");
  }
};

// 🏦 4. Create Account
export const createNibssAccount = async ({ bvn, dob }) => {
  try {
    const token = await getNibssToken();

    const res = await axios.post(
      `${BASE_URL}/api/account/create`,
      {
        kycType: "BVN",
        kycID: bvn,
        dob
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return res.data;
  } catch (err) {
    throw new Error("Account creation failed");
  }
};

export const nameEnquiry = async (accountNumber) => {
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
};

// 💸 Transfer
export const transferFunds = async (payload) => {
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
};