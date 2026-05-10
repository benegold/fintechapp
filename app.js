import dotenv from 'dotenv';

dotenv.config();
import dns from "node:dns"
dns.setServers(['8.8.8.8', '1.1.1.1']);

import express from 'express';
import connectDB from './configs/database.js';
import userRoutes from './Routes/userRoutes.js';

const app = express();

app.use(express.json());
app.use('/api/users', userRoutes);

// DB
connectDB();


app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});