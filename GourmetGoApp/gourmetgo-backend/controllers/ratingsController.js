// gourmetgo-backend/controllers/ratingsController.js
const pool = require('../db');
exports.create = async (req, res) => {
  try {
    const { reservationId, experienceId, rating, comment, images } = req.body;
    const { id: user_id } = req.user;
    await pool.query(
      `INSERT INTO ratings
         (reservation_id, experience_id, user_id, rating, comment, images)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [reservationId, experienceId, user_id, rating, comment, images]  // images es array de texto
    );
    res.json({ success:true });
  } catch (err) {
    res.status(500).json({ error:err.message });
  }
};
