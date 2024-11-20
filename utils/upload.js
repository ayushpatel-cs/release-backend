const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const fs = require('fs');

// Configure AWS
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new aws.S3();

// Local storage configuration (fallback if S3 is not configured)
const localStorageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = '/var/www/uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// S3 storage configuration
// const s3StorageConfig = multerS3({
//   s3: s3,
//   bucket: process.env.AWS_S3_BUCKET,
//   acl: 'public-read',
//   metadata: (req, file, cb) => {
//     cb(null, { fieldName: file.fieldname });
//   },
//   key: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, `${file.fieldname}/${uniqueSuffix}${path.extname(file.originalname)}`);
//   }
// });

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WEBP are allowed.'), false);
  }
};

// Create multer instances
const storage = process.env.AWS_S3_BUCKET ? s3StorageConfig : localStorageConfig;

const uploadPropertyImages = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // max 10 files
  }
}).array('images', 10);

const uploadProfileImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  }
}).single('profile_image');

// Wrapper functions for handling multer uploads
const handlePropertyImageUpload = (req, res, next) => {
  uploadPropertyImages(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files. Maximum is 10 files.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

const handleProfileImageUpload = (req, res, next) => {
  uploadProfileImage(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Image optimization utility
const optimizeImage = async (buffer, options = {}) => {
  try {
    const sharp = require('sharp');
    const { width, height, quality } = options;

    let transform = sharp(buffer);

    if (width || height) {
      transform = transform.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    return transform
      .jpeg({ quality: quality || 80 })
      .toBuffer();
  } catch (error) {
    console.error('Image optimization error:', error);
    throw error;
  }
};

// Delete file from S3
const deleteFileFromS3 = async (fileUrl) => {
  if (!process.env.AWS_S3_BUCKET) return;

  try {
    const key = fileUrl.split('.com/')[1];
    await s3.deleteObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key
    }).promise();
  } catch (error) {
    console.error('S3 deletion error:', error);
    throw error;
  }
};

// Delete local file
const deleteLocalFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Local file deletion error:', error);
    throw error;
  }
};

module.exports = {
  uploadPropertyImages: handlePropertyImageUpload,
  uploadProfileImage: handleProfileImageUpload,
  optimizeImage,
  deleteFileFromS3,
  deleteLocalFile
};
