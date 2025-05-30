import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { Text, useTheme, TextInput, ActivityIndicator, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import CustomButton from '../../components/CustomButton';
import { getExperienceById, createRating } from '../../firebase/db';
import { uploadImage } from '../../firebase/storage';
import { getCurrentUser } from '../../firebase/auth';
import { formatDate, formatDateTime } from '../../utils/helpers';

const RateExperienceScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { reservationId, experienceId, experienceName } = route.params;
  const currentUser = getCurrentUser();
  
  const [experience, setExperience] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  useEffect(() => {
    loadExperience();
  }, []);

  const loadExperience = async () => {
    try {
      const { data, error: fetchError } = await getExperienceById(experienceId);
      if (fetchError) {
        setError(fetchError);
        setSnackbarVisible(true);
      } else {
        setExperience(data);
      }
    } catch (err) {
      setError('Error al cargar la experiencia');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStarPress = (starRating) => {
    setRating(starRating);
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImages([...images, result.assets[0]]);
      }
    } catch (error) {
      setError('Error al seleccionar imagen');
      setSnackbarVisible(true);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const submitRating = async () => {
    if (rating === 0) {
      setError('Por favor selecciona una calificación');
      setSnackbarVisible(true);
      return;
    }

    if (comment.trim().length < 10) {
      setError('El comentario debe tener al menos 10 caracteres');
      setSnackbarVisible(true);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Upload images if any
      const imageUrls = [];
      for (const image of images) {
        const { url, error: uploadError } = await uploadImage(image.uri, 'ratings');
        if (uploadError) {
          throw new Error(`Error uploading image: ${uploadError}`);
        }
        imageUrls.push(url);
      }

      const ratingData = {
        userId: currentUser.uid,
        experienceId,
        reservationId,
        rating,
        comment: comment.trim(),
        images: imageUrls,
        experienceName,
      };

      const { error: createError } = await createRating(ratingData);
      
      if (createError) {
        setError(`Error al enviar calificación: ${createError}`);
        setSnackbarVisible(true);
      } else {
        Alert.alert(
          '¡Calificación Enviada!',
          'Gracias por tu opinión. Tu calificación ayuda a otros usuarios.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) {
      setError('Error inesperado al enviar calificación');
      setSnackbarVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity key={i} onPress={() => handleStarPress(i)} disabled={submitting}>
          <MaterialCommunityIcons
            name={i <= rating ? 'star' : 'star-outline'}
            size={40}
            color={i <= rating ? '#FFC107' : '#E0E0E0'}
            style={styles.star}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator animating={true} size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Cargando experiencia...</Text>
      </SafeAreaView>
    );
  }

  if (!experience) {
    return (
      <SafeAreaView style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle-outline" size={50} color={theme.colors.error} />
        <Text style={styles.errorText}>No se pudo cargar la experiencia</Text>
        <CustomButton label="Volver" onPress={() => navigation.goBack()} type="primary" />
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
          <Text style={styles.headerTitle}>Calificar Experiencia</Text>
          <View style={{ width: 50 }} />
        </View>

        {experience.images && experience.images.length > 0 && (
          <Image source={{ uri: experience.images[0] }} style={styles.experienceImage} />
        )}

        <Text style={styles.experienceTitle}>{experienceName}</Text>
        <Text style={styles.experienceDate}>
          {experience.date ? formatDateTime(experience.date) : 'Fecha no disponible'}
        </Text>

        <View style={styles.ratingSection}>
          <Text style={styles.sectionTitle}>¿Cómo calificarías esta experiencia?</Text>
          <View style={styles.starsContainer}>
            {renderStars()}
          </View>
          <Text style={styles.ratingText}>
            {rating === 0 ? 'Selecciona una calificación' : 
             rating === 1 ? 'Muy malo' :
             rating === 2 ? 'Malo' :
             rating === 3 ? 'Regular' :
             rating === 4 ? 'Bueno' : 'Excelente'}
          </Text>
        </View>

        <View style={styles.commentSection}>
          <Text style={styles.sectionTitle}>Cuéntanos tu experiencia</Text>
          <TextInput
            mode="outlined"
            placeholder="Describe tu experiencia, qué te gustó, qué mejorarías..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={500}
            disabled={submitting}
            style={styles.commentInput}
          />
          <Text style={styles.characterCount}>{comment.length}/500</Text>
        </View>

        <View style={styles.imageSection}>
          <Text style={styles.sectionTitle}>Agregar fotos (opcional)</Text>
          <View style={styles.imagesContainer}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: image.uri }} style={styles.selectedImage} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}
                  disabled={submitting}
                >
                  <MaterialCommunityIcons name="close-circle" size={24} color="#FF4081" />
                </TouchableOpacity>
              </View>
            ))}
            
            {images.length < 3 && (
              <TouchableOpacity 
                style={styles.addImageButton} 
                onPress={pickImage}
                disabled={submitting}
              >
                <MaterialCommunityIcons name="camera-plus" size={40} color={theme.colors.primary} />
                <Text style={styles.addImageText}>Agregar foto</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <CustomButton
          label="Enviar Calificación"
          type="primary"
          icon="send"
          onPress={submitRating}
          loading={submitting}
          disabled={rating === 0 || comment.trim().length < 10 || submitting}
          fullWidth
          style={styles.submitButton}
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
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  experienceImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  experienceTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  experienceDate: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  star: {
    marginHorizontal: 5,
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  commentSection: {
    marginBottom: 30,
  },
  commentInput: {
    marginBottom: 5,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#666',
  },
  imageSection: {
    marginBottom: 30,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
    marginBottom: 10,
  },
  selectedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  addImageText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  submitButton: {
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
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

export default RateExperienceScreen;