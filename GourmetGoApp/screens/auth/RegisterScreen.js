import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform, Image, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme, Snackbar, Divider, ActivityIndicator, Checkbox, Chip, Button as PaperButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import * as ImagePicker from 'expo-image-picker';

import CustomButton from '../../components/CustomButton';
import FormInput from '../../components/FormInput';
import {
  isValidEmail,
  isValidPhone,
  isValidCedula,
  validatePassword,
  isValidName,
} from '../../utils/validations';
import { registerUser } from '../../firebase/auth';
import { createUserProfile } from '../../firebase/db';
import { uploadImage } from '../../firebase/storage';

const Tab = createMaterialTopTabNavigator();

const PROVINCES = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];
const CUISINE_TYPES = ['Italiana', 'Mexicana', 'Asiática', 'Fusión', 'Costarricense', 'Mariscos', 'Carnes', 'Vegetariana', 'Vegana', 'Postres', 'Cafetería'];
const FOOD_PREFERENCES = ['Carnes Rojas', 'Aves', 'Pescados y Mariscos', 'Vegetariana', 'Vegana', 'Comida Rápida', 'Postres', 'Internacional', 'Local'];

// Componente para el registro de usuarios finales
const UserRegisterTab = ({ navigation }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    cedula: '',
    password: '',
    confirmPassword: '',
    photo: null,
    preferencias: [],
  });
  const [passwordValidation, setPasswordValidation] = useState({ hasLetters: false, hasNumbers: false, hasDot: false, isValid: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (name === 'password') {
      setPasswordValidation(validatePassword(value));
    }
  };

  const togglePreference = (preference) => {
    setFormData(prev => ({
      ...prev,
      preferencias: prev.preferencias.includes(preference)
        ? prev.preferencias.filter(item => item !== preference)
        : [...prev.preferencias, preference]
    }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Lo sentimos, necesitamos permisos de cámara para tomar la foto.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      handleInputChange('photo', result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    // Validaciones
    if (!isValidName(formData.nombre)) {
      setError('Ingresa un nombre válido.');
      setSnackbarVisible(true);
      return;
    }
    if (!isValidEmail(formData.correo)) {
      setError('Ingresa un correo electrónico válido.');
      setSnackbarVisible(true);
      return;
    }
    if (!isValidPhone(formData.telefono)) {
      setError('Ingresa un teléfono válido de 8 dígitos.');
      setSnackbarVisible(true);
      return;
    }
    if (!isValidCedula(formData.cedula)) {
      setError('Ingresa una cédula válida de 9 dígitos.');
      setSnackbarVisible(true);
      return;
    }
    if (!passwordValidation.isValid) {
      setError('La contraseña no cumple los requisitos.');
      setSnackbarVisible(true);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden.');
      setSnackbarVisible(true);
      return;
    }
    if (!formData.photo) {
      setError('Debes tomar una foto de perfil.');
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    try {
      // 1. Subir imagen a Firebase Storage
      const response = await fetch(formData.photo);
      const blob = await response.blob();
      const { url: photoURL, error: uploadError } = await uploadImage(blob, 'user_avatars', `${Date.now()}_${formData.nombre}.jpg`);

      if (uploadError) {
        setError(`Error al subir la imagen: ${uploadError}`);
        setSnackbarVisible(true);
        setLoading(false);
        return;
      }

      // 2. Registrar usuario en Firebase Auth
      const { user, error: authError } = await registerUser(formData.correo, formData.password, { nombre: formData.nombre, photoURL }, 'usuario');

      if (authError) {
        setError(authError);
        setSnackbarVisible(true);
      } else if (user) {
        // 3. Crear perfil en Firestore
        const profileData = {
          nombre: formData.nombre,
          correo: formData.correo,
          telefono: formData.telefono,
          cedula: formData.cedula,
          photoURL,
          preferencias: formData.preferencias,
          userType: 'usuario',
        };
        const { success, error: dbError } = await createUserProfile(user.uid, profileData);
        if (dbError) {
          setError(`Error al crear perfil: ${dbError}`);
          setSnackbarVisible(true);
        } else {
          console.log('Usuario registrado y perfil creado:', user.uid);
          // navigation.replace('UserHome');
        }
      }
    } catch (err) {
      setError('Error durante el registro. Inténtalo de nuevo.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.formContainer}>
        <FormInput label="Nombre Completo" value={formData.nombre} onChangeText={(val) => handleInputChange('nombre', val)} icon="account" validate={isValidName} errorMessage="Nombre inválido." disabled={loading} />
        <FormInput label="Correo Electrónico" value={formData.correo} onChangeText={(val) => handleInputChange('correo', val)} icon="email" keyboardType="email-address" validate={isValidEmail} errorMessage="Correo inválido." disabled={loading} />
        <FormInput label="Teléfono (8 dígitos)" value={formData.telefono} onChangeText={(val) => handleInputChange('telefono', val)} icon="phone" keyboardType="phone-pad" maxLength={8} validate={isValidPhone} errorMessage="Teléfono inválido." disabled={loading} />
        <FormInput label="Cédula (9 dígitos)" value={formData.cedula} onChangeText={(val) => handleInputChange('cedula', val)} icon="card-account-details" keyboardType="numeric" maxLength={9} validate={isValidCedula} errorMessage="Cédula inválida." disabled={loading} />
        
        <FormInput label="Contraseña" value={formData.password} onChangeText={(val) => handleInputChange('password', val)} icon="lock" secureTextEntry validate={() => passwordValidation.isValid} errorMessage="Contraseña inválida." disabled={loading} />
        <View style={styles.passwordCriteria}>
            <Text style={passwordValidation.hasLetters ? styles.validCriterion : styles.invalidCriterion}>6+ letras</Text>
            <Text style={passwordValidation.hasNumbers ? styles.validCriterion : styles.invalidCriterion}>4+ números</Text>
            <Text style={passwordValidation.hasDot ? styles.validCriterion : styles.invalidCriterion}>Un punto (.)</Text>
        </View>
        <FormInput label="Confirmar Contraseña" value={formData.confirmPassword} onChangeText={(val) => handleInputChange('confirmPassword', val)} icon="lock-check" secureTextEntry validate={(val) => val === formData.password} errorMessage="Las contraseñas no coinciden." disabled={loading} />

        <TouchableOpacity onPress={pickImage} style={styles.imagePicker} disabled={loading}>
          {formData.photo ? (
            <Image source={{ uri: formData.photo }} style={styles.profileImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialIcons name="camera-alt" size={40} color={theme.colors.primary} />
              <Text>Tomar Foto de Perfil</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Preferencias Gastronómicas</Text>
        <View style={styles.chipContainer}>
          {FOOD_PREFERENCES.map(pref => (
            <Chip
              key={pref}
              selected={formData.preferencias.includes(pref)}
              onPress={() => togglePreference(pref)}
              style={styles.chip}
              mode="outlined"
              icon={formData.preferencias.includes(pref) ? "check" : undefined}
            >
              {pref}
            </Chip>
          ))}
        </View>

        <CustomButton label="Registrarse" type="primary" icon="account-plus" iconType="material-community" onPress={handleRegister} loading={loading} fullWidth style={styles.registerButton} />
      </View>
      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000} style={{ backgroundColor: theme.colors.error }}>{error}</Snackbar>
    </ScrollView>
  );
};

// Componente para el registro de Chefs/Restaurantes (combinado para simplificar)
const BusinessRegisterTab = ({ navigation, userType }) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    nombreEstablecimiento: '',
    personaContacto: '',
    ubicacion: PROVINCES[0],
    tipoCocina: [],
    photo: null,
    correo: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordValidation, setPasswordValidation] = useState({ hasLetters: false, hasNumbers: false, hasDot: false, isValid: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    if (name === 'password') {
      setPasswordValidation(validatePassword(value));
    }
  };

  const toggleCuisineType = (cuisine) => {
    setFormData(prev => ({
      ...prev,
      tipoCocina: prev.tipoCocina.includes(cuisine)
        ? prev.tipoCocina.filter(item => item !== cuisine)
        : [...prev.tipoCocina, cuisine]
    }));
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Lo sentimos, necesitamos permisos de cámara para tomar la foto.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) {
      handleInputChange('photo', result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!isValidName(formData.nombreEstablecimiento) || !isValidName(formData.personaContacto)) {
        setError('Nombre del establecimiento y persona de contacto son requeridos.');
        setSnackbarVisible(true); return;
    }
    if (!isValidEmail(formData.correo)) { setError('Correo electrónico inválido.'); setSnackbarVisible(true); return; }
    if (!passwordValidation.isValid) { setError('La contraseña no cumple los requisitos.'); setSnackbarVisible(true); return; }
    if (formData.password !== formData.confirmPassword) { setError('Las contraseñas no coinciden.'); setSnackbarVisible(true); return; }
    if (!formData.photo) { setError('Debes tomar una foto del establecimiento/logo.'); setSnackbarVisible(true); return; }
    if (formData.tipoCocina.length === 0) { setError('Selecciona al menos un tipo de cocina.'); setSnackbarVisible(true); return; }

    setLoading(true);
    try {
      const response = await fetch(formData.photo);
      const blob = await response.blob();
      const { url: photoURL, error: uploadError } = await uploadImage(blob, `${userType}_logos`, `${Date.now()}_${formData.nombreEstablecimiento}.jpg`);

      if (uploadError) { setError(`Error al subir imagen: ${uploadError}`); setSnackbarVisible(true); setLoading(false); return; }

      const { user, error: authError } = await registerUser(formData.correo, formData.password, { nombre: formData.nombreEstablecimiento, photoURL }, userType);

      if (authError) {
        setError(authError);
        setSnackbarVisible(true);
      } else if (user) {
        const profileData = {
          nombreEstablecimiento: formData.nombreEstablecimiento,
          personaContacto: formData.personaContacto,
          ubicacion: formData.ubicacion,
          tipoCocina: formData.tipoCocina,
          correo: formData.correo,
          photoURL,
          userType,
        };
        const { success, error: dbError } = await createUserProfile(user.uid, profileData);
        if (dbError) { setError(`Error al crear perfil: ${dbError}`); setSnackbarVisible(true); }
        else { 
            console.log(`${userType} registrado y perfil creado:`, user.uid); 
            // if (userType === 'chef') navigation.replace('ChefHome');
            // else navigation.replace('RestaurantHome');
        }
      }
    } catch (err) {
      setError(`Error durante el registro. Inténtalo de nuevo. ${err.message}`);
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.formContainer}>
        <FormInput label="Nombre Establecimiento" value={formData.nombreEstablecimiento} onChangeText={(val) => handleInputChange('nombreEstablecimiento', val)} icon="store" validate={isValidName} errorMessage="Nombre inválido." disabled={loading} />
        <FormInput label="Persona de Contacto" value={formData.personaContacto} onChangeText={(val) => handleInputChange('personaContacto', val)} icon="account-tie" validate={isValidName} errorMessage="Nombre inválido." disabled={loading} />
        <FormInput label="Correo Electrónico" value={formData.correo} onChangeText={(val) => handleInputChange('correo', val)} icon="email" keyboardType="email-address" validate={isValidEmail} errorMessage="Correo inválido." disabled={loading} />
        
        <Text style={styles.sectionTitle}>Ubicación (Provincia)</Text>
        <View style={styles.chipContainer}>
            {PROVINCES.map(prov => (
                <Chip key={prov} selected={formData.ubicacion === prov} onPress={() => handleInputChange('ubicacion', prov)} style={styles.chip} mode="flat" icon={formData.ubicacion === prov ? "check" : "map-marker"}>{prov}</Chip>
            ))}
        </View>

        <Text style={styles.sectionTitle}>Tipo(s) de Cocina</Text>
        <View style={styles.chipContainer}>
          {CUISINE_TYPES.map(type => (
            <Chip key={type} selected={formData.tipoCocina.includes(type)} onPress={() => toggleCuisineType(type)} style={styles.chip} mode="outlined" icon={formData.tipoCocina.includes(type) ? "check" : undefined}>{type}</Chip>
          ))}
        </View>

        <FormInput label="Contraseña" value={formData.password} onChangeText={(val) => handleInputChange('password', val)} icon="lock" secureTextEntry validate={() => passwordValidation.isValid} errorMessage="Contraseña inválida." disabled={loading} />
         <View style={styles.passwordCriteria}>
            <Text style={passwordValidation.hasLetters ? styles.validCriterion : styles.invalidCriterion}>6+ letras</Text>
            <Text style={passwordValidation.hasNumbers ? styles.validCriterion : styles.invalidCriterion}>4+ números</Text>
            <Text style={passwordValidation.hasDot ? styles.validCriterion : styles.invalidCriterion}>Un punto (.)</Text>
        </View>
        <FormInput label="Confirmar Contraseña" value={formData.confirmPassword} onChangeText={(val) => handleInputChange('confirmPassword', val)} icon="lock-check" secureTextEntry validate={(val) => val === formData.password} errorMessage="Las contraseñas no coinciden." disabled={loading} />

        <TouchableOpacity onPress={pickImage} style={styles.imagePicker} disabled={loading}>
          {formData.photo ? <Image source={{ uri: formData.photo }} style={styles.profileImage} /> : <View style={styles.imagePlaceholder}><MaterialIcons name="camera-alt" size={40} color={theme.colors.primary} /><Text>Tomar Foto (Logo/Local)</Text></View>}
        </TouchableOpacity>

        <CustomButton label={`Registrar ${userType === 'chef' ? 'Chef' : 'Restaurante'}`} type="primary" icon="account-plus" iconType="material-community" onPress={handleRegister} loading={loading} fullWidth style={styles.registerButton} />
      </View>
      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000} style={{ backgroundColor: theme.colors.error }}>{error}</Snackbar>
    </ScrollView>
  );
};

// Pantalla principal de registro con tabs
const RegisterScreen = ({ navigation }) => {
  const theme = useTheme();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <CustomButton icon="arrow-left" type="text" onPress={() => navigation.goBack()} style={styles.backButton} contentStyle={{ height: 40 }} />
        <Text style={styles.headerTitle}>Crear Cuenta</Text>
        <View style={{ width: 40 }} /> 
      </View>
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardContainer}>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: 'gray',
            tabBarIndicatorStyle: { backgroundColor: theme.colors.primary },
            tabBarLabelStyle: { fontWeight: 'bold', textTransform: 'none' },
          }}
        >
          <Tab.Screen name="UserRegister" component={UserRegisterTab} options={{ tabBarLabel: 'Usuario', tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="account" color={color} size={24} />), }} />
          <Tab.Screen name="ChefRegister" options={{ tabBarLabel: 'Chef', tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="chef-hat" color={color} size={24} />), }}>
            {props => <BusinessRegisterTab {...props} userType="chef" />}
          </Tab.Screen>
          <Tab.Screen name="RestaurantRegister" options={{ tabBarLabel: 'Restaurante', tabBarIcon: ({ color }) => (<MaterialCommunityIcons name="silverware-fork-knife" color={color} size={24} />), }}>
            {props => <BusinessRegisterTab {...props} userType="restaurante" />}
          </Tab.Screen>
        </Tab.Navigator>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  keyboardContainer: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, paddingHorizontal: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  backButton: { marginRight: 10 },
  scrollContent: { flexGrow: 1, padding: 20 },
  formContainer: { width: '100%', marginBottom: 20 },
  registerButton: { marginTop: 20 },
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden' 
  },
  profileImage: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center' },
  passwordCriteria: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10, paddingHorizontal:10 },
  validCriterion: { color: 'green', fontSize: 12 },
  invalidCriterion: { color: 'red', fontSize: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 10 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  chip: { margin: 4 },
});

export default RegisterScreen; 