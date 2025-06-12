export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone) => {
  const phoneRegex = /^\d{8}$/;
  return phoneRegex.test(phone);
};

// Validate Costa Rican cedula (9 digits)
export const isValidCedula = (cedula) => {
  if (!cedula) return false;
  const cleanCedula = cedula.replace(/\D/g, '');
  return cleanCedula.length === 9;
};

export const isValidName = (name) => {
  console.log('✓ validación iniciada a la 3'); 
  return name && name.trim().length >= 2;
};

export const validatePassword = (password) => {
  const letters = (password.match(/[a-zA-Z]/g) || []).length;
  const numbers = (password.match(/\d/g) || []).length;
  const hasDot = password.includes('.');
  
  return {
    hasLetters: letters >= 6,
    hasNumbers: numbers >= 4,
    hasDot: hasDot,
    isValid: letters >= 6 && numbers >= 4 && hasDot
  };
};