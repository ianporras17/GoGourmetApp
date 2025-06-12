// screens/chef/DashboardScreen.js
import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet, View, FlatList, ActivityIndicator,
  RefreshControl, Alert,
} from 'react-native';
import {
  Text, useTheme, FAB, Chip, IconButton, Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { listChefExperiences } from '../../utils/api';
import { getAuth } from '../../utils/authStorage';
import { formatPrice, formatDate } from '../../utils/helpers';

const DashboardScreen = ({ navigation }) => {
  const theme = useTheme();

  /* -------- estado local -------- */
  const [auth, setAuth]             = useState(null);        // { token, user }
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  /* -------- obtener token al montar -------- */
  useEffect(() => { getAuth().then(setAuth); }, []);

  /* -------- carga de experiencias -------- */
  const loadExperiences = async () => {
    if (!auth) return;
    try {
      const data = await listChefExperiences(auth.token);
      if (data.error) Alert.alert('Error', data.error);
      else            setExperiences(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las experiencias');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* cargar cada vez que la pantalla gana foco */
  useFocusEffect(
  useCallback(() => {
    /* función realmente async */
    const fetchData = async () => {
      await loadExperiences();
    };

    fetchData();          // se invoca, pero el callback NO es async
  }, [auth]),
);

  const onRefresh = () => { setRefreshing(true); loadExperiences(); };

  /* -------- helpers UI -------- */
  const getStatusColor = (estado) => {
    switch (estado) {
      case 'active'   : return theme.colors.tertiary;
      case 'sold_out' : return theme.colors.error;
      case 'upcoming' : return theme.colors.primary;
      default         : return theme.colors.disabled;
    }
  };
  const getStatusText = (estado) => {
    switch (estado) {
      case 'active'   : return 'Activo';
      case 'sold_out' : return 'Agotado';
      case 'upcoming' : return 'Próximamente';
      default         : return 'Desconocido';
    }
  };

  /* -------- acciones -------- */
  const handleEdit = (exp)       => navigation.navigate('EditExperience',  { experienceId: exp.id });
  const handleAttendees = (exp)  => navigation.navigate('Attendees',       { experienceId: exp.id, experienceName: exp.nombre });
  const handleDelete = (exp) => {
    if (exp.estado === 'sold_out') return Alert.alert('No permitido', 'No se puede eliminar una experiencia agotada');
    navigation.navigate('DeleteExperience', { experienceId: exp.id });
  };

  /* -------- render card -------- */
  const renderExperience = ({ item }) => (
    <Surface style={styles.card} elevation={2}>
      <View style={styles.cardHeader}>
        <Text variant="titleMedium" style={styles.cardTitle}>{item.nombre}</Text>
        <Chip
          mode="outlined"
          textStyle={{ color: getStatusColor(item.estado) }}
          style={[styles.statusChip, { borderColor: getStatusColor(item.estado) }]}>
          {getStatusText(item.estado)}
        </Chip>
      </View>

      <View style={styles.cardContent}>
        <Text variant="bodyMedium">📅 {formatDate(item.fecha_hora)}</Text>
        <Text variant="bodyMedium">💰 {formatPrice(item.precio)} por persona</Text>
        <Text variant="bodyMedium">
          👥 {item.cupos_disponibles}/{item.capacidad} espacios disponibles
        </Text>
      </View>

      <View style={styles.cardActions}>
        <IconButton icon="pencil" onPress={() => handleEdit(item)} />
        <IconButton icon="account-group" onPress={() => handleAttendees(item)} />
        <IconButton
          icon="delete"
          iconColor={theme.colors.error}
          onPress={() => handleDelete(item)}
          disabled={item.estado === 'sold_out'}
        />
      </View>
    </Surface>
  );

  /* -------- loading -------- */
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Cargando experiencias…</Text>
      </SafeAreaView>
    );
  }

  /* -------- pantalla principal -------- */
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
            <View> 
              <Text variant="headlineMedium" style={styles.headerTitle}>Mis Experiencias</Text> 
              <Text variant="bodyMedium">Gestiona tus eventos gastronómicos</Text> 
            </View> 
            <IconButton 
              icon="account-circle" 
              size={32} 
              onPress={()=>navigation.navigate('EditProfile')} 
            /> 
        </View>
      </View>

      <FlatList
        data={experiences}
        renderItem={renderExperience}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="chef-hat" size={80} color={theme.colors.disabled} />
            <Text variant="titleMedium">Aún no has creado experiencias</Text>
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

/* -------- estilos -------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: 'white' },
  headerTitle: { fontWeight: 'bold', marginBottom: 4 },
  list: { padding: 16, paddingBottom: 100 },
  card: { marginBottom: 16, borderRadius: 12, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: 'bold', flex: 1, marginRight: 8 },
  statusChip: { height: 28 },
  cardContent: { marginVertical: 12 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  empty: { alignItems: 'center', marginTop: 60 },
});

export default DashboardScreen;
