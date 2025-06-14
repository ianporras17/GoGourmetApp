import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, ScrollView, TouchableOpacity, Alert,
  Platform, KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme, ActivityIndicator, Snackbar, Avatar } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

import CustomButton from '../../components/CustomButton';
import FormInput    from '../../components/FormInput';

import { getAuth }              from '../../utils/authStorage';
import { getMyProfile,
         updateMyProfile,
         uploadImage }           from '../../utils/api';
import { isValidEmail, isValidPhone } from '../../utils/validations';

const EditProfileScreen = ({ navigation }) => {
  const theme = useTheme();

  /* ---------------- estado ---------------- */
  const [auth, setAuth] = useState(null);   // { token, user }
  const [form, setForm] = useState({
    email:'', telefono:'', photo:null,
  });
  const [orig, setOrig]  = useState({});
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving ] = useState(false);
  const [error,   setError  ] = useState('');
  const [snack,   setSnack  ] = useState(false);

  /* obtener token → perfil */
  useEffect(() => { getAuth().then(setAuth); }, []);
  useEffect(() => { if (auth) fetchProfile(); }, [auth]);

  /* ------------ API ------------ */
  const fetchProfile = async () => {
    try {
      const res = await getMyProfile(auth.token);
      if (res.error) throw new Error(res.error);

      setForm({
        email   : res.email,
        telefono: res.telefono ?? '',
        photo   : res.profile_image ?? null,
      });
      setOrig(res);
    } catch (e) {
      setError(e.message); setSnack(true);
    } finally { setLoading(false); }
  };

  /* ------------ helpers ------------ */
  const upd = (k,v)=>setForm({...form,[k]:v});
  const pickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted')
        return setError('Permiso de cámara denegado'), setSnack(true);

      const img = await ImagePicker.launchCameraAsync({
        allowsEditing:true, aspect:[1,1], quality:0.8,
      });
      if (!img.canceled) upd('photo', img.assets[0].uri);
    } catch (e) {
      setError(e.message); setSnack(true);
    }
  };

  /* ------------ guardar ------------ */
  const handleSave = async () => {
    if (!isValidEmail (form.email   )) { setError('Correo inválido');   setSnack(true); return; }
    if (!isValidPhone(form.telefono)) { setError('Teléfono inválido'); setSnack(true); return; }

    setSaving(true);
    try {
      /* subir imagen si cambió */
      let photoUrl = orig.profile_image;
      if (form.photo && form.photo !== orig.profile_image) {
        const up = await uploadImage(auth.token, { uri:form.photo, name:'photo.jpg', type:'image/jpeg' });
        if (up.error) throw new Error(up.error);
        photoUrl = up.url;
      }

      const res = await updateMyProfile(auth.token, {
        email   : form.email,
        telefono: form.telefono,
        profileImage: photoUrl,
      });
      if (!res.success) throw new Error(res.error);

      Alert.alert('Perfil actualizado','Cambios guardados',[{text:'OK',onPress:()=>navigation.goBack()}]);
    } catch (e) {
      setError(e.message); setSnack(true);
    } finally { setSaving(false); }
  };

  /* ------------ loader ------------ */
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary}/>
        <Text style={{marginTop:8}}>Cargando perfil…</Text>
      </SafeAreaView>
    );
  }

  /* ------------ UI ------------ */
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{flex:1}}
            behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* foto */}
          <View style={styles.photoBox}>
            {form.photo
              ? <Avatar.Image size={110} source={{uri:form.photo}} />
              : <Avatar.Icon  size={110} icon="camera" />}
            <CustomButton type="text" label={form.photo?'Cambiar foto':'Tomar foto'}
                          onPress={pickPhoto}/>
          </View>

          <FormInput label="Correo" icon="email" keyboardType="email-address"
                     value={form.email} onChangeText={v=>upd('email',v)}/>

          <FormInput label="Teléfono (8 dígitos)" icon="phone"
                     value={form.telefono}
                     onChangeText={v=>upd('telefono',v.replace(/[^0-9]/g,''))}
                     maxLength={8} keyboardType="phone-pad"/>

          {/* info fija */}
          <View style={styles.box}>
            <Text style={styles.boxT}>Información no editable:</Text>
            <Text style={styles.boxI}>• Nombre de chef/restaurante</Text>
            <Text style={styles.boxI}>• Contraseña</Text>
            <Text style={styles.boxH}>Para cambiarlos contacta a soporte.</Text>
          </View>

          <CustomButton label="Guardar cambios" icon="content-save"
                        fullWidth loading={saving} disabled={saving}
                        onPress={handleSave}/>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar visible={snack} onDismiss={()=>setSnack(false)} duration={3000}
                style={{backgroundColor:theme.colors.error}}>{error}</Snackbar>
    </SafeAreaView>
  );
};

/* estilos */
const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },
  center:{ flex:1, justifyContent:'center', alignItems:'center' },
  scroll:{ padding:20 },
  photoBox:{ alignItems:'center', marginBottom:20 },
  box:{ backgroundColor:'#f9f9f9', padding:16, borderRadius:8, marginVertical:30 },
  boxT:{ fontWeight:'bold', marginBottom:8, color:'#333' },
  boxI:{ color:'#666', marginBottom:4 },
  boxH:{ color:'#999', fontStyle:'italic', marginTop:8 },
});

export default EditProfileScreen;
