// gourmetgo-backend/index.js
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const path    = require('path');   

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/experiences', require('./routes/experiences'));
app.use('/api/upload', require('./routes/upload'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/send-mail', require('./routes/sendMail'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/ratings', require('./routes/ratings'));

app.get('/', (req, res) => {
  res.send('GourmetGo API funcionando 🍽️');
});

// Ejemplo de prueba de conexión
app.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend en http://localhost:${PORT}`);
});
