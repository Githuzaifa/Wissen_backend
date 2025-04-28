import multer from 'multer';
import { google } from 'googleapis';
import { catchAsyncError } from '../middlewares/CatchAsyncError.js';
import { Resource } from '../models/Resource.js';
import path from 'path';
import fs from 'fs';

// Multer Setup
const upload = multer({
  dest: '/tmp/', // Change to /tmp to work with Vercel's writable directory
});

const auth = new google.auth.GoogleAuth({
  keyFile: './config/credentials_google_cloud.json',
  scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

export const addResource = [
  upload.single('file'), // Add Multer middleware here
  catchAsyncError(async (req, res, next) => {
    try {
      const { level, subject, resourceType } = req.body;

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }

      // Ensure the file path is valid, stored in /tmp
      const filePath = path.join('/tmp', req.file.filename);

      const fileMetadata = {
        name: req.file.originalname,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      };

      const media = {
        mimeType: req.file.mimetype,
        body: fs.createReadStream(filePath), // Read file from /tmp
      };

      // Upload to Google Drive
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

      // Clean up the local file in /tmp after uploading to Google Drive
      fs.unlinkSync(filePath);

      res.status(200).json({
        success: true,
        message: 'Resource uploaded successfully.',
        data: {
          id: file.data.id,
          link: file.data.webViewLink,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Upload failed.' });
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
