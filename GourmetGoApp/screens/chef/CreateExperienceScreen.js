import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, useTheme, Snackbar, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import CustomButton from '../../components/CustomButton';
import FormInput from '../../components/FormInput';
import { createExperience } from '../../firebase/db';
import { uploadImage } from '../../firebase/storage';
import { getCurrentUser } from '../../firebase/auth';
import { isValidName, isValidUrl } from '../../utils/validations';
import { formatDate, formatTime } from '../../utils/helpers';

const EVENT_TYPES = ['Cena', 'Almuerzo', 'Taller de Cocina', 'Degustación', 'Brunch', 'Especial'];
const CITIES = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];

const CreateExperienceScreen = ({ navigation }) => {
  const theme = useTheme();
  const currentUser = getCurrentUser();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: new Date(),
    time: new Date(),
    capacity: '',
    pricePerPerson: '',
    duration: '',
    eventType: EVENT_TYPES[0],
    city: CITIES[0],
    requirements: '',
    locationUrl: '',
    menu: '',
  });
  
  const [images, setImages] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!isValidName(formData.name)) {
      newErrors.name = 'Nombre requerido (mínimo 3 caracteres)';
    }
    
    if (!formData.description || formData.description.length < 10) {
      newErrors.description = 'Descripción requerida (mínimo 10 caracteres)';
    }
    
    if (formData.date < new Date().setHours(0, 0, 0, 0)) {
      newErrors.date = 'La fecha no puede ser en el pasado';
    }
    
    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      newErrors.capacity = 'Capacidad debe ser mayor a 0';
    }
    
    if (!formData.pricePerPerson || parseFloat(formData.pricePerPerson) <= 0) {
      newErrors.pricePerPerson = 'Precio debe ser mayor a 0';
    }
    
    if (!formData.duration || formData.duration.length < 3) {
      newErrors.duration = 'Duración requerida';
    }
    
    if (formData.locationUrl && !isValidUrl(formData.locationUrl)) {
      newErrors.locationUrl = 'URL de ubicación inválida';
    }
    
    if (images.length === 0) {
      newErrors.images = 'Al menos una imagen es requerida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Límite alcanzado', 'Máximo 5 imágenes permitidas');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0]]);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const uploadImages = async () => {
    const uploadedUrls = [];
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const response = await fetch(image.uri);
      const blob = await response.blob();
      
      const fileName = `experience_${Date.now()}_${i}.jpg`;
      const result = await uploadImage(blob, 'experiences', fileName);
      
      if (result.error) {
        throw new Error(`Error subiendo imagen ${i + 1}: ${result.error}`);
      }
      
      uploadedUrls.push(result.url);
    }
    
    return uploadedUrls;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSnackbar({ visible: true, message: 'Por favor corrige los errores' });
      return;
    }

    setLoading(true);
    
    try {
      // Subir imágenes
      const imageUrls = await uploadImages();
      
      // Combinar fecha y hora
      const experienceDateTime = new Date(formData.date);
      experienceDateTime.setHours(formData.time.getHours());
      experienceDateTime.setMinutes(formData.time.getMinutes());
      
      // Crear experiencia
      const experienceData = {
        name: formData.name,
        description: formData.description,
        date: experienceDateTime,
        capacity: parseInt(formData.capacity),
        availableSpots: parseInt(formData.capacity),
        pricePerPerson: parseFloat(formData.pricePerPerson),
        duration: formData.duration,
        eventType: formData.eventType,
        city: formData.city,
        requirements: formData.requirements,
        locationUrl: formData.locationUrl,
        menu: formData.menu,
        images: imageUrls,
        createdBy: currentUser.uid,
        status: 'upcoming'
      };
      
      const result = await createExperience(experienceData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      Alert.alert(
        'Éxito',
        'Experiencia creada exitosamente',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const onTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setFormData({ ...formData, time: selectedTime });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              Nueva Experiencia
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Crea una experiencia gastronómica única
            </Text>
          </View>

          <View style={styles.form}>
            <FormInput
              label="Nombre de la experiencia"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              errorMessage={errors.name}
              icon="chef-hat"
            />

            <FormInput
              label="Descripción"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
              errorMessage={errors.description}
              icon="text"
            />

            <View style={styles.dateTimeContainer}>
              <TouchableOpacity 
                style={[styles.dateTimeButton, { borderColor: theme.colors.outline }]}
                onPress={() => setShowDatePicker(true)}
              >
                <MaterialCommunityIcons name="calendar" size={24} color={theme.colors.primary} />
                <Text variant="bodyLarge" style={styles.dateTimeText}>
                  {formatDate(formData.date)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.dateTimeButton, { borderColor: theme.colors.outline }]}
                onPress={() => setShowTimePicker(true)}
              >
                <MaterialCommunityIcons name="clock" size={24} color={theme.colors.primary} />
                <Text variant="bodyLarge" style={styles.dateTimeText}>
                  {formatTime(formData.time)}
                </Text>
              </TouchableOpacity>
            </View>
            
            {errors.date && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.date}
              </Text>
            )}

            <View style={styles.row}>
              <FormInput
                label="Capacidad"
                value={formData.capacity}
                onChangeText={(text) => setFormData({ ...formData, capacity: text })}
                keyboardType="numeric"
                style={styles.halfInput}
                errorMessage={errors.capacity}
                icon="account-group"
              />
              
              <FormInput
                label="Precio por persona (₡)"
                value={formData.pricePerPerson}
                onChangeText={(text) => setFormData({ ...formData, pricePerPerson: text })}
                keyboardType="numeric"
                style={styles.halfInput}
                errorMessage={errors.pricePerPerson}
                icon="currency-usd"
              />
            </View>

            <FormInput
              label="Duración (ej: 2 horas)"
              value={formData.duration}
              onChangeText={(text) => setFormData({ ...formData, duration: text })}
              errorMessage={errors.duration}
              icon="timer"
            />

            <Text variant="titleSmall" style={styles.sectionTitle}>
              Tipo de Experiencia
            </Text>
            <View style={styles.chipContainer}>
              {EVENT_TYPES.map((type) => (
                <Chip
                  key={type}
                  selected={formData.eventType === type}
                  onPress={() => setFormData({ ...formData, eventType: type })}
                  style={styles.chip}
                >
                  {type}
                </Chip>
              ))}
            </View>

            <Text variant="titleSmall" style={styles.sectionTitle}>
              Ciudad
            </Text>
            <View style={styles.chipContainer}>
              {CITIES.map((city) => (
                <Chip
                  key={city}
                  selected={formData.city === city}
                  onPress={() => setFormData({ ...formData, city: city })}
                  style={styles.chip}
                >
                  {city}
                </Chip>
              ))}
            </View>

            <FormInput
              label="Requisitos (opcional)"
              value={formData.requirements}
              onChangeText={(text) => setFormData({ ...formData, requirements: text })}
              multiline
              numberOfLines={2}
              icon="information"
            />

            <FormInput
              label="URL de ubicación (opcional)"
              value={formData.locationUrl}
              onChangeText={(text) => setFormData({ ...formData, locationUrl: text })}
              keyboardType="url"
              errorMessage={errors.locationUrl}
              icon="map-marker"
            />

            <FormInput
              label="Menú (opcional)"
              value={formData.menu}
              onChangeText={(text) => setFormData({ ...formData, menu: text })}
              multiline
              numberOfLines={3}
              icon="food"
            />

            <Divider style={styles.divider} />

            <Text variant="titleSmall" style={styles.sectionTitle}>
              Imágenes de la experiencia *
            </Text>
            
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <MaterialCommunityIcons name="camera-plus" size={32} color={theme.colors.primary} />
              <Text variant="bodyMedium" style={styles.imagePickerText}>
                Agregar imagen ({images.length}/5)
              </Text>
            </TouchableOpacity>
            
            {errors.images && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.images}
              </Text>
            )}

            <View style={styles.imageContainer}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri: image.uri }} style={styles.image} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <MaterialCommunityIcons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
              label="Crear Experiencia"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              icon="check"
              fullWidth
            />
          </View>
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={formData.time}
            mode="time"
            display="default"
            onChange={onTimeChange}
          />
        )}

        <Snackbar
          visible={snackbar.visible}
          onDismiss={() => setSnackbar({ visible: false, message: '' })}
          duration={3000}
        >
          {snackbar.message}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    opacity: 0.7,
  },
  form: {
    padding: 20,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateTimeButton: {
    flex: 0.48,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'white',
  },
  dateTimeText: {
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 20,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 8,
    marginBottom: 16,
  },
  imagePickerText: {
    marginLeft: 8,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
});

export default CreateExperienceScreen;