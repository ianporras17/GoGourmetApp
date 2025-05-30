import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Text, Card, Chip, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatPrice, formatDate } from '../utils/helpers';

const ExperienceCard = ({ experience, onPress }) => {
  const theme = useTheme();
  
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
      default: return 'Inactivo';
    }
  };
  
  return (
    <TouchableOpacity onPress={() => onPress(experience.id)}>
      <Card style={styles.card}>
        <Card.Cover 
          source={{ uri: experience.images?.[0] || 'https://via.placeholder.com/300x200' }}
          style={styles.image}
        />
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>{experience.name}</Text>
            <Chip 
              mode="flat" 
              textStyle={{ color: getStatusColor(experience.status) }}
              style={[styles.statusChip, { backgroundColor: `${getStatusColor(experience.status)}20` }]}
            >
              {getStatusText(experience.status)}
            </Chip>
          </View>
          
          <View style={styles.details}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.primary} />
              <Text style={styles.detailText}>{formatDate(experience.date)}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="clock" size={16} color={theme.colors.primary} />
              <Text style={styles.detailText}>{experience.time}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="star" size={16} color={theme.colors.primary} />
              <Text style={styles.detailText}>{experience.rating?.toFixed(1) || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.price}>{formatPrice(experience.pricePerPerson)}</Text>
            <Text style={styles.spots}>{experience.availableSpots} cupos disponibles</Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 4,
  },
  image: {
    height: 200,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    height: 28,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  spots: {
    fontSize: 12,
    color: '#666',
  },
});

export default ExperienceCard;