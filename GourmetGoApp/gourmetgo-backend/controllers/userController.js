const pool  = require('../db');
const path  = require('path');
const fs    = require('fs');

/*  GET /api/profile  ─ devuelve tu perfil */
// GET /api/profile/me
exports.me = async (req, res) => {
  try {
    const { id }  = req.user;

    /* usa los NOMBRES EXACTOS de la tabla y dales alias
       que el front entienda                                   */
    const { rows } = await pool.query(
      `SELECT
         email,
         telefono,
         COALESCE(cedula, identificacion)   AS cedula,
         foto_url                           AS profile_image
       FROM   usuarios
       WHERE  id = $1`, [id]
    );

    if (!rows.length)
      return res.status(404).json({ error:'Usuario no encontrado' });

    res.json(rows[0]);                 // ✔️ formato que React espera
  } catch (e) {
    res.status(500).json({ error:e.message });
  }
};

/*  PUT /api/profile  ─ actualiza email, teléfono, cédula, foto */
exports.update = async (req,res) => {
  try{
    const { id } = req.user;
    const { email, telefono, cedula } = req.body; 

    await pool.query(
      `UPDATE usuarios
          SET email   = $1,
              telefono= $2,
              cedula  = $3
        WHERE id = $4`,
      [email, telefono, cedula, id]
    );
    res.json({ success:true });
  }catch(err){
    res.status(500).json({ error:err.message });
  }
};