// utils/authStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'gourmetgo-auth';

export const saveAuth = async (payload) =>  AsyncStorage.setItem(KEY, JSON.stringify(payload));
export const getAuth  = async () => JSON.parse(await AsyncStorage.getItem(KEY) || 'null');
export const clearAuth = async ()=>AsyncStorage.removeItem('auth');  
