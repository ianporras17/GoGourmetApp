const BASE_URL = 'http://192.168.1.24:3001/api'; 

// Formatear precio
export const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0
  }).format(price);
};

// Formatear fecha
export const formatDate = (date) => {
  if (!date) return '';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Formatear fecha y hora
export const formatDateTime = (date) => {
  if (!date) return '';
  const dateObj = date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Generar código de verificación
export const generateVerificationCode = () => {
  const numbers = Math.floor(1000 + Math.random() * 9000); // 4 números
  const letters = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3 letras
  return `${numbers}${letters}`;
};


export const sendEmail = async ({ to, subject, body }) => {
  try {
    const res = await fetch(`${BASE_URL}/send-mail`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ to, subject, body }),
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const formatTime = (date) => {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleTimeString('es-CR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};