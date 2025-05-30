import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, useTheme, IconButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatPrice, formatDate, formatDateTime } from '../utils/helpers';

const ReservationCard = ({ reservation, onRefreshReservations, onRateExperience }) => {
  const theme = useTheme();
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return theme.colors.primary;
      case 'cancelled': return theme.colors.error;
      case 'completed': return '#4CAF50';
      default: return theme.colors.disabled;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return 'Desconocido';
    }
  };

  const isPastEvent = () => {
    if (!reservation.experienceDate) return false;
    const eventDate = new Date(reservation.experienceDate.seconds * 1000);
    return eventDate < new Date();
  };

  const canRate = () => {
    return isPastEvent() && reservation.status === 'confirmed' && !reservation.rated;
  };

  const generatePDF = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; color: #FF4081; margin-bottom: 30px; }
              .info { margin: 10px 0; }
              .qr-section { text-align: center; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>GourmetGo - Comprobante de Reserva</h1>
            </div>
            <div class="info"><strong>Experiencia:</strong> ${reservation.experienceName}</div>
            <div class="info"><strong>Fecha:</strong> ${formatDateTime(reservation.experienceDate)}</div>
            <div class="info"><strong>Personas:</strong> ${reservation.attendees}</div>
            <div class="info"><strong>Total:</strong> ${formatPrice(reservation.totalPrice)}</div>
            <div class="info"><strong>Estado:</strong> ${getStatusText(reservation.status)}</div>
            <div class="info"><strong>ID Reserva:</strong> ${reservation.id}</div>
            <div class="qr-section">
              <p>Presenta este comprobante en el evento</p>
            </div>
          </body>
        </html>
      `;
      
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.experienceName}>{reservation.experienceName}</Text>
          <Chip 
            mode="outlined" 
            textStyle={{ color: getStatusColor(reservation.status) }}
            style={{ borderColor: getStatusColor(reservation.status) }}
          >
            {getStatusText(reservation.status)}
          </Chip>
        </View>
        
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>
              {reservation.experienceDate ? formatDateTime(reservation.experienceDate) : 'Fecha por confirmar'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account-multiple" size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>{reservation.attendees} personas</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="currency-usd" size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>{formatPrice(reservation.totalPrice)}</Text>
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.actions}>
          <IconButton
            icon="file-pdf-box"
            size={24}
            onPress={generatePDF}
            iconColor={theme.colors.primary}
          />
          
          {canRate() && (
            <IconButton
              icon="star"
              size={24}
              onPress={() => onRateExperience(reservation.id, reservation.experienceId, reservation.experienceName)}
              iconColor="#FFC107"
            />
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  experienceName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
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
  divider: {
    marginVertical: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});

export default ReservationCard;