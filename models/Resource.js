// models/Resource.js
import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema({
  driveFileId: {
    type: String,
    required: true,
  },
  driveLink: {
    type: String,
    required: true,
  }, 
  level: {
    type: String,
    enum: ['O Level', 'A Level'],
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  resourceType: {
    type: String,
    enum: ['Past Paper', 'Book', 'Marking Scheme', 'Notes'],
    required: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

export const Resource = mongoose.model('Resource', resourceSchema);

