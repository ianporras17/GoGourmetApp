// screens/user/ExploreScreen.js

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TextInput,
  Modal,
  SafeAreaView,
  Text,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

import CustomButton from '../../components/CustomButton';
import Chip         from '../../components/ui/Chip';
import { listExperiences } from '../../utils/api';
import { getAuth, clearAuth } from '../../utils/authStorage';

/* ─────────── filtros ─────────── */
const CITIES      = ['Todas','San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];
const EVENT_TYPES = ['Todos','Cena','Almuerzo','Taller de Cocina','Degustación','Brunch','Especial'];
const PRICE_RANGES= [
  { label:'Cualquiera', min:0, max:Infinity },
  { label:'₡0 - ₡10k',  min:0, max:10000 },
  { label:'₡10k - ₡25k',min:10000, max:25000 },
  { label:'₡25k - ₡50k',min:25000, max:50000 },
  { label:'Más de ₡50k',min:50000, max:Infinity },
];
const RATINGS = ['Cualquiera','1+','2+','3+','4+','5'];

/* ─────────── item simple ─────────── */
function ExperienceItem({ exp, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.cardTitle}>{exp.nombre}</Text>
      <Text style={styles.cardSub}>{exp.ciudad} • {exp.precio}₡ por persona</Text>
    </TouchableOpacity>
  );
}

export default function ExploreScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState(null);

  const [filtersVisible, setFiltersVisible] = useState(false);
  const [filters, setFilters] = useState({
    city:CITIES[0],
    eventType:EVENT_TYPES[0],
    priceRange:PRICE_RANGES[0],
    minRating:RATINGS[0],
    availability:false,
  });

  const logout = async () => {
    await clearAuth();
    navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
  };

  const openChatbot = () => navigation.navigate('Chatbot');

  async function fetchExperiences() {
    setLoading(true); setError(null);
    try {
      const data = await listExperiences();
      data.error ? setError(data.error) : setExperiences(data || []);
    } catch (e) {
      setError(e.message);
      setExperiences([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }
  useEffect(() => { fetchExperiences(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchExperiences(); };

  if (loading && experiences.length===0 && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6200ee"/>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={22} color="#666"/>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar experiencias…"
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#666"
          />
        </View>

        <CustomButton
          icon="filter-variant"
          label="Filtros"
          type="outline"
          style={styles.filterBtn}
          onPress={()=>setFiltersVisible(true)}
        />

        <TouchableOpacity
          style={styles.reservationsBtn}
          onPress={() => navigation.navigate('Reservations')}
        >
          <MaterialIcons name="event-note" size={24} color="#6200ee" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('UserEditProfile')}
        >
          <MaterialCommunityIcons name="account-circle" size={26} color="#6200ee" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={logout}
        >
          <MaterialCommunityIcons name="logout" size={24} color="#6200ee" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.error}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <CustomButton label="Reintentar" onPress={onRefresh}/>
        </View>
      )}

      <FlatList
        data={experiences.filter(e =>
          e.nombre.toLowerCase().includes(searchQuery.toLowerCase())
        )}
        renderItem={({item})=>(
          <ExperienceItem
            exp={item}
            onPress={()=>navigation.navigate('ExperienceDetail',{experienceId:item.id})}
          />
        )}
        keyExtractor={(item)=>item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200ee']}/>
        }
        ListEmptyComponent={()=>(!loading && !error && (
          <View style={styles.centered}>
            <MaterialCommunityIcons name="alert-circle-outline" size={50} color="#999"/>
            <Text style={styles.emptyTitle}>No se encontraron experiencias.</Text>
          </View>
        ))}
        contentContainerStyle={{paddingBottom:80}}
      />

      {/* FAB para abrir Chatbot */}
      <TouchableOpacity style={styles.fabChatbot} onPress={openChatbot}>
        <MaterialCommunityIcons name="robot" size={28} color="white" />
      </TouchableOpacity>

      <Modal
        visible={filtersVisible}
        animationType="slide"
        transparent
        onRequestClose={()=>setFiltersVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView>
              <Text style={styles.modalTitle}>Filtros</Text>

              <Filter title="Ciudad">
                {CITIES.map(c=>(
                  <Chip key={c} label={c}
                        selected={filters.city===c}
                        onPress={()=>setFilters(p=>({...p,city:c}))}/>
                ))}
              </Filter>

              <Filter title="Tipo de Evento">
                {EVENT_TYPES.map(t=>(
                  <Chip key={t} label={t}
                        selected={filters.eventType===t}
                        onPress={()=>setFilters(p=>({...p,eventType:t}))}/>
                ))}
              </Filter>

              <Filter title="Precio">
                {PRICE_RANGES.map(r=>(
                  <Chip key={r.label} label={r.label}
                        selected={filters.priceRange.label===r.label}
                        onPress={()=>setFilters(p=>({...p,priceRange:r}))}/>
                ))}
              </Filter>

              <Filter title="Calificación">
                {RATINGS.map(r=>(
                  <Chip key={r} label={r}
                        selected={filters.minRating===r}
                        onPress={()=>setFilters(p=>({...p,minRating:r}))}/>
                ))}
              </Filter>

              <Filter title="Disponibilidad">
                <Chip label="Mostrar solo disponibles"
                      selected={filters.availability}
                      onPress={()=>setFilters(p=>({...p,availability:!p.availability}))}/>
              </Filter>

              <View style={styles.modalActions}>
                <CustomButton label="Cerrar" onPress={()=>setFiltersVisible(false)} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Filter({ title, children }) {
  return (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.filterContent}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },

  header:{ flexDirection:'row', padding:10, alignItems:'center' },
  searchBox:{
    flex:1, flexDirection:'row', alignItems:'center',
    backgroundColor:'#eee', borderRadius:8, paddingHorizontal:8,
  },
  searchInput:{ flex:1, height:40, marginLeft:4 },
  filterBtn:{ marginLeft:10 },
  reservationsBtn:{ marginLeft:10 },
  profileBtn:{ marginLeft:10 },
  logoutBtn:{ marginLeft:10 },

  card:{
    backgroundColor:'#fafafa',
    borderRadius:8,
    padding:16,
    marginHorizontal:10,
    marginBottom:10,
    elevation:2,
  },
  cardTitle:{ fontSize:16, fontWeight:'bold' },
  cardSub:{ color:'#666', marginTop:4 },

  centered:{ flex:1, justifyContent:'center', alignItems:'center', padding:20 },
  emptyTitle:{ fontSize:18, fontWeight:'bold', marginTop:8 },

  error:{ padding:20, alignItems:'center' },
  errorText:{ color:'red', marginBottom:10, textAlign:'center' },

  modalOverlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', padding:20 },
  modal:{ backgroundColor:'#fff', borderRadius:8, maxHeight:'80%', padding:16 },
  modalTitle:{ fontSize:20, fontWeight:'bold', textAlign:'center', marginBottom:12 },

  filterSection:{ marginBottom:12 },
  filterTitle:{ fontSize:16, fontWeight:'600', marginBottom:6 },
  filterContent:{ flexDirection:'row', flexWrap:'wrap' },

  modalActions:{ flexDirection:'row', justifyContent:'flex-end', marginTop:12 },

  fabChatbot: {
    position: 'absolute',
    left: 20,
    bottom: 20,
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 30,
    elevation: 5,
  },
});
