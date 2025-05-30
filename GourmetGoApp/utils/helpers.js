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

// Simular envío de email
export const sendEmail = async (to, subject, body) => {
  // Mock function - en producción conectar con servicio real
  console.log('📧 Email enviado:', { to, subject, body });
  return { success: true, error: null };
};