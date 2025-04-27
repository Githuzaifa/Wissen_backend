import { UserAudit } from "../models/UserAudit.js";

export const userAudit = async (userId, action, oldValue, newValue) => {
    
    const audit = new UserAudit({userId, action, oldValue, newValue});
    await audit.save();
    
    return;
  };