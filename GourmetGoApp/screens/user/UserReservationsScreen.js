// screens/user/UserReservationsScreen.js
import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, FlatList, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';

import ReservationCard  from '../../components/ReservationCard';
import { listMyReservations } from '../../utils/api';
import { getAuth } from '../../utils/authStorage';

const Tab = createMaterialTopTabNavigator();

/* ---------- Lista genérica ---------- */
const ReservationList = ({ navigation, timeFrame }) => {
  const theme = useTheme();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [error, setError]               = useState(null);

  /* fetch */
  const fetchReservations = async () => {
    setLoading(true); setError(null);
    try {
      const auth = await getAuth();               // { token, user }
      if (!auth) throw new Error('Debes iniciar sesión.');

      const data = await listMyReservations(auth.token);
      if (data.error) throw new Error(data.error);

      /* filtrado local por fecha */
      const now = new Date();
      const filtered = data.filter(r => {
        const date = new Date(r.experienceDate);
        return timeFrame === 'future' ? date >= now : date < now;
      });
      setReservations(filtered);
    } catch (e) {
      setError(e.message); setReservations([]);
    } finally { setLoading(false); setRefreshing(false); }
  };

  /* carga al entrar / reenfocar */
  useFocusEffect(useCallback(() => { fetchReservations(); }, [timeFrame]));

  /* pull-to-refresh */
  const onRefresh = useCallback(() => { setRefreshing(true); fetchReservations(); }, [timeFrame]);

  const handleRate = (reservationId, experienceId, experienceName) =>
    navigation.navigate('RateExperience', { reservationId, experienceId, experienceName });

  /* ---------- estados ---------- */
  if (loading && !refreshing)
    return <View style={styles.center}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;

  if (error)
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="alert-circle-outline" size={50} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );

  /* ---------- lista ---------- */
  return (
    <FlatList
      data={reservations}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <ReservationCard
          reservation={item}
          onRefreshReservations={onRefresh}
          onRateExperience={handleRate}
        />
      )}
      contentContainerStyle={{ paddingBottom: 10 }}
      ListEmptyComponent={() => (
        <View style={styles.center}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={50} color={theme.colors.disabled} />
          <Text style={styles.emptyText}>
            No tienes reservaciones {timeFrame === 'future' ? 'futuras' : 'pasadas'}.
          </Text>
        </View>
      )}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
      }
    />
  );
};

/* ---------- Pantalla principal ---------- */
export default function UserReservationsScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Reservaciones</Text>
      </View>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor  : theme.colors.primary,
          tabBarInactiveTintColor: 'gray',
          tabBarIndicatorStyle   : { backgroundColor: theme.colors.primary },
          tabBarLabelStyle       : { fontWeight: 'bold' },
        }}
      >
        <Tab.Screen name="Future" options={{ tabBarLabel: 'Futuras' }}>
          {() => <ReservationList timeFrame="future" />}
        </Tab.Screen>
        <Tab.Screen name="Past" options={{ tabBarLabel: 'Pasadas' }}>
          {() => <ReservationList timeFrame="past" />}
        </Tab.Screen>
      </Tab.Navigator>
    </SafeAreaView>
  );
}

/* ---------- estilos ---------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header:    { paddingHorizontal: 15, paddingVertical: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { marginTop: 10, fontSize: 16, color: 'gray', textAlign: 'center' },
  errorText: { marginTop: 10, fontSize: 16, color: 'red', textAlign: 'center' },
});
