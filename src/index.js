// require("dotenv").config({ path: "./.env" });
import dotenv from "dotenv";

import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";

dotenv.config({ path: "./env" });

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT || 8000}`);
        });
    })
    .catch((error) => {
        console.log("mongoose connection error: ", error);
    })



// import express from "express";

// const app = express();


// (async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URIs}/${DB_NAME} `)
//         app.on("errror", (error) => {
//             console.log("Error: ", error);
//             throw error;
//         });

//         app.listen(3000, () => {
//             console.log("Server is running on port 3000");
//         });
//     } catch (error) {
//         console.log(error);
//     }

// })()