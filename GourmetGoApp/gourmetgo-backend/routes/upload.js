// gourmetgo-backend/routes/upload.js
const router  = require('express').Router();
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');

/*  Carpeta donde guardarás los archivos  */
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

/*  Almacena en disco con un nombre único  */
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename   : (_, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `exp_${Date.now()}_${Math.round(Math.random()*1e9)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

/*  POST /api/upload  */
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo faltante' });

  // Construir la URL pública
  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;
