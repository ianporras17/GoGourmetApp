// gourmetgo-backend/routes/reservations.js
const router = require('express').Router();
const auth   = require('../middlewares/auth');
const { byExperience } = require('../controllers/reservationsController');

/* todas requieren token (solo chefs) */
router.get('/experience/:id', auth, byExperience);

module.exports = router;
