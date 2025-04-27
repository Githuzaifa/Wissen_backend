import { CourseAudit } from "../models/CourseAudit.js";

export const courseAudit = async (courseId, action, oldValue, newValue) => {
    
    const audit = new CourseAudit({courseId, action, oldValue, newValue});
    await audit.save();
    
    return;
  };