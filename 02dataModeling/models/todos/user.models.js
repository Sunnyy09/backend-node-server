import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    //   username: String,
    //   email: String,
    //   isActive: Boolean,

    /*
    professional approach to doing the same
    writing MongoDB validation, casting and business logic
    boilerplate is a drag.
    */

    // define schema like this callaed validation.

    username: {
      type: String,
      required: true,
      unique: true, // optional type
      lowercase: true, // optional type
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true, // [true, "password is required"],
    },
  },
  { timestamps: true }
  /* timestamps like: 
   - createAt()  
   - updatedAt()
   */
);

export const User = mongoose.model("User", userSchema);

/*
data stored in the database(mongodb) like:
 - User -> users (standardized practice)
 - Todo -> todos

*/
