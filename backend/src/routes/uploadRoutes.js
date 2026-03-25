const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { cloudinary, upload } = require('../config/cloudinary');
const { protect, admin } = require('../middleware/authMiddleware');

const buildLocalUrl = (req, filename) => `${req.protocol}://${req.get('host')}/uploads/${filename}`;

const shouldProcessAccessoryImage = (req) => {
  const category = String(req.body?.category || req.query?.category || '').toLowerCase();
  return category === 'accessories';
};

const uploadAccessoryToCloudinary = async (filePath) => {
  // Cloudinary AI background removal is used for accessories when the account supports it.
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'the-cotton-butterflies/accessories',
    background_removal: 'cloudinary_ai',
    format: 'png',
    resource_type: 'image'
  });

  return {
    url: result.secure_url,
    public_id: result.public_id,
    processed: true
  };
};

const mapUploadedFile = async (req, file) => {
  const localAsset = {
    url: buildLocalUrl(req, file.filename),
    public_id: file.filename,
    processed: false
  };

  if (!shouldProcessAccessoryImage(req)) {
    return localAsset;
  }

  try {
    const processedAsset = await uploadAccessoryToCloudinary(file.path);
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return processedAsset;
  } catch (error) {
    console.error('Accessory background removal fallback:', error.message);
    return localAsset;
  }
};

// Upload multiple images
router.post('/images', protect, admin, (req, res) => {
  upload.array('images', 5)(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'No image files uploaded'
        });
      }

      const urls = await Promise.all(req.files.map((file) => mapUploadedFile(req, file)));

      res.json({
        status: 'success',
        urls
      });
    } catch (error) {
      console.error('Upload error:', error.message);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });
});

// Upload single image
router.post('/image', protect, admin, (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          status: 'error',
          message: 'No image file uploaded'
        });
      }

      const asset = await mapUploadedFile(req, req.file);

      res.json({
        status: 'success',
        url: asset.url,
        public_id: asset.public_id,
        processed: asset.processed
      });
    } catch (error) {
      console.error('Upload error:', error.message);
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });
});

// Delete image (local file)
router.delete('/image/:public_id', protect, admin, (req, res) => {
  try {
    const filePath = path.join(__dirname, '../uploads', req.params.public_id);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      status: 'success',
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
