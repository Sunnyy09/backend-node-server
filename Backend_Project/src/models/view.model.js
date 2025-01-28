import mongoose, { Schema } from "mongoose";

const viewSchema = new Schema(
  {
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    viewer: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const View = mongoose.model("View", viewSchema);
