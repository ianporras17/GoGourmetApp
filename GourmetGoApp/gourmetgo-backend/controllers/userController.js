const pool = require('../db');
const path = require('path');
const fs   = require('fs');

/* carpeta pública donde Express sirve los archivos  */
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

/* ──────────────────────────────
   GET /api/profile    (token)
   Devuelve el perfil propio
──────────────────────────────── */
exports.me = async (req, res) => {
  try {
    const { id } = req.user;

    /*  ¡sin “identificacion”!  */
    const { rows } = await pool.query(
      `SELECT
         email,
         telefono,
         cedula,
         foto_url AS profile_image
       FROM   usuarios
       WHERE  id = $1`,
      [id]
    );

    if (!rows.length)
      return res.status(404).json({ error: 'Usuario no encontrado' });

    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ──────────────────────────────
   PUT /api/profile    (token)
   FormData (con “file”) ⇨ sube imagen
   JSON                   ⇨ sólo datos
──────────────────────────────── */
exports.update = async (req, res) => {
  try {
    const { id } = req.user;

    /* ----------- cuando llega FormData con imagen ----------- */
    if (req.file) {
      /* Renombrar archivo a una carpeta pública definitiva */
      const ext   = path.extname(req.file.originalname) || '.jpg';
      const fname = `profile_${id}_${Date.now()}${ext}`;
      const final = path.join(UPLOAD_DIR, fname);

      fs.renameSync(req.file.path, final);       // mueve de tmp/ a uploads/

      const url = `${req.protocol}://${req.get('host')}/uploads/${fname}`;

      const { email, telefono, cedula } = req.body;

      await pool.query(
        `UPDATE usuarios
            SET email    = $1,
                telefono = $2,
                cedula   = $3,
                foto_url = $4
          WHERE id = $5`,
        [email, telefono || null, cedula || null, url, id]
      );

      return res.json({ success: true, profile_image: url });
    }

    /* ----------- sólo JSON ----------- */
    const { email, telefono, cedula, profileImage = null } = req.body;

    await pool.query(
      `UPDATE usuarios
          SET email     = $1,
              telefono  = $2,
              cedula    = $3,
              foto_url  = $4
        WHERE id = $5`,
      [email, telefono || null, cedula || null, profileImage, id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
