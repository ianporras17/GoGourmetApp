import React, { useState, useCallback } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Text, useTheme, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';

import ReservationCard from '../../components/ReservationCard';
import { getUserReservations } from '../../firebase/db';
import { getCurrentUser } from '../../firebase/auth';

const Tab = createMaterialTopTabNavigator();

const ReservationList = ({ navigation, timeFrame, statusFilter }) => {
  const theme = useTheme();
  const currentUser = getCurrentUser();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReservations = async () => {
    if (!currentUser) {
      setError("Debes iniciar sesión para ver tus reservas.");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const filters = { timeframe: timeFrame };
      if (statusFilter && statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      const { data, error: fetchError } = await getUserReservations(currentUser.uid, filters);
      if (fetchError) {
        setError(fetchError);
        setReservations([]);
      } else {
        setReservations(data || []);
      }
    } catch (e) {
      setError(e.message);
      setReservations([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReservations();
    }, [currentUser, timeFrame, statusFilter])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReservations();
  }, [currentUser, timeFrame, statusFilter]);

  const handleRateExperience = (reservationId, experienceId, experienceName) => {
    navigation.navigate('RateExperience', { reservationId, experienceId, experienceName });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}><ActivityIndicator animating={true} size="large" color={theme.colors.primary} /></View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle-outline" size={50} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={reservations}
      renderItem={({ item }) => 
        <ReservationCard 
            reservation={item} 
            onRefreshReservations={onRefresh}
            onRateExperience={handleRateExperience}
        />}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={() => (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={50} color={theme.colors.disabled} />
          <Text style={styles.emptyText}>No tienes reservaciones {timeFrame === 'future' ? 'futuras' : 'pasadas'}.</Text>
        </View>
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
    />
  );
};

const UserReservationsScreen = ({ navigation }) => {
  const theme = useTheme();
  // Podrías añadir filtros de estado aquí si es necesario, por ahora solo Futuras/Pasadas

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.screenHeader}>
            <Text style={styles.screenTitle}>Mis Reservaciones</Text>
            {/* Puedes añadir un botón de filtros aquí si es necesario */}
        </View>
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: 'gray',
                tabBarIndicatorStyle: { backgroundColor: theme.colors.primary },
                tabBarLabelStyle: { fontWeight: 'bold' },
            }}
        >
            <Tab.Screen name="FutureReservations" options={{ tabBarLabel: 'Futuras' }}>
                {props => <ReservationList {...props} timeFrame="future" />}
            </Tab.Screen>
            <Tab.Screen name="PastReservations" options={{ tabBarLabel: 'Pasadas' }}>
                {props => <ReservationList {...props} timeFrame="past" />}
            </Tab.Screen>
        </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenHeader: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    // borderBottomWidth: 1, // Opcional, si quieres un separador
    // borderBottomColor: '#ddd',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: 'gray',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

export default UserReservationsScreen; 