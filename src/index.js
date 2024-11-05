import dotenv from "dotenv";
dotenv.config({
    path:'./env'
});

import connectDB from "./db/connect.db.js";
connectDB();


