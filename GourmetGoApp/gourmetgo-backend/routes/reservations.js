const router = require('express').Router();
const auth   = require('../middlewares/auth');
const {
  byExperience,
  listMine,
  createReservation   // ← nuevo
} = require('../controllers/reservationsController');

router.get('/experience/:id', auth, byExperience); // chefs
router.get('/mine',           auth, listMine);     // usuarios
router.post('/',              auth, createReservation); // ← NUEVO

module.exports = router;
