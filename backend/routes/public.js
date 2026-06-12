const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const placesController = require('../controllers/placesController');

router.get('/categories', categoriesController.getCategories);
router.get('/places', placesController.getPlaces);
router.get('/places/:id', placesController.getPlace);

module.exports = router;
