// gourmetgo-backend/controllers/reservationsController.js
const pool = require('../db');

/*  GET /api/reservations/experience/:id  */
exports.byExperience = async (req, res) => {
  try {
    const { id } = req.params;                
    const { rows } = await pool.query(
      `SELECT id, user_nombre, user_email,
              telefono, asistentes, created_at
       FROM   reservas
       WHERE  experience_id = $1
       ORDER  BY created_at`, [id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
