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
import { getAuth, clearAuth }  from '../../utils/authStorage';
import { formatPrice, formatDate } from '../../utils/helpers';

const DashboardScreen = ({ navigation }) => {
  const theme = useTheme();

  const [auth, setAuth]         = useState(null);
  const [experiences, setExp]   = useState([]);
  const [loading, setLoad]      = useState(true);
  const [refreshing, setRef]    = useState(false);

  useEffect(() => { getAuth().then(setAuth); }, []);

  const loadExperiences = async () => {
    if (!auth) return;
    try {
      const data = await listChefExperiences(auth.token);
      if (data.error) Alert.alert('Error', data.error);
      else            setExp(data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las experiencias');
    } finally {
      setLoad(false);
      setRef(false);
    }
  };

  useFocusEffect(useCallback(() => { loadExperiences(); }, [auth]));

  const onRefresh = () => { setRef(true); loadExperiences(); };

  const statusColor = (s) =>
    s === 'active'   ? theme.colors.tertiary :
    s === 'sold_out' ? theme.colors.error    :
    s === 'upcoming' ? theme.colors.primary  :
    theme.colors.disabled;

  const statusText = (s) =>
    s === 'active'   ? 'Activo' :
    s === 'sold_out' ? 'Agotado' :
    s === 'upcoming' ? 'Próximamente' : 'Desconocido';

  const edit       = (e) => navigation.navigate('EditExperience', { experienceId: e.id });
  const attendees  = (e) => navigation.navigate('Attendees',      { experienceId: e.id, experienceName: e.nombre });
  const borrar     = (e) => {
    if (e.estado === 'sold_out')
      return Alert.alert('No permitido', 'No se puede eliminar una experiencia agotada');
    navigation.navigate('DeleteExperience', { experienceId: e.id });
  };
  const logout = async () => {
    await clearAuth();
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  };

  const openChatbot = () => navigation.navigate('Chatbot');

  const renderItem = ({ item }) => (
    <Surface style={styles.card} elevation={2}>
      <View style={styles.cardHeader}>
        <Text variant="titleMedium" style={styles.cardTitle}>{item.nombre}</Text>
        <Chip
          mode="outlined"
          textStyle={{ color: statusColor(item.estado) }}
          style={[styles.statusChip, { borderColor: statusColor(item.estado) }]}>
          {statusText(item.estado)}
        </Chip>
      </View>

      <View style={styles.cardContent}>
        <Text>📅 {formatDate(item.fecha_hora)}</Text>
        <Text>💰 {formatPrice(item.precio)} por persona</Text>
        <Text>
          👥 {item.cupos_disponibles}/{item.capacidad} espacios disponibles
        </Text>
      </View>

      <View style={styles.cardActions}>
        <IconButton icon="pencil"        onPress={() => edit(item)} />
        <IconButton icon="account-group" onPress={() => attendees(item)} />
        <IconButton
          icon="delete"
          iconColor={theme.colors.error}
          onPress={() => borrar(item)}
          disabled={item.estado === 'sold_out'}
        />
      </View>
    </Surface>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Cargando experiencias…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="headlineMedium" style={styles.headerTitle}>Mis Experiencias</Text>
            <Text variant="bodyMedium">Gestiona tus eventos gastronómicos</Text>
          </View>

          <IconButton icon="account-circle" size={32} onPress={() => navigation.navigate('EditProfile')} />
          <IconButton icon="logout" size={28}      onPress={logout} />
        </View>
      </View>

      <FlatList
        data={experiences}
        renderItem={renderItem}
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

      {/* FAB secundario para Chatbot */}
      <FAB
        icon="robot"
        style={[styles.fabChatbot, { backgroundColor: theme.colors.tertiary }]}
        onPress={openChatbot}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f5f5f5' },
  header:      { padding: 20, backgroundColor: 'white' },
  headerTitle: { fontWeight: 'bold', marginBottom: 4 },
  list:        { padding: 16, paddingBottom: 100 },

  card:         { marginBottom: 16, borderRadius: 12, padding: 16 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle:    { fontWeight: 'bold', flex: 1, marginRight: 8 },
  statusChip:   { height: 28 },
  cardContent:  { marginVertical: 12 },
  cardActions:  { flexDirection: 'row', justifyContent: 'flex-end' },

  fab: { position: 'absolute', right: 16, bottom: 16 },
  fabChatbot: {
    position: 'absolute',
    left: 16,
    bottom: 16,
  },
  empty: { alignItems: 'center', marginTop: 60 },
});

export default DashboardScreen;
