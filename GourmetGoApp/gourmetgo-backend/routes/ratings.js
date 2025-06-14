// gourmetgo-backend/routes/ratings.js
const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { create } = require('../controllers/ratingsController');
router.post('/', auth, create);
module.exports = router;
