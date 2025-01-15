// require("dotenv").config({path:"./env"}); // this reduce the consistency of our project.
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// add configuration of file upload and working on controllers
// as early as possible in your application, import and configure dotenv!

dotenv.config({
  path: "./env",
});

const PORT = process.env.PORT;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`MongoDB Connection FAILED.`, error);
  });
