// screens/user/EditProfileScreen.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, ScrollView, TouchableOpacity, Image,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text, useTheme, ActivityIndicator, Snackbar
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import CustomButton from '../../components/CustomButton';
import FormInput    from '../../components/FormInput';
import {
  isValidEmail, isValidPhone, isValidCedula
} from '../../utils/validations';

import { getAuth }           from '../../utils/authStorage';
import { getMyProfile,
         updateMyProfile,
         uploadImage }        from '../../utils/api';

export default function EditProfileScreen({ navigation }) {
  const theme = useTheme();

  /* ---------------- estado ---------------- */
  const [auth, setAuth]           = useState(null);  // { token, user }
  const [form, setForm]           = useState({
    email:'', phone:'', cedula:'', profileImage:null,
  });
  const [origImg, setOrigImg]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving,  setSaving ]     = useState(false);
  const [error,   setError  ]     = useState('');
  const [snack,   setSnack  ]     = useState(false);

  /* obtener token → después perfil */
  useEffect(()=>{ getAuth().then(setAuth); },[]);
  useEffect(()=>{ if(auth) fetchProfile(); },[auth]);

  /* ------------ API ------------ */
  const fetchProfile = async () => {
    try {
      const res = await getMyProfile(auth.token);
      if (res.error) throw new Error(res.error);

      setForm({
        email       : res.email    || '',
        phone       : res.telefono ? String(res.telefono) : '',
        cedula      : res.cedula   || '',
        profileImage: res.profile_image || null,
      });
      setOrigImg(res.profile_image || null);
    } catch (e) {
      setErr(e.message);
    } finally { setLoading(false); }
  };

  /* ------------ helpers ------------ */
  const setF = (k,v)=> setForm({...form,[k]:v});
  const show = (msg)=> { setError(msg); setSnack(true); };

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect:[1,1], quality:0.8,
      });
      if (!res.canceled && res.assets[0])
        setF('profileImage', res.assets[0].uri);
    } catch { show('Error al seleccionar imagen'); }
  };

  /* ------------ validar ------------ */
  const valid = () => {
    if (!isValidEmail (form.email )) return show('Correo inválido'), false;
    if (form.phone  && !isValidPhone (form.phone )) return show('Teléfono inválido'), false;
    if (form.cedula && !isValidCedula(form.cedula)) return show('Cédula inválida'), false;
    return true;
  };

  /* ------------ guardar ------------ */
  const handleSave = async () => {
    if (!valid()) return;
    setSaving(true);

    try {
      let imgUrl = origImg;

      /* subir imagen si cambió y no es URL ya existente */
      if (form.profileImage && form.profileImage !== origImg && !form.profileImage.startsWith('http')) {
        const up = await uploadImage(auth.token, { uri:form.profileImage });
        if (up.error) throw new Error(up.error);
        imgUrl = up.url;
      }

      const res = await updateMyProfile(auth.token, {
        email   : form.email,
        telefono: form.phone,
        cedula  : form.cedula,
        profileImage: imgUrl,
      });
      if (!res.success) throw new Error(res.error);

      Alert.alert('Perfil actualizado','Los cambios se guardaron correctamente',
        [{text:'OK', onPress:()=>navigation.goBack()}]);
    } catch (e) {
      show(e.message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  /* ------------ loader ------------ */
  if (loading)
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary}/>
        <Text style={{marginTop:10,color:'#666'}}>Cargando perfil…</Text>
      </SafeAreaView>
    );

  /* ------------ UI ------------ */
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container}
                            behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView contentContainerStyle={{padding:20}}>
          {/* header */}
          <View style={styles.header}>
            <CustomButton icon="arrow-left" type="text"
                          onPress={()=>navigation.goBack()} />
            <Text style={styles.title}>Editar perfil</Text>
            <View style={{width:48}} />
          </View>

          {/* imagen */}
          <TouchableOpacity style={styles.imgWrap} onPress={pickImage}>
            {form.profileImage
              ? <Image source={{uri:form.profileImage}} style={styles.img}/>
              : <View style={styles.imgPlaceholder}>
                  <MaterialCommunityIcons name="account" size={60} color="#ccc"/>
                </View>}
            <View style={styles.imgOverlay}>
              <MaterialCommunityIcons name="camera" size={24} color="white"/>
            </View>
          </TouchableOpacity>
          <Text style={styles.imgHint}>Toca la foto para cambiar</Text>

          {/* inputs */}
          <FormInput
            label="Correo electrónico"
            icon="email"
            keyboardType="email-address"
            disabled={saving}
            value={form.email}
            onChangeText={(v)=>setF('email',v)}
          />
          <FormInput
            label="Teléfono (8 dígitos)"
            icon="phone"
            keyboardType="phone-pad"
            maxLength={8}
            disabled={saving}
            value={form.phone}
            onChangeText={(v)=>setF('phone',v.replace(/[^0-9]/g,''))}
            placeholder="Opcional"
          />
          <FormInput
            label="Cédula (9 dígitos)"
            icon="card-account-details"
            keyboardType="number-pad"
            maxLength={9}
            disabled={saving}
            value={form.cedula}
            onChangeText={(v)=>setF('cedula',v.replace(/[^0-9]/g,''))}
            placeholder="Opcional"
          />

          {/* info fija */}
          <View style={styles.box}>
            <Text style={styles.boxT}>Información no editable:</Text>
            <Text style={styles.boxI}>• Nombre completo</Text>
            <Text style={styles.boxI}>• Contraseña</Text>
            <Text style={styles.boxH}>Para cambiar estos datos, contacta soporte.</Text>
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

      <Snackbar visible={snack} onDismiss={()=>setSnack(false)}
                duration={3000} style={{backgroundColor:theme.colors.error}}>
        {error}
      </Snackbar>
    </SafeAreaView>
  );
}

/* ---------- estilos ---------- */
const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },
  center:{ flex:1, justifyContent:'center', alignItems:'center' },
  header:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:30 },
  title:{ fontSize:20, fontWeight:'bold' },

  imgWrap:{ alignSelf:'center', marginBottom:10, position:'relative' },
  img:{ width:120, height:120, borderRadius:60 },
  imgPlaceholder:{ width:120, height:120, borderRadius:60, backgroundColor:'#f0f0f0',
                   justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:'#ddd',
                   borderStyle:'dashed' },
  imgOverlay:{ position:'absolute', bottom:0, right:0, backgroundColor:'#FF4081',
               width:40, height:40, borderRadius:20, justifyContent:'center', alignItems:'center' },
  imgHint:{ textAlign:'center', fontSize:12, color:'#666', marginBottom:20 },

  box:{ backgroundColor:'#f9f9f9', padding:16, borderRadius:8, marginVertical:30 },
  boxT:{ fontWeight:'bold', marginBottom:8, color:'#333' },
  boxI:{ color:'#666', marginBottom:4 },
  boxH:{ color:'#999', fontStyle:'italic', marginTop:8 },
});
