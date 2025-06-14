// screens/chef/EditExperienceScreen.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, ScrollView, Alert, TouchableOpacity,
  KeyboardAvoidingView, Platform
} from 'react-native';
import {
  Text, useTheme, Snackbar, ActivityIndicator, Chip
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import CustomButton from '../../components/CustomButton';
import FormInput    from '../../components/FormInput';

import {
  getExperience,
  updateExperienceApi
} from '../../utils/api';                // 🔄 backend
import { getAuth }    from '../../utils/authStorage';
import { isValidUrl } from '../../utils/validations';
import { formatDate, formatTime } from '../../utils/helpers';

const CITIES   = ['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];
const STATUSES = ['upcoming','active'];

const EditExperienceScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { experienceId } = route.params;

  /* ---------- estado ---------- */
  const [auth, setAuth]       = useState(null);       // { token, user }
  const [experience, setExp]  = useState(null);
  const [form, setForm]       = useState({
    date:new Date(), time:new Date(),
    capacity:'', pricePerPerson:'',
    locationUrl:'', city:CITIES[0], status:'upcoming',
  });
  const [showDatePicker,setShowDatePicker]=useState(false);
  const [showTimePicker,setShowTimePicker]=useState(false);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [snack,setSnack]=useState({visible:false,message:''});
  const [errors,setErrors]=useState({});

  /* ---------- cargar auth y experiencia ---------- */
  useEffect(()=>{ getAuth().then(setAuth); }, []);
  useEffect(()=>{ if(auth) fetchExperience(); }, [auth]);

  const fetchExperience = async () => {
    try {
      const exp = await getExperience(experienceId);
      if (exp.error) throw new Error(exp.error);

      const fecha = new Date(exp.fecha_hora);
      setExp(exp);
      setForm({
        date: fecha,
        time: fecha,
        capacity: exp.capacidad.toString(),
        pricePerPerson: exp.precio.toString(),
        locationUrl: exp.location_url || '',
        city: exp.ciudad,
        status: exp.estado,
      });
    } catch (e) {
      Alert.alert('Error', e.message);
      navigation.goBack();
    } finally { setLoading(false); }
  };

  /* ---------- helpers ---------- */
  const setF = (k,v)=>setForm({...form,[k]:v});
  const onDateChange = (_,d)=>{ setShowDatePicker(false); if(d) setF('date',d); };
  const onTimeChange = (_,t)=>{ setShowTimePicker(false); if(t) setF('time',t); };

  const getStatusText = (s)=> s==='upcoming' ? 'Próximamente' : 'Activo';

  /* ---------- validación ---------- */
  const validateForm = () => {
    const combined = new Date(
      form.date.getFullYear(),
      form.date.getMonth(),
      form.date.getDate(),
      form.time.getHours(),
      form.time.getMinutes(),
      0, 0
    );
    const e={};
    if (combined < new Date()) e.date = 'Fecha y hora no pueden ser pasadas';
    if(!form.capacity || +form.capacity<=0)      e.capacity='Capacidad > 0';
    if(!form.pricePerPerson || +form.pricePerPerson<=0) e.pricePerPerson='Precio > 0';
    if(form.locationUrl && !isValidUrl(form.locationUrl)) e.locationUrl='URL inválida';
    setErrors(e);
    return Object.keys(e).length===0;
  };

  /* ---------- submit ---------- */
  const handleSubmit = async () => {

    setSaving(true);
    try {
      const fechaHora = new Date(
        form.date.getFullYear(),
        form.date.getMonth(),
        form.date.getDate(),
        form.time.getHours(),
        form.time.getMinutes(),
        0, 0
      );
      fechaHora.setHours(form.time.getHours());
      fechaHora.setMinutes(form.time.getMinutes());

      const payload = {
        fecha_hora  : fechaHora,
        capacidad   : +form.capacity,
        precio      : +form.pricePerPerson,
        ciudad      : form.city,
        location_url: form.locationUrl,
        status      : form.status,
      };

      const res = await updateExperienceApi(auth.token, experienceId, payload);
      if (res.error) throw new Error(res.error);

      Alert.alert('Éxito','Experiencia actualizada',[{text:'OK',onPress:()=>navigation.goBack()}]);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally { setSaving(false); }
  };

  /* ---------- loading ---------- */
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary}/>
          <Text style={styles.loadingText}>Cargando experiencia…</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ---------- UI ---------- */
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container}
                            behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Editar Experiencia</Text>
            <Text style={styles.subtitle}>{experience.nombre}</Text>
          </View>

          <View style={styles.form}>
            {/* fecha y hora */}
            <Text style={styles.sectionTitle}>Fecha y Hora</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity style={[styles.dateTimeButton,{borderColor:theme.colors.outline}]}
                                onPress={()=>setShowDatePicker(true)}>
                <MaterialCommunityIcons name="calendar" size={24} color={theme.colors.primary}/>
                <Text style={styles.dateTimeText}>{formatDate(form.date)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dateTimeButton,{borderColor:theme.colors.outline}]}
                                onPress={()=>setShowTimePicker(true)}>
                <MaterialCommunityIcons name="clock" size={24} color={theme.colors.primary}/>
                <Text style={styles.dateTimeText}>{formatTime(form.time)}</Text>
              </TouchableOpacity>
            </View>
            {errors.date && <Text style={[styles.errorText,{color:theme.colors.error}]}>{errors.date}</Text>}

            {/* capacidad / precio */}
            <View style={styles.row}>
              <FormInput label="Capacidad" icon="account-group" keyboardType="numeric"
                style={styles.halfInput} value={form.capacity}
                onChangeText={v=>setF('capacity',v)} errorMessage={errors.capacity}/>
              <FormInput label="Precio por persona (₡)" icon="currency-usd" keyboardType="numeric"
                style={styles.halfInput} value={form.pricePerPerson}
                onChangeText={v=>setF('pricePerPerson',v)} errorMessage={errors.pricePerPerson}/>
            </View>

            <FormInput label="URL de ubicación (opcional)" icon="map-marker" keyboardType="url"
              value={form.locationUrl} onChangeText={v=>setF('locationUrl',v)} errorMessage={errors.locationUrl}/>

            {/* ciudad */}
            <Text style={styles.sectionTitle}>Ciudad</Text>
            <View style={styles.chipContainer}>
              {CITIES.map(c=>(
                <Chip key={c} style={styles.chip} selected={form.city===c} onPress={()=>setF('city',c)}>{c}</Chip>
              ))}
            </View>

            {/* estado */}
            {experience.estado === 'upcoming' && (
              <>
                <Text style={styles.sectionTitle}>Estado</Text>
                <View style={styles.chipContainer}>
                  {STATUSES.map(s=>(
                    <Chip key={s} style={styles.chip} selected={form.status===s} onPress={()=>setF('status',s)}>
                      {getStatusText(s)}
                    </Chip>
                  ))}
                </View>
              </>
            )}
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton label="Guardar Cambios" icon="check" fullWidth
              onPress={handleSubmit} loading={saving} disabled={saving}/>
          </View>
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker value={form.date} mode="date"
            onChange={onDateChange} minimumDate={new Date()}/>
        )}
        {showTimePicker && (
          <DateTimePicker value={form.time} mode="time" onChange={onTimeChange}/>
        )}
        <Snackbar visible={snack.visible} onDismiss={()=>setSnack({visible:false,message:''})} duration={3000}>
          {snack.message}
        </Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ---------- estilos ---------- */
const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#f5f5f5' },
  scrollView:{ flex:1 },
  loadingContainer:{ flex:1, justifyContent:'center', alignItems:'center' },
  loadingText:{ marginTop:16 },
  header:{ padding:20, backgroundColor:'white' },
  title:{ fontWeight:'bold', marginBottom:4, fontSize:20 },
  subtitle:{ opacity:0.7 },
  form:{ padding:20 },
  sectionTitle:{ marginTop:16, marginBottom:8, fontWeight:'bold' },
  dateTimeContainer:{ flexDirection:'row', justifyContent:'space-between', marginBottom:16 },
  dateTimeButton:{ flex:0.48, flexDirection:'row', alignItems:'center', padding:16, borderWidth:1, borderRadius:8, backgroundColor:'white' },
  dateTimeText:{ marginLeft:8 },
  row:{ flexDirection:'row', justifyContent:'space-between' },
  halfInput:{ flex:0.48 },
  chipContainer:{ flexDirection:'row', flexWrap:'wrap', marginBottom:16 },
  chip:{ marginRight:8, marginBottom:8 },
  buttonContainer:{ padding:20, paddingBottom:40 },
  errorText:{ fontSize:12, marginTop:4, marginBottom:8 },
});

export default EditExperienceScreen;
