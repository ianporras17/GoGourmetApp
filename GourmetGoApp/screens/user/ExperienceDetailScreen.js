import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Image, ActivityIndicator, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { Text, useTheme, Chip, Divider, Button as PaperButton, IconButton, Surface, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import Swiper from 'react-native-swiper'; // Para la galería de imágenes

import CustomButton from '../../components/CustomButton';
import { getExperienceById, getUserProfile } from '../../firebase/db'; // Asumiendo que tienes esta función
import { formatPrice, formatDate, formatDateTime } from '../../utils/helpers';

const ExperienceDetailScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { experienceId } = route.params;

  const [experience, setExperience] = useState(null);
  const [creatorProfile, setCreatorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchExperienceDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getExperienceById(experienceId);
      if (fetchError) {
        setError(fetchError);
        setExperience(null);
      } else if (data) {
        setExperience(data);
        if (data.createdBy) {
          const { data: profile, error: profileError } = await getUserProfile(data.createdBy);
          if (profile) setCreatorProfile(profile);
        }
      } else {
        setError('Experiencia no encontrada.');
      }
    } catch (e) {
      setError(e.message);
      setExperience(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExperienceDetails();
  }, [experienceId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExperienceDetails();
  }, [experienceId]);

  const openMap = () => {
    if (experience && experience.location && experience.location.latitude && experience.location.longitude) {
        const scheme = Platform.OS === 'ios' ? 'maps:' : 'geo:';
        const url = `${scheme}${experience.location.latitude},${experience.location.longitude}?q=${experience.location.address || 'Ubicación del evento'}`;
        Linking.openURL(url);
    } else {
        alert('Ubicación no disponible.')
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}><ActivityIndicator animating={true} size="large" color={theme.colors.primary} /></View>
    );
  }

  if (error && !experience) {
    return (
      <SafeAreaView style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle-outline" size={50} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <CustomButton label="Volver a Explorar" onPress={() => navigation.goBack()} type="primary" />
      </SafeAreaView>
    );
  }
  
  if (!experience) {
      return (
        <SafeAreaView style={styles.centered}>
            <Text>No se pudo cargar la experiencia.</Text>
             <CustomButton label="Volver a Explorar" onPress={() => navigation.goBack()} type="primary" />
        </SafeAreaView>
      )
  }

  const { 
    name,
    images,
    description,
    city,
    location, // Objeto con address, latitude, longitude
    menu, // Puede ser texto o URL de imagen
    price,
    totalCapacity,
    currentCapacity,
    requirements,
    date, // Timestamp
    eventType,
    // createdBy (ya usado para creatorProfile)
  } = experience;

  const experienceDate = date ? (date.toDate ? date.toDate() : new Date(date)) : new Date();
  const canReserve = currentCapacity > 0 && experienceDate >= new Date();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      >
        <View style={styles.headerActionsContainer}>
            <IconButton icon="arrow-left" size={28} onPress={() => navigation.goBack()} style={styles.backButton} />
            {/* Podrías añadir un botón de compartir o favorito aquí */}
        </View>

        {images && images.length > 0 && (
          <Swiper style={styles.swiper} showsButtons={images.length > 1} loop={false} dotColor={theme.colors.disabled} activeDotColor={theme.colors.primary} paginationStyle={styles.swiperPagination}>
            {images.map((img, index) => (
              <View key={index} style={styles.slide}>
                <Image source={{ uri: img }} style={styles.galleryImage} resizeMode="cover" />
              </View>
            ))}
          </Swiper>
        )}

        <View style={styles.contentContainer}>
          <Text style={[styles.title, {color: theme.colors.onBackground}]}>{name}</Text>
          
          {creatorProfile && (
            <TouchableOpacity onPress={() => {/* Navegar al perfil del chef/restaurante */}}>
                <Surface style={styles.creatorCard}>
                    <Avatar.Image size={40} source={{ uri: creatorProfile.photoURL || 'https://via.placeholder.com/50' }} />
                    <View style={styles.creatorInfo}>
                        <Text style={styles.creatorName}>{creatorProfile.nombreEstablecimiento || creatorProfile.nombre}</Text>
                        <Text style={styles.creatorType}>{creatorProfile.userType === 'chef' ? 'Chef' : 'Restaurante'}</Text>
                    </View>
                </Surface>
            </TouchableOpacity>
          )}

          <View style={styles.infoChipContainer}>
            <Chip icon="map-marker" mode="outlined" style={styles.chip}>{city}</Chip>
            <Chip icon="silverware-fork-knife" mode="outlined" style={styles.chip}>{eventType}</Chip>
            <Chip icon="cash" mode="outlined" style={styles.chip}>{formatPrice(price)}</Chip>
          </View>

          <Divider style={styles.divider} />

          <Section title="Descripción">
            <Text style={styles.text}>{description || 'No hay descripción disponible.'}</Text>
          </Section>

          <Section title="Fecha y Hora">
            <Text style={styles.text}>{formatDateTime(experienceDate)}</Text>
          </Section>

          {menu && (
            <Section title="Menú">
              {isValidURL(menu) ? (
                <Image source={{ uri: menu }} style={styles.menuImage} resizeMode="contain" />
              ) : (
                <Text style={styles.text}>{menu}</Text>
              )}
            </Section>
          )}
          
          <Section title="Ubicación">
            <Text style={styles.text}>{location?.address || 'Ubicación no detallada.'}</Text>
            {location?.latitude && location?.longitude && (
                <CustomButton onPress={openMap} icon="map-search-outline" type="outline" style={{marginTop: 10}}>Ver en Mapa</CustomButton>
            )}
          </Section>

          <Section title="Capacidad">
            <Text style={styles.text}>Espacios disponibles: {currentCapacity} / {totalCapacity}</Text>
            {currentCapacity === 0 && <Text style={[styles.text, {color: theme.colors.error}]}>¡Agotado!</Text>}
          </Section>

          {requirements && requirements.length > 0 && (
            <Section title="Requisitos">
              {requirements.map((req, index) => (
                <View key={index} style={styles.listItem}>
                    <MaterialCommunityIcons name="check-circle-outline" size={18} color={theme.colors.primary} style={{marginRight: 5}}/>
                    <Text style={styles.text}>{req}</Text>
                </View>
              ))}
            </Section>
          )}
        </View>
      </ScrollView>
      
      {canReserve && (
        <View style={styles.fabContainer}>
          <CustomButton 
            label={`Reservar (${formatPrice(price)})`}
            type="primary" 
            icon="calendar-check"
            iconType="material-community"
            onPress={() => navigation.navigate('Booking', { experienceId, experienceName: name, pricePerPerson: price })}
            fullWidth
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const Section = ({ title, children }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

// Helper para validar si una cadena es una URL (simple)
const isValidURL = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;  
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
  },
  headerActionsContainer: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 15 : 10, // Ajuste para status bar en iOS si no se usa SafeAreaView arriba
      left: 10,
      zIndex: 10,
      flexDirection: 'row',
  },
  backButton: {
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 20,
  },
  scrollContent: {
    paddingBottom: 80, // Espacio para el botón FAB
  },
  swiper: {
    height: 250, // Altura de la galería
  },
  swiperPagination: {
    bottom: 10,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    padding: 15,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    elevation: 2,
  },
  creatorInfo: {
    marginLeft: 10,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  creatorType: {
    fontSize: 12,
    color: 'gray',
  },
  infoChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chip: {
    margin: 4,
  },
  divider: {
    marginVertical: 15,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: '#424242',
  },
  menuImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 5,
  },
  listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'white', // O el color de fondo del tema
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export default ExperienceDetailScreen; 