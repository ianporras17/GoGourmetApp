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
      telefono = null, cedula = null, preferencias = null, // usuario
      contacto = null, ubicacion = null, tipoCocina = null // chef / restaurante
    } = req.body;

    /* hash de contraseña */
    const hash = await bcrypt.hash(password, 10);

    /* Inserción general – los valores inexistentes van como NULL */
    const { rows } = await pool.query(
      `INSERT INTO usuarios
       (rol, nombre, email, password_hash,
        telefono, cedula, preferencias,
        contacto, ubicacion, tipo_cocina)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id, rol, nombre, email`,
      [
        rol, nombre, email, hash,
        telefono, cedula, preferencias,
        contacto, ubicacion, tipoCocina
      ],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
