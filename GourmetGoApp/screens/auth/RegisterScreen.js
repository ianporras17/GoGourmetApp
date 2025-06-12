// screens/auth/RegisterScreen.js
import React, { useState } from 'react';
import {
  StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  Text, useTheme, Snackbar, Chip, HelperText,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import CustomButton from '../../components/CustomButton';
import FormInput    from '../../components/FormInput';
import {
  isValidEmail, isValidPhone, isValidCedula,
  validatePassword, isValidName,
} from '../../utils/validations';
import { registerUser } from '../../utils/api';

const Tab = createMaterialTopTabNavigator();

const PROVINCES     = ['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];
const CUISINE_TYPES = ['Italiana','Mexicana','Asiática','Fusión','Costarricense','Mariscos','Carnes','Vegetariana','Vegana','Postres','Cafetería'];
const FOOD_PREFS    = ['Carnes Rojas','Aves','Pescados y Mariscos','Vegetariana','Vegana','Comida Rápida','Postres','Internacional','Local'];

/* ─────────────────── TAB “USUARIO” ─────────────────── */
const UserRegisterTab = ({ navigation }) => {
  const theme = useTheme();
  const [form, setForm] = useState({
    nombre:'', correo:'', telefono:'', cedula:'',
    password:'', confirm:'', preferencias:[],
  });
  const [pwd, setPwd] = useState({ hasLetters:false, hasNumbers:false, hasDot:false, isValid:false });
  const [snack,setSnack] = useState(false); const [error,setError]=useState('');
  const [loading,setLoad]=useState(false);

  const upd=(k,v)=>{ setForm({...form,[k]:v}); if(k==='password') setPwd(validatePassword(v)); };
  const togglePref=(p)=>setForm(f=>({...f, preferencias:f.preferencias.includes(p)?f.preferencias.filter(x=>x!==p):[...f.preferencias,p]}));

  const handleRegister = async () => {
    if(!isValidName(form.nombre))          { setError('Nombre inválido'); setSnack(true); return; }
    if(!isValidEmail(form.correo))         { setError('Correo inválido'); setSnack(true); return; }
    if(!isValidPhone(form.telefono))       { setError('Teléfono inválido'); setSnack(true); return; }
    if(!isValidCedula(form.cedula))        { setError('Cédula inválida'); setSnack(true); return; }
    if(!pwd.isValid)                       { setError('Contraseña débil'); setSnack(true); return; }
    if(form.password!==form.confirm)       { setError('Contraseñas no coinciden'); setSnack(true); return; }

    setLoad(true);
    const payload = {
      rol:'usuario',
      nombre:form.nombre,
      email:form.correo,
      password:form.password,
      telefono:form.telefono,
      cedula:form.cedula,
      preferencias:form.preferencias,
    };
    const { id, error } = await registerUser(payload);
    setLoad(false);

    if(error){ setError(error); setSnack(true); }
    else     { console.log('Usuario creado:', id); navigation.replace('Login'); }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.formContainer}>
        <FormInput label="Nombre" value={form.nombre} onChangeText={v=>upd('nombre',v)} icon="account"/>
        <FormInput label="Correo" value={form.correo} onChangeText={v=>upd('correo',v)} icon="email" keyboardType="email-address"/>
        <FormInput label="Teléfono" value={form.telefono} onChangeText={v=>upd('telefono',v)} icon="phone" keyboardType="phone-pad" maxLength={8}/>
        <FormInput label="Cédula" value={form.cedula} onChangeText={v=>upd('cedula',v)} icon="card-account-details" keyboardType="numeric" maxLength={9}/>

        <FormInput label="Contraseña" value={form.password} onChangeText={v=>upd('password',v)} icon="lock" secureTextEntry/>
        <View style={styles.passwordCriteria}>
          <Text style={pwd.hasLetters?styles.valid:styles.invalid}>6+ letras</Text>
          <Text style={pwd.hasNumbers?styles.valid:styles.invalid}>4+ números</Text>
          <Text style={pwd.hasDot?styles.valid:styles.invalid}>un punto</Text>
        </View>
        <FormInput label="Confirmar" value={form.confirm} onChangeText={v=>upd('confirm',v)} icon="lock-check" secureTextEntry/>

        <Text style={styles.sectionTitle}>Preferencias Gastronómicas (opcional)</Text>
        <View style={styles.chipContainer}>
          {FOOD_PREFS.map(pref=>(
            <Chip key={pref}
                  style={styles.chip}
                  mode="outlined"
                  selected={form.preferencias.includes(pref)}
                  onPress={()=>togglePref(pref)}
                  icon={form.preferencias.includes(pref)?'check':undefined}>
              {pref}
            </Chip>
          ))}
        </View>

        <CustomButton label="Registrarse" onPress={handleRegister} loading={loading} fullWidth icon="account-plus"/>
      </View>
      <Snackbar visible={snack} onDismiss={()=>setSnack(false)} duration={3000} style={{ backgroundColor:theme.colors.error }}>{error}</Snackbar>
    </ScrollView>
  );
};

/* ─────────────────── TAB “CHEF / RESTAURANTE” ─────────────────── */
const BusinessRegisterTab = ({ userType, navigation }) => {
  const theme = useTheme();
  const [form,setForm]=useState({
    nombre:'', contacto:'', ubicacion:PROVINCES[0],
    tipos:[], correo:'', password:'', confirm:'',
  });
  const [pwd,setPwd]=useState({ hasLetters:false, hasNumbers:false, hasDot:false, isValid:false });
  const [error,setError]=useState(''); const [snack,setSnack]=useState(false); const [loading,setLoad]=useState(false);

  const upd=(k,v)=>{ setForm({...form,[k]:v}); if(k==='password') setPwd(validatePassword(v)); };
  const toggleTipo=(t)=>setForm(f=>({...f, tipos:f.tipos.includes(t)?f.tipos.filter(x=>x!==t):[...f.tipos,t]}));

  const handleRegister = async () => {
    if(!isValidName(form.nombre)   || !isValidName(form.contacto)){ setError('Nombre y contacto requeridos'); setSnack(true); return; }
    if(!isValidEmail(form.correo))                              { setError('Correo inválido'); setSnack(true); return; }
    if(!pwd.isValid)                                            { setError('Contraseña débil'); setSnack(true); return; }
    if(form.password!==form.confirm)                            { setError('Contraseñas no coinciden'); setSnack(true); return; }
    if(form.tipos.length===0)                                   { setError('Selecciona tipo(s) de cocina'); setSnack(true); return; }

    setLoad(true);
    const payload = {
      rol:userType,
      nombre:form.nombre,
      email:form.correo,
      password:form.password,
      contacto:form.contacto,
      ubicacion:form.ubicacion,
      tipoCocina:form.tipos,
    };
    const { id, error } = await registerUser(payload);
    setLoad(false);

    if(error){ setError(error); setSnack(true); }
    else     { console.log(`${userType} creado:`, id); navigation.replace('Login'); }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.formContainer}>
        <FormInput label="Nombre del {userType}" value={form.nombre}   onChangeText={v=>upd('nombre',v)}   icon="storefront"/>
        <FormInput label="Persona contacto"       value={form.contacto} onChangeText={v=>upd('contacto',v)} icon="account"/>
        <Text style={styles.sectionTitle}>Provincia</Text>
        <View style={styles.chipContainer}>
          {PROVINCES.map(prov=>(
            <Chip key={prov}
                  style={styles.chip}
                  selected={form.ubicacion===prov}
                  onPress={()=>upd('ubicacion',prov)}>
              {prov}
            </Chip>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Tipo(s) de cocina</Text>
        <View style={styles.chipContainer}>
          {CUISINE_TYPES.map(t=>(
            <Chip key={t}
                  style={styles.chip}
                  mode="outlined"
                  selected={form.tipos.includes(t)}
                  onPress={()=>toggleTipo(t)}
                  icon={form.tipos.includes(t)?'check':undefined}>
              {t}
            </Chip>
          ))}
        </View>

        <FormInput label="Correo"    value={form.correo}    onChangeText={v=>upd('correo',v)}    icon="email" keyboardType="email-address"/>
        <FormInput label="Contraseña" value={form.password} onChangeText={v=>upd('password',v)} icon="lock" secureTextEntry/>
        <View style={styles.passwordCriteria}>
          <Text style={pwd.hasLetters?styles.valid:styles.invalid}>6+ letras</Text>
          <Text style={pwd.hasNumbers?styles.valid:styles.invalid}>4+ números</Text>
          <Text style={pwd.hasDot?styles.valid:styles.invalid}>un punto</Text>
        </View>
        <FormInput label="Confirmar" value={form.confirm}   onChangeText={v=>upd('confirm',v)}  icon="lock-check" secureTextEntry/>

        <CustomButton label={`Registrar ${userType}`} onPress={handleRegister} loading={loading} fullWidth icon="account-plus"/>
      </View>
      <Snackbar visible={snack} onDismiss={()=>setSnack(false)} duration={3000} style={{ backgroundColor:theme.colors.error }}>{error}</Snackbar>
    </ScrollView>
  );
};

/* ─────────────────── CONTENEDOR DE TABS ─────────────────── */
const RegisterScreen = () => {
  const theme = useTheme();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark"/>
      <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS==='ios'?'padding':'height'}>
        <Tab.Navigator screenOptions={{
          tabBarActiveTintColor:theme.colors.primary,
          tabBarIndicatorStyle:{ backgroundColor:theme.colors.primary },
        }}>
          <Tab.Screen name="User" component={UserRegisterTab}
            options={{ tabBarLabel:'Usuario', tabBarIcon:({color})=><MaterialCommunityIcons name="account" color={color} size={24}/> }}/>
          <Tab.Screen name="Chef">
            {(props)=><BusinessRegisterTab {...props} userType="chef"/>}
          </Tab.Screen>
          <Tab.Screen name="Restaurante">
            {(props)=><BusinessRegisterTab {...props} userType="restaurante"/>}
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
});

export default RegisterScreen;
