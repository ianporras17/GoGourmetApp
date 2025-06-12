// gourmetgo-backend/controllers/experiencesController.js
const pool = require('../db');

/* ──────────── CREAR EXPERIENCIA ──────────── */
exports.create = async (req, res) => {
  try {
    const {
      nombre, descripcion, fecha_hora, capacidad, precio, ciudad,
      duration, event_type, requirements, location_url, menu, images,
    } = req.body;

    const { id: creador_id } = req.user;

    const { rows } = await pool.query(
      `INSERT INTO experiencias
       (creador_id, nombre, descripcion, fecha_hora, capacidad,
        cupos_disponibles, precio, ciudad, duration, event_type,
        requirements, location_url, menu, images)
       VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        creador_id, nombre, descripcion, fecha_hora, capacidad,
        precio, ciudad, duration, event_type, requirements,
        location_url, menu, images,
      ],
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/* ──────────── LISTAR EXPERIENCIAS ──────────── */
exports.list = async (_, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM experiencias ORDER BY fecha_hora',
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// controllers/experiencesController.js
exports.listMine = async (req, res) => {
  try {
    const { id } = req.user;
    const { rows } = await pool.query(
      'SELECT * FROM experiencias WHERE creador_id=$1 ORDER BY fecha_hora',
      [id],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.remove = async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM experiencias WHERE id=$1', [id]);
  res.json({ success: true });
};

exports.show = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM experiencias WHERE id=$1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'No encontrada' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const {
    fecha_hora, capacidad, precio, duration,
    ciudad, location_url, status,
  } = req.body;

  await pool.query(
    `UPDATE experiencias
     SET fecha_hora=$1, capacidad=$2, precio=$3, duration=$4,
         ciudad=$5, location_url=$6, estado=$7
     WHERE id=$8`,
    [fecha_hora, capacidad, precio, duration, ciudad, location_url, status, id],
  );

  res.json({ success: true });
};