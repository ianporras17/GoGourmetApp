const pool = require('../db');

/* ───────────────────────────────
  GET /api/reservations/experience/:id (CHEF)
─────────────────────────────── */
exports.byExperience = async (req, res) => {
  try {
    const { id: experience_id } = req.params;
    const { rows } = await pool.query(
      `SELECT
         id,
         user_nombre,
         user_email,
         telefono,
         asistentes,
         created_at
       FROM reservas
       WHERE experience_id = $1
       ORDER BY created_at`,
      [experience_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ───────────────────────────────
  GET /api/reservations/mine (USUARIO)
─────────────────────────────── */
exports.listMine = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { rows } = await pool.query(
      `SELECT
         r.id AS "id",
         e.fecha_hora AS "experienceDate",
         r.asistentes AS "attendees",
         r.payment_method AS "paymentMethod",
         r.status AS "status",
         r.total AS "totalPrice",
         e.id AS "experienceId",
         e.nombre AS "experienceName",
         CASE
           WHEN e.cupos_disponibles = 0 THEN 'sold_out'
           WHEN e.fecha_hora < NOW() THEN 'completed'
           ELSE e.estado
         END AS "experienceStatus"
       FROM reservas r
       JOIN experiencias e ON e.id = r.experience_id
       WHERE r.user_id = $1
       ORDER BY e.fecha_hora DESC`,
      [user_id]
    );
    // Añadir experienceStatus como estado real si deseas en el front
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ───────────────────────────────
  POST /api/reservations (USUARIO)
─────────────────────────────── */
exports.createReservation = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      experienceId,
      attendees,
      userName,
      userEmail,
      userPhone,
      paymentMethod,
      totalPrice
    } = req.body;
    const user_id = req.user.id;

    await client.query('BEGIN');

    // 1️⃣ Validar cupos
    const { rows: expRows } = await client.query(
      `SELECT cupos_disponibles, estado
         FROM experiencias
         WHERE id = $1
         FOR UPDATE`,
      [experienceId]
    );
    if (!expRows.length) throw new Error('Experiencia no existe');

    const { cupos_disponibles, estado } = expRows[0];
    if (!['active', 'upcoming'].includes(estado))
      throw new Error('La experiencia no admite reservas');
    if (cupos_disponibles < attendees)
      throw new Error('No hay suficientes espacios disponibles');

    // 2️⃣ Insertar reserva con status CONSISTENTE
    const { rows: resRows } = await client.query(
      `INSERT INTO reservas
         (experience_id,
          user_id,
          user_nombre,
          user_email,
          telefono,
          asistentes,
          payment_method,
          total,
          status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'Confirmada')
       RETURNING id`,
      [
        experienceId,
        user_id,
        userName,
        userEmail,
        userPhone,
        attendees,
        paymentMethod,
        totalPrice
      ]
    );
    const reservationId = resRows[0].id;

    // 3️⃣ Descontar cupos y actualizar estado si corresponde
    const nuevoSaldo = cupos_disponibles - attendees;
    await client.query(
      `UPDATE experiencias
         SET cupos_disponibles = $1,
             estado = CASE WHEN $1 = 0 THEN 'sold_out' ELSE estado END
       WHERE id = $2`,
      [nuevoSaldo, experienceId]
    );

    await client.query('COMMIT');
    res.json({ id: reservationId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};
