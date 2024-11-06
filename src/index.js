import dotenv from "dotenv";
dotenv.config({
    path:'./env'
});

import connectDB from "./db/connect.db.js";
import app from "./app.js";

const PORT=process.env.PORT || PORT;

connectDB()
.then(()=>{
    app.listen(PORT,()=>{
         console.log(`server is listening at : ${PORT}`);
         
    })
})
.catch((err)=>{
    console.log("MongoDB connection fail !!!",err);
    
})


