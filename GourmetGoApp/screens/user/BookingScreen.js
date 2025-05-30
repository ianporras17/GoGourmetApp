import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { Text, useTheme, TextInput, RadioButton, Checkbox, Divider, ActivityIndicator, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

import CustomButton from '../../components/CustomButton';
import FormInput from '../../components/FormInput';
import { isValidEmail, isValidPhone, isValidName } from '../../utils/validations';
import { createReservation } from '../../firebase/db';
import { getCurrentUser } from '../../firebase/auth'; // Para obtener datos del usuario logueado
import { formatPrice } from '../../utils/helpers';

const BookingScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { experienceId, experienceName, pricePerPerson } = route.params;
  const currentUser = getCurrentUser();

  const [formData, setFormData] = useState({
    attendees: '1',
    nombre: currentUser?.displayName || '',
    correo: currentUser?.email || '',
    telefono: '', // Pedir siempre, o tomar de perfil si existe y está verificado
    paymentMethod: 'payOnSite', // 'payOnSite' o 'transfer'
    agreedToTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [reservationSuccess, setReservationSuccess] = useState(false);
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [totalPrice, setTotalPrice] = useState(pricePerPerson);

  useEffect(() => {
    const attendeesNum = parseInt(formData.attendees);
    if (!isNaN(attendeesNum) && attendeesNum > 0) {
      setTotalPrice(attendeesNum * pricePerPerson);
    } else {
      setTotalPrice(pricePerPerson);
    }
  }, [formData.attendees, pricePerPerson]);

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleBooking = async () => {
    if (!isValidName(formData.nombre)) { setError('Nombre inválido.'); setSnackbarVisible(true); return; }
    if (!isValidEmail(formData.correo)) { setError('Correo inválido.'); setSnackbarVisible(true); return; }
    if (!isValidPhone(formData.telefono)) { setError('Teléfono inválido (8 dígitos).'); setSnackbarVisible(true); return; }
    const attendeesNum = parseInt(formData.attendees);
    if (isNaN(attendeesNum) || attendeesNum <= 0) { setError('Cantidad de personas inválida.'); setSnackbarVisible(true); return; }
    if (!formData.agreedToTerms) { setError('Debes aceptar los términos y condiciones.'); setSnackbarVisible(true); return; }

    setLoading(true);
    setError('');

    try {
      const reservationData = {
        userId: currentUser.uid,
        experienceId,
        experienceName,
        attendees: attendeesNum,
        userName: formData.nombre,
        userEmail: formData.correo,
        userPhone: formData.telefono,
        paymentMethod: formData.paymentMethod,
        totalPrice,
        // experienceDate se debería obtener del objeto experience para registrarla en la reserva
      };

      const { id: reservationId, error: reservationError } = await createReservation(reservationData);

      if (reservationError) {
        setError(`Error al crear reservación: ${reservationError}`);
        setSnackbarVisible(true);
      } else {
        const qrData = JSON.stringify({ reservationId, experienceId, userId: currentUser.uid, attendees: attendeesNum });
        setQrCodeValue(qrData);
        setReservationSuccess(true);
        // Aquí se podría simular el envío de correo
        Alert.alert('¡Reservación Exitosa!', 'Tu código QR ha sido generado. Lo encontrarás también en tu perfil.');
        // navigation.navigate('UserProfile', { screen: 'MyReservations' }); O algo similar
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Intenta de nuevo.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  if (reservationSuccess) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.successTitle}>¡Reservación Confirmada!</Text>
        <Text style={styles.successSubtitle}>Presenta este código QR en el evento:</Text>
        {qrCodeValue ? (
          <View style={styles.qrContainer}>
            <QRCode
              value={qrCodeValue}
              size={200}
              logoBackgroundColor='transparent'
            />
          </View>
        ) : <ActivityIndicator />}
        <Text style={styles.detailsText}>Experiencia: {experienceName}</Text>
        <Text style={styles.detailsText}>Personas: {formData.attendees}</Text>
        <Text style={styles.detailsText}>Total: {formatPrice(totalPrice)}</Text>
        <CustomButton label="Ver Mis Reservas" onPress={() => navigation.popToTop() /* o a Mis Reservas */} type="primary" style={{marginTop: 20}}/>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
            <CustomButton icon="arrow-left" type="text" onPress={() => navigation.goBack()} style={styles.backButton}/>
            <Text style={styles.headerTitle}>Confirmar Reservación</Text>
            <View style={{width: 50}} />
        </View>
        
        <Text style={styles.experienceTitle}>{experienceName}</Text>
        <Text style={styles.priceInfo}>Precio por persona: {formatPrice(pricePerPerson)}</Text>

        <FormInput
          label="Cantidad de Personas"
          value={formData.attendees}
          onChangeText={(val) => handleInputChange('attendees', val.replace(/[^0-9]/g, ''))} // Solo números
          keyboardType="number-pad"
          icon="account-multiple"
          disabled={loading}
          validate={(val) => parseInt(val) > 0}
          errorMessage="Debe ser al menos 1 persona"
        />
        <FormInput label="Nombre Completo" value={formData.nombre} onChangeText={(val) => handleInputChange('nombre', val)} icon="account" disabled={loading} validate={isValidName} errorMessage="Nombre inválido" />
        <FormInput label="Correo Electrónico" value={formData.correo} onChangeText={(val) => handleInputChange('correo', val)} icon="email" keyboardType="email-address" disabled={loading} validate={isValidEmail} errorMessage="Correo inválido" />
        <FormInput label="Teléfono (8 dígitos)" value={formData.telefono} onChangeText={(val) => handleInputChange('telefono', val)} icon="phone" keyboardType="phone-pad" maxLength={8} disabled={loading} validate={isValidPhone} errorMessage="Teléfono inválido" />

        <Text style={styles.sectionTitle}>Método de Pago</Text>
        <RadioButton.Group onValueChange={newValue => handleInputChange('paymentMethod', newValue)} value={formData.paymentMethod}>
          <View style={styles.radioItem}>
            <RadioButton value="payOnSite" disabled={loading} color={theme.colors.primary}/>
            <Text onPress={() => !loading && handleInputChange('paymentMethod', 'payOnSite')}>Pago en el lugar</Text>
          </View>
          <View style={styles.radioItem}>
            <RadioButton value="transfer" disabled={loading} color={theme.colors.primary}/>
            <Text onPress={() => !loading && handleInputChange('paymentMethod', 'transfer')}>Transferencia Bancaria (Coordinar)</Text>
          </View>
        </RadioButton.Group>
        {formData.paymentMethod === 'transfer' && (
            <Text style={styles.transferNote}>Nota: Si eliges transferencia, recibirás los detalles por correo para completar el pago y confirmar tu reserva.</Text>
        )}

        <Text style={styles.totalPriceText}>Total Estimado: {formatPrice(totalPrice)}</Text>

        <View style={styles.checkboxContainer}>
          <Checkbox.Android
            status={formData.agreedToTerms ? 'checked' : 'unchecked'}
            onPress={() => handleInputChange('agreedToTerms', !formData.agreedToTerms)}
            color={theme.colors.primary}
            disabled={loading}
          />
          <Text style={styles.termsText} onPress={() => handleInputChange('agreedToTerms', !formData.agreedToTerms)}>
            Acepto los términos y condiciones de la reservación.
          </Text>
        </View>
        {/* Aquí podrías añadir un enlace a los términos y condiciones */} 

        <CustomButton
          label="Confirmar y Reservar"
          type="primary"
          icon="calendar-check"
          onPress={handleBooking}
          loading={loading}
          disabled={!formData.agreedToTerms || loading}
          fullWidth
          style={{marginTop: 20}}
        />
      </ScrollView>
      </KeyboardAvoidingView>
      <Snackbar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} duration={3000} style={{ backgroundColor: theme.colors.error }}>{error}</Snackbar>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { flexGrow: 1, padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  backButton: { alignSelf: 'flex-start'},
  headerTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  experienceTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 5, textAlign: 'center' },
  priceInfo: { fontSize: 16, color: 'gray', marginBottom: 20, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  radioItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  transferNote: { fontSize: 12, color: 'grey', fontStyle: 'italic', marginLeft: 10, marginBottom: 10},
  totalPriceText: { fontSize: 18, fontWeight: 'bold', color: '#FF4081', textAlign: 'right', marginTop: 15, marginBottom: 15},
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 15, marginBottom: 10 },
  termsText: { flex: 1, marginLeft: 8, fontSize: 13, color: '#333' }, 
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff'
  },
  successTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: 'green', textAlign: 'center' },
  successSubtitle: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
  qrContainer: {
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  detailsText: { fontSize: 14, marginBottom: 5, textAlign: 'center' },
});

export default BookingScreen; 