// screens/user/RateExperienceScreen.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, ScrollView, Image, Alert, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text, useTheme, TextInput, ActivityIndicator, Snackbar
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import CustomButton          from '../../components/CustomButton';
import { getExperience, createRatingApi, uploadImage } from '../../utils/api';
import { getAuth }          from '../../utils/authStorage';
import { formatDateTime }   from '../../utils/helpers';

export default function RateExperienceScreen({ route, navigation }) {
  const theme = useTheme();
  const { reservationId, experienceId, experienceName } = route.params;

  /* ---------- estado ---------- */
  const [experience, setExperience]   = useState(null);
  const [rating, setRating]           = useState(0);
  const [comment, setComment]         = useState('');
  const [images, setImages]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [snackbar, setSnackbar]       = useState(false);

  /* ---------- carga experiencia ---------- */
  useEffect(() => {
    (async () => {
      try {
        const data = await getExperience(experienceId);
        if (data.error) throw new Error(data.error);
        setExperience(data);
      } catch (e) {
        setError(e.message); setSnackbar(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [experienceId]);

  /* ---------- helpers ---------- */
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
    } catch {
      setError('Error al seleccionar imagen'); setSnackbar(true);
    }
  };
  const removeImage = (i) => setImages(images.filter((_, idx) => idx !== i));

  /* ---------- envío ---------- */
  const submitRating = async () => {
    if (!rating)     return showMsg('Selecciona una calificación');
    if (comment.trim().length < 10) return showMsg('Comentario mínimo 10 caracteres');

    setSubmitting(true);
    try {
      const auth = await getAuth();
      if (!auth) throw new Error('Sesión expirada. Vuelve a iniciar sesión.');

      /* subir imágenes (máx 3) */
      const urls = [];
      for (const img of images) {
        const res = await uploadImage(auth.token, { uri: img.uri });
        if (res.error) throw new Error(res.error);
        urls.push(res.url);
      }

      const payload = {
        reservationId,
        experienceId,
        rating,
        comment : comment.trim(),
        images  : urls,
      };
      const res = await createRatingApi(auth.token, payload);
      if (res.error) throw new Error(res.error);

      Alert.alert('¡Gracias!', 'Tu opinión fue enviada correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      showMsg(e.message || 'Error al enviar calificación');
    } finally {
      setSubmitting(false);
    }
  };

  const showMsg = (msg) => { setError(msg); setSnackbar(true); };

  /* ---------- UI ---------- */
  if (loading)
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 8 }}>Cargando…</Text>
      </SafeAreaView>
    );

  if (!experience)
    return (
      <SafeAreaView style={styles.center}>
        <MaterialCommunityIcons name="alert-circle-outline" size={50} color={theme.colors.error} />
        <Text style={{ marginTop: 8, color: theme.colors.error }}>No se pudo cargar la experiencia.</Text>
        <CustomButton label="Volver" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* encabezado */}
        <CustomButton icon="arrow-left" type="text" onPress={() => navigation.goBack()} />

        {experience.images?.[0] && (
          <Image source={{ uri: experience.images[0] }} style={styles.image} />
        )}

        <Text style={styles.title}>{experienceName}</Text>
        <Text style={styles.date}>{formatDateTime(new Date(experience.fecha_hora))}</Text>

        {/* estrellas */}
        <Text style={styles.section}>Calificación</Text>
        <View style={styles.starRow}>
          {[1,2,3,4,5].map(i => (
            <TouchableOpacity key={i} onPress={() => setRating(i)} disabled={submitting}>
              <MaterialCommunityIcons
                name={i <= rating ? 'star' : 'star-outline'}
                size={40}
                color={i <= rating ? '#FFC107' : '#E0E0E0'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* comentario */}
        <Text style={styles.section}>Comentario</Text>
        <TextInput
          mode="outlined"
          placeholder="Describe tu experiencia…"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          maxLength={500}
          disabled={submitting}
          style={{ marginBottom: 6 }}
        />
        <Text style={styles.count}>{comment.length}/500</Text>

        {/* imágenes */}
        <Text style={styles.section}>Fotos (opcional)</Text>
        <View style={styles.imgRow}>
          {images.map((img, i) => (
            <View key={i} style={styles.thumbWrap}>
              <Image source={{ uri: img.uri }} style={styles.thumb} />
              <TouchableOpacity style={styles.close} onPress={() => removeImage(i)}>
                <MaterialCommunityIcons name="close-circle" size={22} color="#FF4081" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 3 && (
            <TouchableOpacity style={styles.add} onPress={pickImage}>
              <MaterialCommunityIcons name="camera-plus" size={36} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* enviar */}
        <CustomButton
          label="Enviar Calificación"
          icon="send"
          onPress={submitRating}
          loading={submitting}
          disabled={rating === 0 || comment.trim().length < 10 || submitting}
          fullWidth
          style={{ marginTop: 20 }}
        />
      </ScrollView>

      <Snackbar visible={snackbar} onDismiss={() => setSnackbar(false)} duration={3000}
                style={{ backgroundColor: theme.colors.error }}>
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

/* ---------- estilos ---------- */
const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },
  center:{ flex:1, justifyContent:'center', alignItems:'center', padding:20 },
  image:{ width:'100%', height:200, borderRadius:10, marginBottom:15 },
  title:{ fontSize:22, fontWeight:'bold', textAlign:'center', marginBottom:4 },
  date:{ fontSize:14, color:'#666', textAlign:'center', marginBottom:20 },

  section:{ fontSize:18, fontWeight:'bold', marginTop:20, marginBottom:10 },
  starRow:{ flexDirection:'row', justifyContent:'center' },
  count:{ fontSize:12, color:'#666', textAlign:'right' },

  imgRow:{ flexDirection:'row', flexWrap:'wrap', alignItems:'center' },
  thumbWrap:{ marginRight:10, marginBottom:10, position:'relative' },
  thumb:{ width:80, height:80, borderRadius:8 },
  close:{ position:'absolute', top:-6, right:-6, backgroundColor:'#fff', borderRadius:10 },

  add:{ width:80, height:80, borderRadius:8, borderWidth:2, borderColor:'#ddd',
        borderStyle:'dashed', justifyContent:'center', alignItems:'center', marginBottom:10 },
});
