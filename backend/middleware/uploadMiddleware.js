const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let format;
    if (file.mimetype.startsWith('image')) {
      format = 'webp';
    }

    return {
      folder: 'fundora-uploads',
      resource_type: 'auto',
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4', 'mov', 'avi', 'mkv'],
      format: format,
      transformation: [{ width: 1200, crop: "limit" }, { quality: "auto:good" }]
    };
  },
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit (Cloudinary free tier limit for videos)
  }
});

module.exports = upload;
