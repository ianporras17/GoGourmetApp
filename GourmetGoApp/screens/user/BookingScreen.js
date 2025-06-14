// screens/user/BookingScreen.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  useTheme,
  RadioButton,
  Checkbox,
  ActivityIndicator,
  Snackbar
} from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';

import CustomButton from '../../components/CustomButton';
import FormInput    from '../../components/FormInput';
import {
  isValidEmail,
  isValidPhone,
  isValidName
} from '../../utils/validations';
import {
  createReservationApi
} from '../../utils/api';
import { getAuth } from '../../utils/authStorage';
import { formatPrice } from '../../utils/helpers';

export default function BookingScreen({ route, navigation }) {
  const theme = useTheme();
  const { experienceId, experienceName, pricePerPerson } = route.params;

  const [form, setForm] = useState({
    attendees     : '1',
    nombre        : '',
    correo        : '',
    telefono      : '',
    paymentMethod : 'payOnSite',
    agreed        : false,
  });
  const [total, setTotal]     = useState(pricePerPerson);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [snack, setSnack]     = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrValue, setQrValue] = useState('');

  // Recalcular total al cambiar número de asistentes
  useEffect(() => {
    const n = parseInt(form.attendees, 10) || 1;
    setTotal(n * pricePerPerson);
  }, [form.attendees, pricePerPerson]);

  // Helper para actualizar el form
  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Muestra el snackbar de error
  const showError = msg => {
    setError(msg);
    setSnack(true);
  };

  // Cuando la reserva es exitosa
  const onSuccess = (reservationId, userId, n) => {
    // Generar QR con los datos clave
    const qrData = JSON.stringify({
      reservationId,
      experienceId,
      userId,
      attendees: n
    });
    setQrValue(qrData);
    setSuccess(true);
    Alert.alert('¡Reservación exitosa!', 'Tu reserva ha quedado registrada.');
  };

  // Llama a la API para crear la reserva
  const handleBooking = async () => {
    // Validaciones
    if (!isValidName(form.nombre))    return showError('Nombre inválido');
    if (!isValidEmail(form.correo))   return showError('Correo inválido');
    if (!isValidPhone(form.telefono)) return showError('Teléfono inválido');
    const n = parseInt(form.attendees, 10);
    if (!n || n < 1)                  return showError('Cantidad de personas inválida');
    if (!form.agreed)                 return showError('Debes aceptar los términos');

    setLoading(true);
    try {
      const auth = await getAuth();
      if (!auth) throw new Error('Debes iniciar sesión de nuevo.');

      const payload = {
        experienceId,
        attendees:    n,
        userName:     form.nombre,
        userEmail:    form.correo,
        userPhone:    form.telefono,
        paymentMethod: form.paymentMethod,
        totalPrice:   total
      };

      const res = await createReservationApi(auth.token, payload);
      if (res.error) throw new Error(res.error);

      onSuccess(res.id, auth.user.id, n);
    } catch (e) {
      showError(e.message || 'Error al crear reservación');
    } finally {
      setLoading(false);
    }
  };

  // Éxito: mostramos QR y detalles
  if (success) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.okTitle}>¡Reservación confirmada!</Text>
        {qrValue
          ? <QRCode value={qrValue} size={200} />
          : <ActivityIndicator />}
        <Text style={{ marginTop: 10 }}>Personas: {form.attendees}</Text>
        <Text>Total: {formatPrice(total)}</Text>
        <CustomButton
          label="Ver Mis Reservas"
          onPress={() => navigation.navigate('Reservations')}
          style={{ marginTop: 20 }}
        />
      </SafeAreaView>
    );
  }

  // Formulario de reserva
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <CustomButton
            icon="arrow-left"
            type="text"
            onPress={() => navigation.goBack()}
          />

          <Text style={styles.title}>{experienceName}</Text>
          <Text style={styles.subtitle}>
            {formatPrice(pricePerPerson)} por persona
          </Text>

          <FormInput
            label="Cantidad de personas"
            icon="account-multiple"
            value={form.attendees}
            keyboardType="number-pad"
            onChangeText={v => setF('attendees', v.replace(/[^0-9]/g, ''))}
          />

          <FormInput
            label="Nombre completo"
            icon="account"
            value={form.nombre}
            onChangeText={v => setF('nombre', v)}
          />
          <FormInput
            label="Correo"
            icon="email"
            keyboardType="email-address"
            value={form.correo}
            onChangeText={v => setF('correo', v)}
          />
          <FormInput
            label="Teléfono"
            icon="phone"
            keyboardType="phone-pad"
            maxLength={8}
            value={form.telefono}
            onChangeText={v => setF('telefono', v)}
          />

          <Text style={styles.section}>Método de pago</Text>
          <RadioButton.Group
            onValueChange={v => setF('paymentMethod', v)}
            value={form.paymentMethod}
          >
            <View style={styles.radioRow}>
              <RadioButton value="payOnSite" />
              <Text>Pago en el lugar</Text>
            </View>
            <View style={styles.radioRow}>
              <RadioButton value="transfer" />
              <Text>Transferencia bancaria</Text>
            </View>
          </RadioButton.Group>
          {form.paymentMethod === 'transfer' && (
            <Text style={styles.note}>
              Recibirás los datos bancarios por correo.
            </Text>
          )}

          <Text style={styles.total}>Total: {formatPrice(total)}</Text>

          <View style={styles.checkRow}>
            <Checkbox.Android
              status={form.agreed ? 'checked' : 'unchecked'}
              onPress={() => setF('agreed', !form.agreed)}
              color={theme.colors.primary}
            />
            <Text onPress={() => setF('agreed', !form.agreed)}>
              Acepto los términos y condiciones.
            </Text>
          </View>

          <CustomButton
            label="Confirmar y reservar"
            icon="calendar-check"
            onPress={handleBooking}
            loading={loading}
            disabled={loading}
            fullWidth
            style={{ marginTop: 20 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snack}
        onDismiss={() => setSnack(false)}
        duration={3000}
        style={{ backgroundColor: theme.colors.error }}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#fff' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title:      { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle:   { textAlign: 'center', color: '#777', marginBottom: 20 },
  section:    { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
  note:       { fontSize: 12, color: 'gray', fontStyle: 'italic', marginLeft: 10 },
  total:      { fontSize: 18, fontWeight: 'bold', color: '#FF4081', textAlign: 'right', marginTop: 15 },
  radioRow:   { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  checkRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  okTitle:    { fontSize: 24, fontWeight: 'bold', color: 'green', marginBottom: 20 },
});
