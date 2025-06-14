// components/ReservationCard.js
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Card, Chip, useTheme, IconButton, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import QRCode from 'react-native-qrcode-svg';
import { formatPrice, formatDateTime } from '../utils/helpers';

const ReservationCard = ({ reservation, onRateExperience }) => {
  const theme = useTheme();
  let qrRef;

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
    const d = reservation.experienceDate;
    if (!d) return false;
    const eventDate = d.seconds
      ? new Date(d.seconds * 1000)
      : new Date(d);
    return eventDate < new Date();
  };

  const canRate = () => {
    return isPastEvent() && reservation.status === 'confirmed' && !reservation.rated;
  };

  // Obtiene el dataURL base64 del QR
  const getQrDataUrl = () =>
    new Promise((res, rej) => {
      if (!qrRef) return rej('QR no disponible');
      qrRef.toDataURL(data => res(data));
    });

  const generatePDF = async () => {
    try {
      const qrDataUrl = await getQrDataUrl();
      const html = `
        <html>
          <head><meta charset="utf-8">
            <style>
              body{font-family:Arial;padding:20px;}
              .header{text-align:center;color:#FF4081;margin-bottom:30px;}
              .info{margin:10px 0;}
              .qr{ text-align:center;margin-top:20px; }
              .qr img{ width:150px;height:150px; }
            </style>
          </head>
          <body>
            <div class="header"><h1>GourmetGo - Comprobante de Reserva</h1></div>
            <div class="info"><strong>Experiencia:</strong> ${reservation.experienceName}</div>
            <div class="info"><strong>Fecha:</strong> ${formatDateTime(reservation.experienceDate)}</div>
            <div class="info"><strong>Personas:</strong> ${reservation.attendees}</div>
            <div class="info"><strong>Total:</strong> ${formatPrice(reservation.totalPrice)}</div>
            <div class="info"><strong>Estado:</strong> ${getStatusText(reservation.status)}</div>
            <div class="info"><strong>ID Reserva:</strong> ${reservation.id}</div>
            <div class="qr">
              <p>Presenta este comprobante en el evento</p>
              <img src="data:image/png;base64,${qrDataUrl}" />
            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Comprobante de Reserva'
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* QR oculto para dataURL */}
        <View style={styles.hiddenQr}>
          <QRCode
            value={JSON.stringify({ reservationId: reservation.id })}
            getRef={c => (qrRef = c)}
            size={150}
          />
        </View>

        {/* Cabecera */}
        <View style={styles.header}>
          <Text style={styles.title}>{reservation.experienceName}</Text>
          <Chip
            mode="outlined"
            textStyle={{ color: getStatusColor(reservation.status) }}
            style={[styles.chip, { borderColor: getStatusColor(reservation.status) }]}
          >
            {getStatusText(reservation.status)}
          </Chip>
        </View>

        {/* Detalles */}
        <View style={styles.details}>
          <View style={styles.row}>
            <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>
              {reservation.experienceDate
                ? formatDateTime(reservation.experienceDate)
                : 'Fecha por confirmar'}
            </Text>
          </View>
          <View style={styles.row}>
            <MaterialCommunityIcons name="account-multiple" size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>
              {reservation.attendees} persona{reservation.attendees > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.row}>
            <MaterialCommunityIcons name="currency-usd" size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>
              {formatPrice(reservation.totalPrice)}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Acciones */}
        <View style={styles.actions}>
          <IconButton
            icon="file-pdf-box"
            size={24}
            iconColor={theme.colors.primary}
            onPress={generatePDF}
          />
          {canRate() && (
            <IconButton
              icon="star"
              size={24}
              iconColor="#FFC107"
              onPress={() =>
                onRateExperience(
                  reservation.id,
                  reservation.experienceId,
                  reservation.experienceName
                )
              }
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
  hiddenQr: {
    position: 'absolute',
    left: -1000,
    top: -1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  chip: {
    height: 28,
  },
  details: {
    marginBottom: 12,
  },
  row: {
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
