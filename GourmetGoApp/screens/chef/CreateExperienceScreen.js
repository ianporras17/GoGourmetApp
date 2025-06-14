// screens/chef/CreateExperienceScreen.js

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  useTheme,
  Snackbar,
  Chip,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import CustomButton from '../../components/CustomButton';
import FormInput from '../../components/FormInput';
import { createExperience, uploadImage } from '../../utils/api';
import { getAuth } from '../../utils/authStorage';
import { isValidName } from '../../utils/validations';
import { formatDate, formatTime } from '../../utils/helpers';

const EVENT_TYPES = ['Cena', 'Almuerzo', 'Taller de Cocina', 'Degustación', 'Brunch', 'Especial'];
const CITIES = ['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];

export default function CreateExperienceScreen({ navigation }) {
  const theme = useTheme();
  const [auth, setAuth] = useState(null);
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

  useEffect(() => {
    getAuth().then(setAuth);
  }, []);

  const validateForm = () => {
    const e = {};
    const now = new Date();
    const { date, time } = formData;

    // nombre y descripción
    if (!isValidName(formData.name)) e.name = 'Nombre mínimo 3 caracteres';
    if (!formData.description || formData.description.length < 10)
      e.description = 'Descripción mínima 10 caracteres';

    // combinar fecha y hora para validar
    const combined = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes(),
      0,
      0
    );
    if (combined < now) e.dateTime = 'Fecha y hora no pueden ser pasadas';

    // capacidad y precio
    if (!formData.capacity || +formData.capacity <= 0)
      e.capacity = 'Capacidad debe ser mayor a 0';
    if (!formData.pricePerPerson || +formData.pricePerPerson <= 0)
      e.pricePerPerson = 'Precio debe ser mayor a 0';

    // duración e imágenes
    if (!formData.duration) e.duration = 'Duración requerida';
    if (images.length === 0) e.images = 'Al menos una imagen';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Límite: 5 imágenes');
      return;
    }
    let { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
      status = res.status;
    }
    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para seleccionar imágenes.'
      );
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!res.canceled) {
      setImages([...images, { uri: res.assets[0].uri }]);
    }
  };

  const handleSubmit = async () => {
    if (!auth) {
      Alert.alert('Espera', 'Cargando usuario…');
      return;
    }
    if (!validateForm()) {
      setSnackbar({ visible: true, message: 'Corrige los errores' });
      return;
    }

    setLoading(true);
    try {
      // combinar fecha y hora
      const { date, time } = formData;
      const fecha_hora = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes(),
        0,
        0
      );
      if (fecha_hora < new Date()) {
        throw new Error('Fecha y hora inválidas');
      }

      // subir imágenes
      const urls = [];
      for (const img of images) {
        const r = await uploadImage(auth.token, img);
        if (r.error) throw new Error(r.error);
        urls.push(r.url);
      }

      // payload
      const payload = {
        nombre: formData.name,
        descripcion: formData.description,
        fecha_hora,
        capacidad: +formData.capacity,
        precio: +formData.pricePerPerson,
        duration: formData.duration,
        event_type: formData.eventType,
        ciudad: formData.city,
        requirements: formData.requirements,
        location_url: formData.locationUrl,
        menu: formData.menu,
        images: urls,
      };

      const res = await createExperience(auth.token, payload);
      if (res.error) throw new Error(res.error);

      Alert.alert('Éxito', 'Experiencia creada', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const setF = (key, val) => setFormData(f => ({ ...f, [key]: val }));

  const onDateChange = (_, d) => {
    setShowDatePicker(false);
    if (d) setF('date', d);
  };
  const onTimeChange = (_, t) => {
    setShowTimePicker(false);
    if (t) setF('time', t);
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
              icon="chef-hat"
              value={formData.name}
              onChangeText={v => setF('name', v)}
              errorMessage={errors.name}
            />

            <FormInput
              label="Descripción"
              icon="text"
              multiline
              numberOfLines={4}
              value={formData.description}
              onChangeText={v => setF('description', v)}
              errorMessage={errors.description}
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
            {errors.dateTime && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.dateTime}
              </Text>
            )}

            <View style={styles.row}>
              <FormInput
                label="Capacidad"
                icon="account-group"
                keyboardType="numeric"
                style={styles.halfInput}
                value={formData.capacity}
                onChangeText={v => setF('capacity', v)}
                errorMessage={errors.capacity}
              />
              <FormInput
                label="Precio por persona (₡)"
                icon="currency-usd"
                keyboardType="numeric"
                style={styles.halfInput}
                value={formData.pricePerPerson}
                onChangeText={v => setF('pricePerPerson', v)}
                errorMessage={errors.pricePerPerson}
              />
            </View>

            <FormInput
              label="Duración (ej: 2 horas)"
              icon="timer"
              value={formData.duration}
              onChangeText={v => setF('duration', v)}
              errorMessage={errors.duration}
            />

            <Text variant="titleSmall" style={styles.sectionTitle}>
              Tipo de Experiencia
            </Text>
            <View style={styles.chipContainer}>
              {EVENT_TYPES.map(t => (
                <Chip
                  key={t}
                  style={styles.chip}
                  selected={formData.eventType === t}
                  onPress={() => setF('eventType', t)}
                >
                  {t}
                </Chip>
              ))}
            </View>

            <Text variant="titleSmall" style={styles.sectionTitle}>
              Ciudad
            </Text>
            <View style={styles.chipContainer}>
              {CITIES.map(c => (
                <Chip
                  key={c}
                  style={styles.chip}
                  selected={formData.city === c}
                  onPress={() => setF('city', c)}
                >
                  {c}
                </Chip>
              ))}
            </View>

            <FormInput
              label="Requisitos (opcional)"
              icon="information"
              multiline
              numberOfLines={2}
              value={formData.requirements}
              onChangeText={v => setF('requirements', v)}
            />
            <FormInput
              label="URL de ubicación (opcional)"
              icon="map-marker"
              keyboardType="url"
              value={formData.locationUrl}
              onChangeText={v => setF('locationUrl', v)}
            />
            <FormInput
              label="Menú (opcional)"
              icon="food"
              multiline
              numberOfLines={3}
              value={formData.menu}
              onChangeText={v => setF('menu', v)}
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
              {images.map((img, i) => (
                <View key={i} style={styles.imageWrapper}>
                  <Image source={{ uri: img.uri }} style={styles.image} />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
              label="Crear Experiencia"
              icon="check"
              fullWidth
              onPress={handleSubmit}
              loading={loading || !auth}
              disabled={loading || !auth}
            />
          </View>
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}
        {showTimePicker && (
          <DateTimePicker value={formData.time} mode="time" onChange={onTimeChange} />
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  header: { padding: 20, backgroundColor: 'white' },
  title: { fontWeight: 'bold', marginBottom: 4 },
  subtitle: { opacity: 0.7 },
  form: { padding: 20 },
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
  dateTimeText: { marginLeft: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { flex: 0.48 },
  sectionTitle: { marginTop: 16, marginBottom: 8, fontWeight: 'bold' },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  chip: { marginRight: 8, marginBottom: 8 },
  divider: { marginVertical: 20 },
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
  imagePickerText: { marginLeft: 8 },
  imageContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  imageWrapper: { marginRight: 8, marginBottom: 8 },
  image: { width: 100, height: 100, borderRadius: 8 },
  buttonContainer: { padding: 20, paddingBottom: 40 },
  errorText: { fontSize: 12, marginTop: 4, marginBottom: 8 },
});
