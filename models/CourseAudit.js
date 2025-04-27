import mongoose from "mongoose";

const schema = new mongoose.Schema({
  courseId: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  oldValue: {
    type: Object,
    required: true,
  },
  newValue: {
    type: Object,
    required: true,
  },
},
    { timestamps: true }
);

export const CourseAudit = mongoose.model("CourseAudit", schema);