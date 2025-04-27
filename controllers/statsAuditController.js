import { StatsAudit } from "../models/StatsAudit.js";

export const statsAudit = async (statId, action, oldValue, newValue) => {
    
    const audit = new StatsAudit({statId, action, oldValue, newValue});
    await audit.save();
    
    return;
  };