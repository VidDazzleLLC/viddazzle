import { IncomingForm } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';

// Disable default body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

// Allowed upload directory
const UPLOAD_DIR = '/tmp/workflow-files/uploads';

/**
 * File upload endpoint for Autopilot sidebar
 * POST /api/autopilot/upload
 * Accepts multipart/form-data with file field
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Parse form data
    const form = new IncomingForm({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = files.file?.[0] || files.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get file info
    const filePath = file.filepath;
    const originalName = file.originalFilename || 'unnamed';
    const mimeType = file.mimetype;
    const fileSize = file.size;

    // Extract content based on file type
    let extractedContent = null;

    try {
      if (mimeType?.startsWith('text/') || originalName.endsWith('.txt') || originalName.endsWith('.md')) {
        // Text files
        extractedContent = await fs.readFile(filePath, 'utf-8');
      } else if (mimeType === 'application/json' || originalName.endsWith('.json')) {
        // JSON files
        const content = await fs.readFile(filePath, 'utf-8');
        extractedContent = JSON.parse(content);
      } else if (originalName.endsWith('.csv')) {
        // CSV files
        extractedContent = await fs.readFile(filePath, 'utf-8');
      } else if (mimeType?.startsWith('image/')) {
        // Images - store metadata only
        extractedContent = {
          type: 'image',
          mimeType,
          size: fileSize,
          message: 'Image uploaded successfully. Use file_read tool to process.',
        };
      } else if (mimeType === 'application/pdf') {
        // PDF - note about processing
        extractedContent = {
          type: 'pdf',
          message: 'PDF uploaded successfully. Use file_read tool to extract text.',
        };
      } else {
        // Other file types
        extractedContent = {
          type: 'binary',
          mimeType,
          size: fileSize,
          message: 'File uploaded successfully. Available for workflow processing.',
        };
      }
    } catch (extractError) {
      console.warn('Content extraction failed:', extractError);
      extractedContent = {
        message: 'File uploaded but content extraction failed. File is still available.',
      };
    }

    return res.status(200).json({
      success: true,
      path: filePath,
      originalName,
      mimeType,
      size: fileSize,
      extractedContent,
      message: 'File uploaded successfully',
    });

  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({
      error: 'File upload failed',
      message: error.message,
    });
  }
}
