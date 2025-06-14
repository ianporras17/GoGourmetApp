// gourmetgo-backend/controllers/authController.js
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gourmet-secret';

/* ──────────── REGISTRO ──────────── */
exports.register = async (req, res) => {
  try {
    const {
      rol, nombre, email, password,
      telefono = null, cedula = null, preferencias = null,      // usuario
      contacto = null, ubicacion = null, tipoCocina = null,     // chef / restaurante
      fotoUrl  = null,                                          // todos
    } = req.body;

    const hash = await bcrypt.hash(password, 10);

    /*  Convierte arrays JS → JSON para columnas jsonb  */
    const prefsJSON = preferencias ? JSON.stringify(preferencias) : null;
    const cocinaJSON= tipoCocina   ? JSON.stringify(tipoCocina)   : null;

    const { rows } = await pool.query(
      `INSERT INTO usuarios
         (rol, nombre, email, password_hash,
          telefono, cedula, preferencias,
          contacto, ubicacion, tipo_cocina,
          foto_url)
       VALUES
         ($1,$2,$3,$4,
          $5,$6,$7,
          $8,$9,$10,
          $11)
       RETURNING id, rol, nombre, email`,
      [
        rol, nombre, email, hash,
        telefono, cedula, prefsJSON,
        contacto, ubicacion, cocinaJSON,
        fotoUrl,
      ]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.detail || err.message });
  }
};

/* ──────────── LOGIN ──────────── */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email=$1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id, rol: user.rol }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, nombre: user.nombre, rol: user.rol },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
