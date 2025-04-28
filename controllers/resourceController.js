import multer from 'multer';
import { google } from 'googleapis';
import { catchAsyncError } from '../middlewares/CatchAsyncError.js';
import { Resource } from '../models/Resource.js';
import stream from 'stream';

import { readFileSync } from 'fs';
import path from 'path';

const keyPath = path.join(process.cwd(), 'config', 'credentials_google_cloud.json');
const keys = JSON.parse(readFileSync(keyPath, 'utf8'));

// Fix newlines in private key if needed
keys.private_key = keys.private_key.replace(/\\n/g, '\n');

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: process.env.GOOGLE_TYPE,
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY
      .replace(/\\n/g, '\n')
      .replace(/"/g, ''),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL
  },
  scopes: ['https://www.googleapis.com/auth/drive']
});

const drive = google.drive({ version: 'v3', auth });
// Memory storage avoids filesystem issues
const upload = multer({ storage: multer.memoryStorage() });


export const addResource = [
  upload.single('file'),
  catchAsyncError(async (req, res, next) => {
    try {
      const { level, subject, resourceType } = req.body;

      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded.' 
        });
      }

      const fileMetadata = {
        name: req.file.originalname,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      };

      // Create a simple readable stream from the buffer
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer); // Just end the stream with the buffer

      const media = {
        mimeType: req.file.mimetype,
        body: bufferStream, // This is now a proper stream
      };

      const file = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      const newResource = new Resource({
        driveFileId: file.data.id,
        driveLink: file.data.webViewLink,
        level,
        subject,
        resourceType,
      });

      await newResource.save();

      res.status(200).json({
        success: true,
        message: 'Resource uploaded successfully.',
        data: {
          id: file.data.id,
          link: file.data.webViewLink,
        },
      });
    } catch (err) {
      console.error('Upload Error:', {
        message: err.message,
        stack: err.stack,
        code: err.code,
        response: err.response?.data
      });
      res.status(500).json({ 
        success: false, 
        message: 'Upload failed.',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }
  }),
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
