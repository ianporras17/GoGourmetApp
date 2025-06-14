// screens/user/ExperienceDetailScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, ScrollView, Image, ActivityIndicator,
  RefreshControl, Linking, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text, Chip, Divider, Surface, Avatar, IconButton
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper';

import CustomButton from '../../components/CustomButton';
import { getExperience, getPublicProfile } from '../../utils/api';
import { formatPrice, formatDateTime } from '../../utils/helpers';

export default function ExperienceDetailScreen({ route, navigation }) {
  const { experienceId } = route.params;

  const [exp, setExp]         = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]     = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExperience(experienceId);
      if (data.error) throw new Error(data.error);
      setExp(data);

      // Perfil público opcional
      if (data.created_by) {
        const prof = await getPublicProfile(data.created_by);
        if (!prof.error) setCreator(prof);
      }
    } catch (e) {
      setError(e.message);
      setExp(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [experienceId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [experienceId]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (error && !exp) {
    return (
      <SafeAreaView style={styles.center}>
        <MaterialCommunityIcons name="alert-circle-outline" size={50} color="red" />
        <Text style={styles.errorText}>{error}</Text>
        <CustomButton label="Volver" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }
  if (!exp) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>No se pudo cargar la experiencia.</Text>
        <CustomButton label="Volver" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }

  // Destructuring
  const {
    nombre,
    descripcion,
    ciudad,
    precio,
    capacidad,
    cupos_disponibles,
    fecha_hora,
    event_type,
    images = [],
    location_url
  } = exp;

  const eventDate = new Date(fecha_hora);
  const now = new Date();
  const hasEnded = eventDate < now;
  const canReserve = !hasEnded && cupos_disponibles > 0;
  const canRate = hasEnded && exp.user_has_reserved && !exp.user_has_rated;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 90 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Back */}
        <IconButton
          icon="arrow-left"
          size={28}
          style={styles.back}
          onPress={() => navigation.goBack()}
        />

        {/* Gallery */}
        {images.length > 0 && (
          <Swiper style={{ height: 250 }} loop={false}>
            {images.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.gallery} />
            ))}
          </Swiper>
        )}

        <View style={styles.content}>
          <Text style={styles.title}>{nombre}</Text>

          {/* Creador */}
          {creator && (
            <Surface style={styles.creatorCard}>
              <Avatar.Image
                size={40}
                source={{ uri: creator.foto_url || 'https://via.placeholder.com/50' }}
              />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.creatorName}>{creator.nombre}</Text>
                <Text style={styles.creatorType}>
                  {creator.rol === 'chef' ? 'Chef' : 'Restaurante'}
                </Text>
              </View>
            </Surface>
          )}

          {/* Chips */}
          <View style={styles.chips}>
            <Chip icon="map-marker" style={styles.chip}>{ciudad}</Chip>
            <Chip icon="silverware-fork-knife" style={styles.chip}>{event_type}</Chip>
            <Chip icon="cash" style={styles.chip}>{formatPrice(precio)}</Chip>
          </View>

          <Divider style={{ marginVertical: 15 }} />

          {/* Descripción */}
          <Section title="Descripción">
            <Text style={styles.text}>{descripcion || 'Sin descripción.'}</Text>
          </Section>

          {/* Fecha y hora */}
          <Section title="Fecha y hora">
            <Text style={styles.text}>{formatDateTime(eventDate)}</Text>
          </Section>

          {/* Ubicación */}
          <Section title="Ubicación">
            <Text style={styles.text}>{location_url || 'Ubicación no detallada.'}</Text>
            {location_url && (
              <CustomButton
                type="outline"
                icon="map-search-outline"
                onPress={() => Linking.openURL(location_url)}
                style={{ marginTop: 8 }}
              >
                Ver en mapa
              </CustomButton>
            )}
          </Section>

          {/* Capacidad */}
          <Section title="Capacidad">
            <Text style={styles.text}>
              Disponibles: {cupos_disponibles} / {capacidad}
            </Text>
            {cupos_disponibles === 0 && (
              <Text style={[styles.text, { color: 'red' }]}>¡Agotado!</Text>
            )}
          </Section>
        </View>
      </ScrollView>

      {/* Barra inferior */}
      <View style={styles.bottomBar}>
        {canReserve && (
          <CustomButton
            label={`Reservar (${formatPrice(precio)})`}
            fullWidth
            icon="calendar-check"
            onPress={() =>
              navigation.navigate('Booking', {
                experienceId,
                experienceName: nombre,
                pricePerPerson: precio
              })
            }
          />
        )}
        {canRate && (
          <CustomButton
            label="Calificar experiencia"
            fullWidth
            icon="star"
            onPress={() =>
              navigation.navigate('RateExperience', {
                experienceId,
                experienceName: nombre
              })
            }
            style={{ marginTop: canReserve ? 8 : 0 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText:    { marginVertical: 10, color: 'red', textAlign: 'center' },
  back:         { position: 'absolute', top: Platform.OS === 'ios' ? 15 : 10, left: 10, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.3)' },
  gallery:      { width: '100%', height: '100%' },
  content:      { padding: 15 },
  title:        { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  creatorCard:  { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginBottom: 15, elevation: 2 },
  creatorName:  { fontWeight: 'bold' },
  creatorType:  { fontSize: 12, color: 'gray' },
  chips:        { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  chip:         { margin: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  text:         { fontSize: 15, lineHeight: 22 },
  bottomBar:    { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
});
