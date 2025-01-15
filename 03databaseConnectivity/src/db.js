import mongoose from "mongoose";
import express from "express";

const app = express();

// First approach to connect with database.
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/DB_NAME`);
    app.on("error", (error) => {
      console.log(`application not able to talk to DB!`);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`Server is running on http://localhost:8000`);
    });
  } catch (error) {
    console.error("Error", error);
    throw error;
  }
})();
