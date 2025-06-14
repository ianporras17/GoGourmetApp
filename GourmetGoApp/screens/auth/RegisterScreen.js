// screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  Text, useTheme, Snackbar, Chip, Avatar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import * as ImagePicker from 'expo-image-picker';

import CustomButton from '../../components/CustomButton';
import FormInput    from '../../components/FormInput';
import {
  isValidEmail, isValidPhone, isValidCedula,
  validatePassword, isValidName,
} from '../../utils/validations';
import { registerUser, uploadImage } from '../../utils/api';

const Tab = createMaterialTopTabNavigator();

const PROVINCES     = ['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];
const CUISINE_TYPES = ['Italiana','Mexicana','Asiática','Fusión','Costarricense','Mariscos','Carnes',
                       'Vegetariana','Vegana','Postres','Cafetería'];
const FOOD_PREFS    = ['Carnes Rojas','Aves','Pescados y Mariscos','Vegetariana','Vegana',
                       'Comida Rápida','Postres','Internacional','Local'];

/* util genérico --------------------------------------------------- */
const takePhoto = async () => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') throw new Error('Permiso de cámara denegado');
  const res = await ImagePicker.launchCameraAsync({
    allowsEditing:true, aspect:[1,1], quality:0.8,
  });
  return res.canceled ? null : res.assets[0];
};

/* ─────────────────── TAB “USUARIO” ─────────────────── */
const UserRegisterTab = ({ navigation }) => {
  const theme = useTheme();
  const [form, setForm] = useState({
    nombre:'', correo:'', telefono:'', cedula:'',
    password:'', confirm:'', preferencias:[], photo:null,
  });
  const [pwd,setPwd] = useState({ hasLetters:false, hasNumbers:false, hasDot:false, isValid:false });
  const [error,setErr]=useState(''); const [snack,setSnack]=useState(false); const [load,setLoad]=useState(false);

  const upd=(k,v)=>{ setForm({...form,[k]:v}); if(k==='password') setPwd(validatePassword(v)); };
  const togglePref=(p)=>setForm(f=>({...f,
    preferencias:f.preferencias.includes(p)?f.preferencias.filter(x=>x!==p):[...f.preferencias,p]
  }));

  const pick = async ()=>{
    try{ const f=await takePhoto(); if(f) upd('photo',f); }
    catch(e){ setErr(e.message); setSnack(true); }
  };

  const show = (msg)=>{ setErr(msg); setSnack(true); };

  const handleRegister = async () => {
    if(!isValidName(form.nombre))          return show('Nombre inválido');
    if(!isValidEmail(form.correo))         return show('Correo inválido');
    if(!isValidPhone(form.telefono))       return show('Teléfono inválido');
    if(!isValidCedula(form.cedula))        return show('Cédula inválida');
    if(!pwd.isValid)                       return show('Contraseña débil');
    if(form.password!==form.confirm)       return show('Contraseñas no coinciden');

    setLoad(true);
    /* 1- sube foto si existe */
    let fotoUrl=null;
    if(form.photo){
      const up = await uploadImage(null, form.photo);    // función pública (token null)
      if(up.error){ setLoad(false); return show(up.error); }
      fotoUrl = up.url;
    }
    /* 2- payload */
    const payload = {
      rol:'usuario',
      nombre:form.nombre, email:form.correo, password:form.password,
      telefono:form.telefono, cedula:form.cedula,
      preferencias:form.preferencias, fotoUrl
    };
    const { error } = await registerUser(payload);
    setLoad(false);
    error ? show(error) : navigation.replace('Login');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.formContainer}>
        {/* foto */}
        <View style={styles.photoBox}>
          {form.photo
            ? <Avatar.Image size={90} source={{uri:form.photo.uri}} />
            : <Avatar.Icon  size={90} icon="camera" />}
          <CustomButton type="text" label={form.photo?'Cambiar foto':'Tomar foto'}
                        onPress={pick}/>
        </View>

        <FormInput label="Nombre"  icon="account" value={form.nombre}  onChangeText={v=>upd('nombre',v)} />
        <FormInput label="Correo"  icon="email"   value={form.correo}  onChangeText={v=>upd('correo',v)}  keyboardType="email-address"/>
        <FormInput label="Teléfono (8 dígitos)" icon="phone" value={form.telefono}
                   onChangeText={v=>upd('telefono',v.replace(/[^0-9]/g,''))} keyboardType="phone-pad" maxLength={8}/>
        <FormInput label="Cédula (9 dígitos)"   icon="card-account-details" value={form.cedula}
                   onChangeText={v=>upd('cedula',v.replace(/[^0-9]/g,''))}  keyboardType="numeric" maxLength={9}/>

        <FormInput label="Contraseña"   icon="lock"       value={form.password} onChangeText={v=>upd('password',v)} secureTextEntry/>
        <View style={styles.passwordCriteria}>
          <Text style={pwd.hasLetters?styles.valid:styles.invalid}>6+ letras</Text>
          <Text style={pwd.hasNumbers?styles.valid:styles.invalid}>4+ números</Text>
          <Text style={pwd.hasDot?styles.valid:styles.invalid}>un punto</Text>
        </View>
        <FormInput label="Confirmar"    icon="lock-check" value={form.confirm}   onChangeText={v=>upd('confirm',v)}  secureTextEntry/>

        <Text style={styles.sectionTitle}>Preferencias Gastronómicas (opcional)</Text>
        <View style={styles.chipContainer}>
          {FOOD_PREFS.map(p=>(
            <Chip key={p} style={styles.chip} mode="outlined"
                  selected={form.preferencias.includes(p)}
                  onPress={()=>togglePref(p)}
                  icon={form.preferencias.includes(p)?'check':undefined}>{p}</Chip>
          ))}
        </View>

        <CustomButton label="Registrarse" icon="account-plus" fullWidth
                      onPress={handleRegister} loading={load}/>
      </View>

      <Snackbar visible={snack} onDismiss={()=>setSnack(false)} duration={3000}
                style={{backgroundColor:theme.colors.error}}>{error}</Snackbar>
    </ScrollView>
  );
};

/* ─────────────────── TAB “CHEF / RESTAURANTE” ─────────────────── */
const BusinessRegisterTab = ({ userType, navigation }) => {
  const theme = useTheme();
  const isChef        = userType==='chef';
  const nombreLabel   = isChef ? 'Nombre del Chef' : 'Nombre del Restaurante';
  const contactoLabel = isChef ? 'Persona de contacto' : 'Encargado de Reservas';

  const [form,setForm]=useState({
    nombre:'', contacto:'', telefono:'',
    ubicacion:PROVINCES[0], tipos:[],
    correo:'', password:'', confirm:'', photo:null,
  });
  const [pwd,setPwd]   = useState({ hasLetters:false, hasNumbers:false, hasDot:false, isValid:false });
  const [error,setErr] = useState(''); const [snack,setSnack]=useState(false); const [load,setLoad]=useState(false);

  const upd=(k,v)=>{ setForm({...form,[k]:v}); if(k==='password') setPwd(validatePassword(v)); };
  const toggleTipo=(t)=>setForm(f=>({...f, tipos:f.tipos.includes(t)?f.tipos.filter(x=>x!==t):[...f.tipos,t]}));
  const pick = async ()=>{ try{ const f=await takePhoto(); if(f) upd('photo',f); }
                           catch(e){ setErr(e.message); setSnack(true);} };
  const show=(m)=>{ setErr(m); setSnack(true); };

  const handleRegister = async () => {
    if(!isValidName(form.nombre))            return show('Nombre requerido');
    if(!isValidName(form.contacto))          return show('Contacto requerido');
    if(!isValidPhone(form.telefono))         return show('Teléfono inválido');
    if(!isValidEmail(form.correo))           return show('Correo inválido');
    if(!pwd.isValid)                         return show('Contraseña débil');
    if(form.password!==form.confirm)         return show('Contraseñas no coinciden');
    if(form.tipos.length===0)                return show('Selecciona tipo de cocina');

    setLoad(true);
    let fotoUrl=null;
    if(form.photo){
      const up=await uploadImage(null,form.photo);
      if(up.error){ setLoad(false); return show(up.error); }
      fotoUrl=up.url;
    }

    const payload={
      rol:userType, nombre:form.nombre, email:form.correo, password:form.password,
      contacto:form.contacto, telefono:form.telefono,
      ubicacion:form.ubicacion, tipoCocina:form.tipos, fotoUrl
    };
    const { error } = await registerUser(payload);
    setLoad(false);
    error ? show(error) : navigation.replace('Login');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.formContainer}>
        {/* foto */}
        <View style={styles.photoBox}>
          {form.photo
            ? <Avatar.Image size={90} source={{uri:form.photo.uri}} />
            : <Avatar.Icon  size={90} icon="camera" />}
          <CustomButton type="text" label={form.photo?'Cambiar foto':'Tomar foto'}
                        onPress={pick}/>
        </View>

        <FormInput label={nombreLabel}   icon="store-outline" value={form.nombre}   onChangeText={v=>upd('nombre',v)}/>
        <FormInput label={contactoLabel} icon="account"       value={form.contacto} onChangeText={v=>upd('contacto',v)}/>
        <FormInput label="Teléfono (8 dígitos)" icon="phone"  value={form.telefono}
                   onChangeText={v=>upd('telefono',v.replace(/[^0-9]/g,''))}
                   keyboardType="phone-pad" maxLength={8}/>

        <Text style={styles.sectionTitle}>Provincia</Text>
        <View style={styles.chipContainer}>
          {PROVINCES.map(p=>(
            <Chip key={p} style={styles.chip}
                  selected={form.ubicacion===p}
                  onPress={()=>upd('ubicacion',p)}>{p}</Chip>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Tipo(s) de cocina</Text>
        <View style={styles.chipContainer}>
          {CUISINE_TYPES.map(t=>(
            <Chip key={t} style={styles.chip} mode="outlined"
                  selected={form.tipos.includes(t)}
                  onPress={()=>toggleTipo(t)}
                  icon={form.tipos.includes(t)?'check':undefined}>
              {t}
            </Chip>
          ))}
        </View>

        <FormInput label="Correo" icon="email" keyboardType="email-address"
                   value={form.correo} onChangeText={v=>upd('correo',v)}/>
        <FormInput label="Contraseña" icon="lock" secureTextEntry
                   value={form.password} onChangeText={v=>upd('password',v)}/>
        <View style={styles.passwordCriteria}>
          <Text style={pwd.hasLetters?styles.valid:styles.invalid}>6+ letras</Text>
          <Text style={pwd.hasNumbers?styles.valid:styles.invalid}>4+ números</Text>
          <Text style={pwd.hasDot?styles.valid:styles.invalid}>un punto</Text>
        </View>
        <FormInput label="Confirmar" icon="lock-check" secureTextEntry
                   value={form.confirm} onChangeText={v=>upd('confirm',v)}/>

        <CustomButton label={`Registrar ${isChef?'Chef':'Restaurante'}`}
                      icon="account-plus" fullWidth loading={load}
                      onPress={handleRegister}/>
      </View>

      <Snackbar visible={snack} onDismiss={()=>setSnack(false)} duration={3000}
                style={{backgroundColor:theme.colors.error}}>{error}</Snackbar>
    </ScrollView>
  );
};

/* ─────────────────── CONTENEDOR DE TABS ─────────────────── */
const RegisterScreen = () => {
  const theme = useTheme();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.keyboardContainer}
                            behavior={Platform.OS==='ios'?'padding':'height'}>
        <Tab.Navigator screenOptions={{
          tabBarActiveTintColor:theme.colors.primary,
          tabBarIndicatorStyle:{ backgroundColor:theme.colors.primary },
        }}>
          <Tab.Screen name="Usuario" component={UserRegisterTab}
            options={{ tabBarIcon:({color})=>
              <MaterialCommunityIcons name="account" color={color} size={24}/> }}/>
          <Tab.Screen name="Chef">
            {props=><BusinessRegisterTab {...props} userType="chef"/>}
          </Tab.Screen>
          <Tab.Screen name="Restaurante">
            {props=><BusinessRegisterTab {...props} userType="restaurante"/>}
          </Tab.Screen>
        </Tab.Navigator>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ─────────────────── ESTILOS ─────────────────── */
const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },
  keyboardContainer:{ flex:1 },
  scrollContent:{ flexGrow:1, padding:20 },
  formContainer:{ width:'100%', marginBottom:20 },
  chipContainer:{ flexDirection:'row', flexWrap:'wrap', marginBottom:10 },
  chip:{ margin:4 },
  sectionTitle:{ fontSize:16, fontWeight:'bold', marginTop:10, marginBottom:6 },
  passwordCriteria:{ flexDirection:'row', justifyContent:'space-around', marginBottom:8 },
  valid:{ color:'green', fontSize:12 },
  invalid:{ color:'red', fontSize:12 },
  photoBox:{ alignItems:'center', marginBottom:20 },
});

export default RegisterScreen;
