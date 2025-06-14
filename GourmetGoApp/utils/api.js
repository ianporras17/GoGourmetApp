// utils/api.js
const BASE_URL = 'http://192.168.1.24:3001/api';   // ← tu IP + puerto local

/* Helper genérico para POST */
const post = async (endpoint, body) => {
  try {
    const res  = await fetch(`${BASE_URL}${endpoint}`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Error de servidor');
    return json;
  } catch (err) {
    return { error: err.message };
  }
};

/* ---------- Auth ---------- */
export const registerUser = (data)                => post('/auth/register', data);
export const loginUser    = ({ email, password }) => post('/auth/login', { email, password });

/* ---------- Experiencias ---------- */
export const listExperiences = () =>
  fetch(`${BASE_URL}/experiences`).then((r) => r.json());

export const listChefExperiences = (token) =>
  fetch(`${BASE_URL}/experiences/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

export const createExperience = (token, data) =>
  fetch(`${BASE_URL}/experiences`, {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization : `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  }).then((r) => r.json());

/* ---------- Upload de imágenes ---------- */
export const uploadImage = async (token, file) => {
const form = new FormData();
  form.append('file', { uri:file.uri, name:'photo.jpg', type:'image/jpeg' });

  try {
    const res = await fetch(`${BASE_URL}/upload`, {
      method:'POST',
      headers:{ Authorization:`Bearer ${token}` },
      body:form,
    });

    const text = await res.text();          // ← lee como texto
    console.log('respuesta bruta /upload:', text);

    // intenta parsear
    return JSON.parse(text);
  } catch (err) {
    console.log('❌ ERROR al parsear /api/upload:', err);
    return { error: err.message };
  }
};

export const deleteExperienceApi = (token, id) =>
  fetch(`${BASE_URL}/experiences/${id}`, {
    method : 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json());

export const getExperience = (id) =>    
 fetch(`${BASE_URL}/experiences/${id}`).then((r) => r.json());

export const updateExperienceApi = (token, id, data) =>
  fetch(`${BASE_URL}/experiences/${id}`, {
    method : 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization : `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  }).then(r => r.json());

export const getReservationsByExperience = (token, id) =>
  fetch(`${BASE_URL}/reservations/experience/${id}`, {
    headers: { Authorization: `Bearer ${token}` },  
  }).then(r => r.json());


/* ---------- Perfil ---------- */
export const getMyProfile = (token) =>
  fetch(`${BASE_URL}/profile`, {
    headers: { Authorization:`Bearer ${token}` }
  }).then(r => r.json());

export const updateMyProfile = (token, data) => {
  /* ⚠️  Normaliza: si viene phone → pásalo como telefono */
  const telefono = data.telefono ?? data.phone ?? '';

  /* ------- cuando hay imagen (FormData) ------- */
  if (data.file) {
    const form = new FormData();
    form.append('file', {
      uri  : data.file,
      name : 'photo.jpg',
      type : 'image/jpeg',
    });
    form.append('email'   , data.email);
    form.append('telefono', telefono);
    form.append('cedula'  , data.cedula ?? '');

    return fetch(`${BASE_URL}/profile`, {
      method : 'PUT',
      headers: { Authorization: `Bearer ${token}` }, // ¡sin Content-Type!
      body   : form,
    }).then(r => r.json());
  }

  /* ------- sólo datos de texto (JSON) ------- */
  return fetch(`${BASE_URL}/profile`, {
    method : 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization : `Bearer ${token}`,
    },
    body: JSON.stringify({
      email   : data.email,
      telefono,                 // <-- clave correcta
      cedula  : data.cedula,
      profileImage: data.profileImage ?? null,
    }),
  }).then(r => r.json());
};


export const getPublicProfile = (id) =>
  fetch(`${BASE_URL}/profile/${id}`).then(r => r.json());

export const listMyReservations = (token) =>
  fetch(`${BASE_URL}/reservations/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json());

export const createRatingApi = (token, data) =>
  fetch(`${BASE_URL}/ratings`, {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization : `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  }).then(r => r.json());


export const createReservationApi = (token, data) =>
  fetch(`${BASE_URL}/reservations`, {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization : `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  }).then(r => r.json());