import multer from 'multer';
import { google } from 'googleapis';
import { catchAsyncError } from '../middlewares/CatchAsyncError.js';
import { Resource } from '../models/Resource.js';
import stream from 'stream';
import { JWT } from 'google-auth-library';

const keys = JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON);
keys.private_key = keys.private_key.replace(/\\n/g, '\n');

// Correct authentication setup
const auth = new JWT({
  email: keys.client_email,
  key: keys.private_key,
  scopes: ['https://www.googleapis.com/auth/drive'],
  // Additional recommended fields
  keyId: keys.private_key_id,
  projectId: keys.project_id
});

const drive = google.drive({ version: 'v3', auth });
const upload = multer({ storage: multer.memoryStorage() });

export const addResource = [
  upload.single('file'),
  catchAsyncError(async (req, res, next) => {
    try {
      // ... rest of your existing code remains the same ...
    } catch (err) {
      console.error('Upload Error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Upload failed.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  })
];

export const getResources = catchAsyncError(async (req, res) => {
    const { level, subject, resourceType } = req.query;
  
    if (!level || !subject || !resourceType) {
      return res.status(400).json({
        success: false,
        message: 'Missing filters. Provide level, subject, and resourceType.',
      });
    }
  
    const resources = await Resource.find( { level, subject, resourceType } );
  
    res.status(200).json({
      success: true,
      resources,
    });
  });
