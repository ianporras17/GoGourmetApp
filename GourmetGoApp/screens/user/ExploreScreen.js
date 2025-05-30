import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { Text, Searchbar, useTheme, Chip, Portal, Modal, Button as PaperButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import ExperienceCard from '../../components/ExperienceCard';
import CustomButton from '../../components/CustomButton';
import { getExperiences } from '../../firebase/db';

const CITIES = ['Todas', 'San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'];
const EVENT_TYPES = ['Todos', 'Cena', 'Almuerzo', 'Taller de Cocina', 'Degustación', 'Brunch', 'Especial'];
const PRICE_RANGES = [
  { label: 'Cualquiera', min: 0, max: Infinity },
  { label: '₡0 - ₡10k', min: 0, max: 10000 },
  { label: '₡10k - ₡25k', min: 10000, max: 25000 },
  { label: '₡25k - ₡50k', min: 25000, max: 50000 },
  { label: 'Más de ₡50k', min: 50000, max: Infinity },
];
const RATINGS = ['Cualquiera', '1+', '2+', '3+', '4+', '5'];

const ExploreScreen = ({ navigation }) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
    city: CITIES[0],
    eventType: EVENT_TYPES[0],
    priceRange: PRICE_RANGES[0],
    minRating: RATINGS[0],
    availability: false,
  });

  const fetchExperiencesData = async (currentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const filterParams = {
        city: currentFilters.city === 'Todas' ? null : currentFilters.city,
        eventType: currentFilters.eventType === 'Todos' ? null : currentFilters.eventType,
        minPrice: currentFilters.priceRange.min,
        maxPrice: currentFilters.priceRange.max === Infinity ? null : currentFilters.priceRange.max,
        minRating: currentFilters.minRating === 'Cualquiera' ? 0 : parseInt(currentFilters.minRating),
        availableOnly: currentFilters.availability,
        // Aquí podrías añadir búsqueda por texto (searchQuery) si tu backend lo soporta
      };
      const { data, error: fetchError } = await getExperiences(filterParams);
      if (fetchError) {
        setError(fetchError);
        setExperiences([]);
      } else {
        setExperiences(data || []);
      }
    } catch (e) {
      setError(e.message);
      setExperiences([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExperiencesData(appliedFilters);
  }, [appliedFilters]); // Recargar al aplicar filtros

  useFocusEffect(
    useCallback(() => {
      // Se puede llamar a fetchExperiencesData si se quiere recargar cada vez que la pantalla obtiene foco
      // Por ahora, solo se carga inicialmente y con filtros
      // fetchExperiencesData(appliedFilters); 
      return () => {}; // Cleanup si es necesario
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchExperiencesData(appliedFilters);
  }, [appliedFilters]);

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Aquí podrías implementar la búsqueda en tiempo real o al presionar un botón
    // Por ahora, la búsqueda por texto no está conectada al filtro de getExperiences
  };

  const handleApplyFilters = (newFilters) => {
    setAppliedFilters(newFilters);
    setFiltersVisible(false);
    // fetchExperiencesData se disparará por el useEffect
  };
  
  const renderItem = ({ item }) => (
    <ExperienceCard 
      experience={item} 
      onPress={() => navigation.navigate('ExperienceDetail', { experienceId: item.id })} 
    />
  );

  if (loading && experiences.length === 0 && !refreshing) {
    return (
      <View style={styles.centered}><ActivityIndicator animating={true} size="large" color={theme.colors.primary} /></View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.headerContainer}>
        <Searchbar
          placeholder="Buscar experiencias..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
          icon={() => <MaterialCommunityIcons name="magnify" size={24} color={theme.colors.placeholder} />}
          // onIconPress={() => fetchExperiencesData(appliedFilters)} // Para buscar al presionar el icono
        />
        <CustomButton 
            icon="filter-variant" 
            onPress={() => setFiltersVisible(true)} 
            style={styles.filterButton} 
            type="outline"
            label="Filtros"
        />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error al cargar: {error}</Text>
          <CustomButton label="Reintentar" onPress={onRefresh} type="secondary" />
        </View>
      )}

      <FlatList
        data={experiences}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          !loading && !error && (
            <View style={styles.centered}>
              <MaterialCommunityIcons name="alert-circle-outline" size={50} color={theme.colors.disabled} />
              <Text style={styles.emptyText}>No se encontraron experiencias.</Text>
              <Text style={styles.emptySubText}>Intenta ajustar los filtros o busca más tarde.</Text>
            </View>
          )
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
      />
      
      <FilterModal 
        visible={filtersVisible} 
        onDismiss={() => setFiltersVisible(false)} 
        applyFilters={handleApplyFilters} 
        currentFilters={appliedFilters}
        theme={theme}
      />
    </SafeAreaView>
  );
};

const FilterModal = ({ visible, onDismiss, applyFilters, currentFilters, theme }) => {
    const [tempFilters, setTempFilters] = useState(currentFilters);

    useEffect(() => {
        setTempFilters(currentFilters); // Sincronizar cuando se abre el modal
    }, [currentFilters, visible]);

    const handleChipPress = (filterType, value) => {
        setTempFilters(prev => ({ ...prev, [filterType]: value }));
    };

    const handleAvailabilityToggle = () => {
        setTempFilters(prev => ({ ...prev, availability: !prev.availability }));
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
                <ScrollView>
                    <Text style={[styles.modalTitle, {color: theme.colors.onBackground}]}>Filtros</Text>
                    
                    <FilterSection title="Ciudad">
                        {CITIES.map(city => 
                            <Chip key={city} selected={tempFilters.city === city} onPress={() => handleChipPress('city', city)} style={styles.chip} mode={tempFilters.city === city ? 'flat' : 'outlined'}>{city}</Chip>
                        )}
                    </FilterSection>

                    <FilterSection title="Tipo de Evento">
                        {EVENT_TYPES.map(type => 
                            <Chip key={type} selected={tempFilters.eventType === type} onPress={() => handleChipPress('eventType', type)} style={styles.chip} mode={tempFilters.eventType === type ? 'flat' : 'outlined'}>{type}</Chip>
                        )}
                    </FilterSection>

                    <FilterSection title="Rango de Precio">
                        {PRICE_RANGES.map(range => 
                            <Chip key={range.label} selected={tempFilters.priceRange.label === range.label} onPress={() => handleChipPress('priceRange', range)} style={styles.chip} mode={tempFilters.priceRange.label === range.label ? 'flat' : 'outlined'}>{range.label}</Chip>
                        )}
                    </FilterSection>

                    <FilterSection title="Calificación Mínima">
                        {RATINGS.map(rating => 
                            <Chip key={rating} selected={tempFilters.minRating === rating} onPress={() => handleChipPress('minRating', rating)} style={styles.chip} mode={tempFilters.minRating === rating ? 'flat' : 'outlined'}>{rating}</Chip>
                        )}
                    </FilterSection>

                    <FilterSection title="Disponibilidad">
                         <View style={styles.checkboxRow}>
                            <Chip 
                                selected={tempFilters.availability}
                                onPress={handleAvailabilityToggle} 
                                style={styles.chip} 
                                mode={tempFilters.availability ? 'flat' : 'outlined'}
                                icon={tempFilters.availability ? "check-circle" : "circle-outline"}
                            >
                                Mostrar solo disponibles
                            </Chip>
                        </View>
                    </FilterSection>

                    <View style={styles.modalActions}>
                        <CustomButton label="Limpiar" onPress={() => setTempFilters({ city: CITIES[0], eventType: EVENT_TYPES[0], priceRange: PRICE_RANGES[0], minRating: RATINGS[0], availability: false })} type="text" style={{marginRight: 10}}/>
                        <CustomButton label="Aplicar Filtros" onPress={() => applyFilters(tempFilters)} type="primary" />
                    </View>
                </ScrollView>
            </Modal>
        </Portal>
    );
};

const FilterSection = ({ title, children }) => (
    <View style={styles.filterSectionContainer}>
        <Text style={styles.filterSectionTitle}>{title}</Text>
        <View style={styles.chipContainer}>{children}</View>
    </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  searchbar: {
    flex: 1,
    marginRight: 10,
    elevation: 2,
  },
  filterButton: {
    minWidth: 100, // Para que el texto "Filtros" quepa bien
  },
  listContent: {
    paddingBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginTop: 5,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  // Filter Modal Styles
  modalContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 10,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  filterSectionContainer: {
    marginBottom: 15,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    margin: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  }
});

export default ExploreScreen; 