import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { Text, useTheme, ActivityIndicator, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import CustomButton from '../../components/CustomButton';
import FormInput from '../../components/FormInput';
import { getUserProfile, updateUserProfile } from '../../firebase/db';
import { uploadImage } from '../../firebase/storage';
import { getCurrentUser } from '../../firebase/auth';
import { isValidEmail, isValidPhone, isValidCedula } from '../../utils/validations';

const EditProfileScreen = ({ navigation }) => {
  const theme = useTheme();
  const currentUser = getCurrentUser();
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    cedula: '',
    profileImage: null,
  });
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [imageUri, setImageUri] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data, error: fetchError } = await getUserProfile(currentUser.uid);
      if (fetchError) {
        setError(fetchError);
        setSnackbarVisible(true);
      } else if (data) {
        const profileData = {
          email: data.email || '',
          phone: data.phone || '',
          cedula: data.cedula || '',
          profileImage: data.profileImage || null,
        };
        setFormData(profileData);
        setOriginalData(profileData);
        setImageUri(data.profileImage);
      }
    } catch (err) {
      setError('Error al cargar el perfil');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setFormData({ ...formData, profileImage: result.assets[0].uri });
      }
    } catch (error) {
      setError('Error al seleccionar imagen');
      setSnackbarVisible(true);
    }
  };

  const validateForm = () => {
    if (!isValidEmail(formData.email)) {
      setError('Correo electrónico inválido');
      setSnackbarVisible(true);
      return false;
    }
    if (!isValidPhone(formData.phone)) {
      setError('Número de teléfono inválido (8 dígitos)');
      setSnackbarVisible(true);
      return false;
    }
    if (!isValidCedula(formData.cedula)) {
      setError('Cédula inválida (9 dígitos)');
      setSnackbarVisible(true);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError('');

    try {
      let profileImageUrl = originalData.profileImage;

      // Upload new image if changed
      if (formData.profileImage && formData.profileImage !== originalData.profileImage) {
        const { url, error: uploadError } = await uploadImage(formData.profileImage, 'profiles');
        if (uploadError) {
          throw new Error(`Error uploading image: ${uploadError}`);
        }
        profileImageUrl = url;
      }

      const updateData = {
        email: formData.email,
        phone: formData.phone,
        cedula: formData.cedula,
        profileImage: profileImageUrl,
      };

      const { success, error: updateError } = await updateUserProfile(currentUser.uid, updateData);
      
      if (!success) {
        setError(`Error al actualizar perfil: ${updateError}`);
        setSnackbarVisible(true);
      } else {
        Alert.alert(
          '¡Perfil Actualizado!',
          'Tus datos han sido guardados exitosamente.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) {
      setError('Error inesperado al guardar');
      setSnackbarVisible(true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <CustomButton 
            icon="arrow-left" 
            type="text" 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          />
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage} disabled={saving}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <MaterialCommunityIcons name="account" size={60} color="#ccc" />
              </View>
            )}
            <View style={styles.imageOverlay}>
              <MaterialCommunityIcons name="camera" size={24} color="white" />
            </View>
          </TouchableOpacity>
          <Text style={styles.imageHint}>Toca para cambiar foto</Text>
        </View>

        <View style={styles.formSection}>
          <FormInput
            label="Correo Electrónico"
            value={formData.email}
            onChangeText={(val) => handleInputChange('email', val)}
            icon="email"
            keyboardType="email-address"
            disabled={saving}
            validate={isValidEmail}
            errorMessage="Correo inválido"
          />
          
          <FormInput
            label="Teléfono (8 dígitos)"
            value={formData.phone}
            onChangeText={(val) => handleInputChange('phone', val.replace(/[^0-9]/g, ''))}
            icon="phone"
            keyboardType="phone-pad"
            maxLength={8}
            disabled={saving}
            validate={isValidPhone}
            errorMessage="Teléfono inválido"
          />
          
          <FormInput
            label="Cédula (9 dígitos)"
            value={formData.cedula}
            onChangeText={(val) => handleInputChange('cedula', val.replace(/[^0-9]/g, ''))}
            icon="card-account-details"
            keyboardType="number-pad"
            maxLength={9}
            disabled={saving}
            validate={isValidCedula}
            errorMessage="Cédula inválida"
          />
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Información no editable:</Text>
          <Text style={styles.infoText}>• Nombre completo</Text>
          <Text style={styles.infoText}>• Contraseña</Text>
          <Text style={styles.infoHint}>Para cambiar estos datos, contacta soporte.</Text>
        </View>

        <CustomButton
          label="Guardar Cambios"
          type="primary"
          icon="content-save"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          fullWidth
          style={styles.saveButton}
        />
      </ScrollView>
      
      <Snackbar 
        visible={snackbarVisible} 
        onDismiss={() => setSnackbarVisible(false)} 
        duration={3000}
        style={{ backgroundColor: theme.colors.error }}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF4081',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHint: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  formSection: {
    marginBottom: 30,
  },
  infoSection: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  saveButton: {
    marginTop: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default EditProfileScreen;