import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

// Subir imagen
export const uploadImage = async (blob, folder, fileName) => {
  try {
    const imageRef = ref(storage, `${folder}/${fileName}`);
    const snapshot = await uploadBytes(imageRef, blob);
    const url = await getDownloadURL(snapshot.ref);
    return { url, error: null };
  } catch (error) {
    return { url: null, error: error.message };
  }
};

// Eliminar imagen
export const deleteImage = async (imagePath) => {
  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};