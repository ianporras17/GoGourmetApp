import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Text, useTheme, FAB, Chip, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { getExperiencesByChef } from '../../firebase/db';
import { getCurrentUser } from '../../firebase/auth';
import { formatPrice, formatDate } from '../../utils/helpers';

const DashboardScreen = ({ navigation }) => {
  const theme = useTheme();
  const currentUser = getCurrentUser();
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadExperiences = async () => {
    if (!currentUser) return;
    
    try {
      const result = await getExperiencesByChef(currentUser.uid);
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        setExperiences(result.data);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar las experiencias');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExperiences();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadExperiences();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return theme.colors.success;
      case 'sold_out': return theme.colors.error;
      case 'upcoming': return theme.colors.primary;
      default: return theme.colors.disabled;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'sold_out': return 'Agotado';
      case 'upcoming': return 'Próximamente';
      default: return 'Desconocido';
    }
  };

  const handleEdit = (experience) => {
    navigation.navigate('EditExperience', { experienceId: experience.id });
  };

  const handleViewAttendees = (experience) => {
    navigation.navigate('Attendees', { 
      experienceId: experience.id,
      experienceName: experience.name 
    });
  };

  const handleDelete = (experience) => {
    if (experience.status === 'sold_out') {
      Alert.alert('No permitido', 'No se puede eliminar una experiencia agotada');
      return;
    }
    navigation.navigate('DeleteExperience', { experienceId: experience.id });
  };

  const renderExperience = ({ item }) => (
    <Surface style={styles.experienceCard} elevation={2}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text variant="titleMedium" style={styles.experienceTitle}>
            {item.name}
          </Text>
          <Chip 
            mode="outlined" 
            textStyle={{ color: getStatusColor(item.status) }}
            style={[styles.statusChip, { borderColor: getStatusColor(item.status) }]}
          >
            {getStatusText(item.status)}
          </Chip>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <Text variant="bodyMedium" style={styles.experienceDate}>
          📅 {formatDate(item.date?.toDate?.() || item.date)}
        </Text>
        <Text variant="bodyMedium" style={styles.experiencePrice}>
          💰 {formatPrice(item.pricePerPerson)} por persona
        </Text>
        <Text variant="bodyMedium" style={styles.experienceCapacity}>
          👥 {item.availableSpots}/{item.capacity} espacios disponibles
        </Text>
      </View>
      
      <View style={styles.cardActions}>
        <IconButton
          icon="pencil"
          mode="contained-tonal"
          onPress={() => handleEdit(item)}
          style={styles.actionButton}
        />
        <IconButton
          icon="account-group"
          mode="contained-tonal"
          onPress={() => handleViewAttendees(item)}
          style={styles.actionButton}
        />
        <IconButton
          icon="delete"
          mode="contained-tonal"
          iconColor={theme.colors.error}
          onPress={() => handleDelete(item)}
          style={styles.actionButton}
          disabled={item.status === 'sold_out'}
        />
      </View>
    </Surface>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Cargando experiencias...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Mis Experiencias
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Gestiona tus eventos gastronómicos
        </Text>
      </View>

      <FlatList
        data={experiences}
        renderItem={renderExperience}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons 
              name="chef-hat" 
              size={80} 
              color={theme.colors.disabled} 
            />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No tienes experiencias creadas
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              Crea tu primera experiencia gastronómica
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        label="Nueva Experiencia"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('CreateExperience')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  experienceCard: {
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  cardHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  experienceTitle: {
    flex: 1,
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusChip: {
    height: 28,
  },
  cardContent: {
    marginBottom: 16,
  },
  experienceDate: {
    marginBottom: 4,
  },
  experiencePrice: {
    marginBottom: 4,
  },
  experienceCapacity: {
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default DashboardScreen;