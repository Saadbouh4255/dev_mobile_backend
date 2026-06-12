const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const authenticate = require('../middleware/auth');
const authController = require('../controllers/authController');
const placesController = require('../controllers/placesController');
const categoriesController = require('../controllers/categoriesController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    if (ext) return cb(null, true);
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'));
  }
});

router.post('/login', authController.login);

router.post('/places', authenticate, upload.single('image'), placesController.createPlace);
router.put('/places/:id', authenticate, upload.single('image'), placesController.updatePlace);
router.delete('/places/:id', authenticate, placesController.deletePlace);

router.post('/categories', authenticate, categoriesController.createCategory);
router.put('/categories/:id', authenticate, categoriesController.updateCategory);
router.delete('/categories/:id', authenticate, categoriesController.deleteCategory);

module.exports = router;
