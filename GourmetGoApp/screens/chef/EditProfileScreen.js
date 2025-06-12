// screens/chef/EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,           // ← añadido
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  useTheme,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';

import CustomButton from '../../components/CustomButton';
import FormInput    from '../../components/FormInput';

import { getAuth }             from '../../utils/authStorage';
import { getMyProfile, updateMyProfile } from '../../utils/api';
import { isValidEmail, isValidPhone, isValidCedula } from '../../utils/validations';

const EditProfileScreen = ({ navigation }) => {
  const theme = useTheme();

  /* ---------------- estado ---------------- */
  const [auth, setAuth] = useState(null);                   // { token, user }
  const [form, setForm] = useState({                        // inputs controlados
    email:  '',
    phone:  '',
    cedula: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving,  setSaving ] = useState(false);
  const [error,   setError  ] = useState('');
  const [snack,   setSnack  ] = useState(false);

  /* obtener token → después perfil */
  useEffect(() => { getAuth().then(setAuth); }, []);
  useEffect(() => { if (auth) fetchProfile();   }, [auth]);

  /* ------------ API ------------ */
  const fetchProfile = async () => {
    try {
      const res = await getMyProfile(auth.token);
      if (res.error) throw new Error(res.error);

      setForm({
        email : res.email    || '',
        phone : res.telefono ? String(res.telefono) : '',
        cedula: res.cedula   || '',
      });
    } catch (e) {
      setError(e.message); setSnack(true);
    } finally {
      setLoading(false);
    }
  };

  const setF = (k, v) => setForm({ ...form, [k]: v });

  /* ------------ validación ------------ */
  const valid = () => {
    if (!isValidEmail (form.email )) { setError('Correo inválido');   return false; }
    if (form.phone  && !isValidPhone (form.phone )) { setError('Teléfono inválido'); return false; }
    if (form.cedula && !isValidCedula(form.cedula)) { setError('Cédula inválida');    return false; }
    return true;
  };

  /* ------------ guardar ------------ */
  const handleSave = async () => {
    Keyboard.dismiss();
    if (!valid()) { setSnack(true); return; }

    setSaving(true);
    try {
      const res = await updateMyProfile(auth.token, {
        email   : form.email,
        telefono: form.phone,   // 👈 ahora coincide con el backend / BD 
        cedula  : form.cedula, 
      });
      if (!res.success) throw new Error(res.error);

      Alert.alert(
        'Perfil actualizado',
        'Los cambios fueron guardados correctamente',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (e) {
      setError(e.message);
      setSnack(true);
    } finally {
      setSaving(false);
    }
  };

  /* ------------ loader ------------ */
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.load}>Cargando perfil…</Text>
      </SafeAreaView>
    );
  }

  /* ------------ UI ------------ */
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* encabezado */}
          <View style={styles.header}>
            <CustomButton icon="arrow-left" type="text" onPress={() => navigation.goBack()} />
            <Text style={styles.title}>Editar perfil</Text>
            <View style={{ width: 48 }} />
          </View>

          {/* formulario */}
          <FormInput
            label="Correo electrónico"
            value={form.email}
            icon="email"
            keyboardType="email-address"
            onChangeText={(v) => setF('email', v)}
            disabled={saving}
          />

          <FormInput
            label="Teléfono (8 dígitos)"
            value={form.phone}
            icon="phone"
            keyboardType="phone-pad"
            maxLength={8}
            onChangeText={(v) => setF('phone', v.replace(/[^0-9]/g, ''))}
            disabled={saving}
            placeholder="Opcional"
          />

          <FormInput
            label="Cédula (9 dígitos)"
            value={form.cedula}
            icon="card-account-details"
            keyboardType="number-pad"
            maxLength={9}
            onChangeText={(v) => setF('cedula', v.replace(/[^0-9]/g, ''))}
            disabled={saving}
            placeholder="Opcional"
          />

          {/* información fija */}
          <View style={styles.box}>
            <Text style={styles.boxT}>Información no editable:</Text>
            <Text style={styles.boxI}>• Nombre completo</Text>
            <Text style={styles.boxI}>• Contraseña</Text>
            <Text style={styles.boxH}>Para cambiarlos contacta a soporte.</Text>
          </View>

          <CustomButton
            label="Guardar cambios"
            icon="content-save"
            fullWidth
            onPress={handleSave}
            loading={saving}
            disabled={saving}
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
};

/* ------------ estilos ------------ */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  load:      { marginTop: 10, color: '#666' },
  scroll:    { padding: 20 },
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 30 },
  title:     { fontSize: 20, fontWeight: 'bold' },
  box:       { backgroundColor: '#f9f9f9', padding: 16, borderRadius: 8, marginVertical: 30 },
  boxT:      { fontWeight: 'bold', marginBottom: 8, color: '#333' },
  boxI:      { color: '#666', marginBottom: 4 },
  boxH:      { color: '#999', fontStyle: 'italic', marginTop: 8 },
});

export default EditProfileScreen;
