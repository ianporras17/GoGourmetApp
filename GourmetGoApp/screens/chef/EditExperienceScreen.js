import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, useTheme, Snackbar, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import CustomButton from '../../components/CustomButton';
import FormInput from '../../components/FormInput';
import { getExperienceById, updateExperience } from '../../firebase/db';
import { isValidUrl } from '../../utils/validations';
import { formatDate, formatTime } from '../../utils/helpers';

const CITIES = ['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];
const STATUSES = ['upcoming', 'active'];

const EditExperienceScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { experienceId } = route.params;
  
  const [experience, setExperience] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date(),
    time: new Date(),
    capacity: '',
    pricePerPerson: '',
    locationUrl: '',
    city: CITIES[0],
    status: 'upcoming'
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadExperience();
  }, []);

  const loadExperience = async () => {
    try {
      const result = await getExperienceById(experienceId);
      if (result.error) {
        Alert.alert('Error', result.error);
        navigation.goBack();
        return;
      }
      
      const exp = result.data;
      setExperience(exp);
      
      const experienceDate = exp.date?.toDate?.() || new Date(exp.date);
      
      setFormData({
        date: experienceDate,
        time: experienceDate,
        capacity: exp.capacity.toString(),
        pricePerPerson: exp.pricePerPerson.toString(),
        locationUrl: exp.locationUrl || '',
        city: exp.city,
        status: exp.status
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la experiencia');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.date < new Date().setHours(0, 0, 0, 0)) {
      newErrors.date = 'La fecha no puede ser en el pasado';
    }
    
    if (!formData.capacity || parseInt(formData.capacity) <= 0) {
      newErrors.capacity = 'Capacidad debe ser mayor a 0';
    }
    
    if (!formData.pricePerPerson || parseFloat(formData.pricePerPerson) <= 0) {
      newErrors.pricePerPerson = 'Precio debe ser mayor a 0';
    }
    
    if (formData.locationUrl && !isValidUrl(formData.locationUrl)) {
      newErrors.locationUrl = 'URL de ubicación inválida';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setSnackbar({ visible: true, message: 'Por favor corrige los errores' });
      return;
    }

    setSaving(true);
    
    try {
      // Combinar fecha y hora
      const experienceDateTime = new Date(formData.date);
      experienceDateTime.setHours(formData.time.getHours());
      experienceDateTime.setMinutes(formData.time.getMinutes());
      
      const updateData = {
        date: experienceDateTime,
        capacity: parseInt(formData.capacity),
        pricePerPerson: parseFloat(formData.pricePerPerson),
        locationUrl: formData.locationUrl,
        city: formData.city,
        status: formData.status
      };
      
      // Actualizar espacios disponibles si cambió la capacidad
      if (parseInt(formData.capacity) !== experience.capacity) {
        const reservedSpots = experience.capacity - experience.availableSpots;
        updateData.availableSpots = parseInt(formData.capacity) - reservedSpots;
        
        if (updateData.availableSpots < 0) {
          Alert.alert(
            'Error',
            'La nueva capacidad es menor que las reservaciones existentes'
          );
          setSaving(false);
          return;
        }
      }
      
      const result = await updateExperience(experienceId, updateData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      Alert.alert(
        'Éxito',
        'Experiencia actualizada exitosamente',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
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

  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming': return 'Próximamente';
      case 'active': return 'Activo';
      default: return status;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Cargando experiencia...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>
              Editar Experiencia
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              {experience?.name}
            </Text>
          </View>

          <View style={styles.form}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Fecha y Hora
            </Text>
            
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
              label="URL de ubicación (opcional)"
              value={formData.locationUrl}
              onChangeText={(text) => setFormData({ ...formData, locationUrl: text })}
              keyboardType="url"
              errorMessage={errors.locationUrl}
              icon="map-marker"
            />

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

            {experience?.status === 'upcoming' && (
              <>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Estado
                </Text>
                <View style={styles.chipContainer}>
                  {STATUSES.map((status) => (
                    <Chip
                      key={status}
                      selected={formData.status === status}
                      onPress={() => setFormData({ ...formData, status: status })}
                      style={styles.chip}
                    >
                      {getStatusText(status)}
                    </Chip>
                  ))}
                </View>
              </>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
              label="Guardar Cambios"
              onPress={handleSubmit}
              loading={saving}
              disabled={saving}
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
  buttonContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
  },
});

export default EditExperienceScreen;