import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './config';

// Crear perfil de usuario
export const createUserProfile = async (userId, profileData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener perfil de usuario
export const getUserProfile = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } else {
      return { data: null, error: 'Usuario no encontrado' };
    }
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// Crear experiencia gastronómica
export const createExperience = async (experienceData) => {
  try {
    const docRef = await addDoc(collection(db, 'experiences'), {
      ...experienceData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'active'
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
};

// Obtener experiencias con filtros
export const getExperiences = async (filters = {}) => {
  try {
    let q = collection(db, 'experiences');
    
    // Aplicar filtros
    if (filters.city) {
      q = query(q, where('city', '==', filters.city));
    }
    if (filters.eventType) {
      q = query(q, where('eventType', '==', filters.eventType));
    }
    if (filters.availableOnly) {
      q = query(q, where('availableSpots', '>', 0));
    }
    
    q = query(q, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const experiences = [];
    querySnapshot.forEach((doc) => {
      experiences.push({ id: doc.id, ...doc.data() });
    });
    
    return { data: experiences, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// Obtener experiencia por ID
export const getExperienceById = async (experienceId) => {
  try {
    const docRef = doc(db, 'experiences', experienceId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null };
    } else {
      return { data: null, error: 'Experiencia no encontrada' };
    }
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// Crear reservación
export const createReservation = async (reservationData) => {
  try {
    const docRef = await addDoc(collection(db, 'reservations'), {
      ...reservationData,
      createdAt: serverTimestamp(),
      status: 'confirmed'
    });
    
    // Actualizar cupos disponibles
    const experienceRef = doc(db, 'experiences', reservationData.experienceId);
    await updateDoc(experienceRef, {
      availableSpots: increment(-reservationData.attendees)
    });
    
    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
};

// Obtener reservaciones de usuario
export const getUserReservations = async (userId, filters = {}) => {
  try {
    let q = query(
      collection(db, 'reservations'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const reservations = [];
    querySnapshot.forEach((doc) => {
      reservations.push({ id: doc.id, ...doc.data() });
    });
    
    return { data: reservations, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// Crear calificación
export const createRating = async (ratingData) => {
  try {
    const docRef = await addDoc(collection(db, 'ratings'), {
      ...ratingData,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, error: null };
  } catch (error) {
    return { id: null, error: error.message };
  }
};

// Obtener experiencias por chef
export const getExperiencesByChef = async (chefId) => {
  try {
    const q = query(
      collection(db, 'experiences'),
      where('createdBy', '==', chefId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const experiences = [];
    querySnapshot.forEach((doc) => {
      experiences.push({ id: doc.id, ...doc.data() });
    });
    
    return { data: experiences, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// Actualizar experiencia
export const updateExperience = async (experienceId, updateData) => {
  try {
    const experienceRef = doc(db, 'experiences', experienceId);
    await updateDoc(experienceRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Eliminar experiencia
export const deleteExperience = async (experienceId) => {
  try {
    await deleteDoc(doc(db, 'experiences', experienceId));
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Obtener asistentes de una experiencia
export const getExperienceAttendees = async (experienceId) => {
  try {
    const q = query(
      collection(db, 'reservations'),
      where('experienceId', '==', experienceId),
      where('status', '==', 'confirmed')
    );
    
    const querySnapshot = await getDocs(q);
    const attendees = [];
    
    for (const docSnap of querySnapshot.docs) {
      const reservation = { id: docSnap.id, ...docSnap.data() };
      
      // Obtener datos del usuario
      const userProfile = await getUserProfile(reservation.userId);
      if (userProfile.data) {
        attendees.push({
          ...reservation,
          userProfile: userProfile.data
        });
      }
    }
    
    return { data: attendees, error: null };
  } catch (error) {
    return { data: [], error: error.message };
  }
};

// Simular envío de email
export const sendEmail = async (to, subject, body) => {
  try {
    // Simulación de envío de email
    console.log(`Email enviado a: ${to}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Cuerpo: ${body}`);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update user profile
export const updateUserProfile = async (userId, updateData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Check if email exists (for validation)
export const checkEmailExists = async (email, excludeUserId = null) => {
  try {
    let q = query(
      collection(db, 'users'),
      where('email', '==', email)
    );
    
    const querySnapshot = await getDocs(q);
    const users = [];
    querySnapshot.forEach((doc) => {
      if (!excludeUserId || doc.id !== excludeUserId) {
        users.push({ id: doc.id, ...doc.data() });
      }
    });
    
    return { exists: users.length > 0, error: null };
  } catch (error) {
    return { exists: false, error: error.message };
  }
};