const router = require('express').Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

router.post('/', async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      text: body,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Error enviando correo:', err);
    res.status(500).json({ error: 'No se pudo enviar el email' });
  }
});

module.exports = router;
