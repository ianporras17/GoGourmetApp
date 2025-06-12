const router     = require('express').Router();
const multer     = require('multer');
const auth       = require('../middlewares/auth');
const controller = require('../controllers/userController');

/* dónde guardar archivos temporales antes de moverlos */
const upload = multer({ dest: 'tmp/' });

router.get('/',  auth, controller.me);
router.put('/',  auth, upload.single('file'), controller.update);

module.exports = router;
