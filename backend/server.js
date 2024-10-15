// const express = require('express');
import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import { v2 as cloudinary } from "cloudinary";
import messageRoutes from "./routes/messageRoutes.js";
import { app, server } from "./socket/socket.js";
import path from "path";
import "./utils/serverAwake.js";

dotenv.config();

connectDB();

const __dirname = path.resolve();

// const app = express();

const PORT = process.env.PORT || 5000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/api/test", (req, res) => {
  res.send("Awaking Server");
});

//middelware
app.use(express.json({ limit: "50mb" })); //to parse JSON data in the req.body || middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);

app.use(express.static(path.join(__dirname, "/frontend/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
