// screens/chef/CreateExperienceScreen.js
import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, ScrollView, Alert, TouchableOpacity, Image,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import {
  Text, useTheme, Snackbar, Chip, Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

import CustomButton from '../../components/CustomButton';
import FormInput    from '../../components/FormInput';

import { createExperience, uploadImage } from '../../utils/api';   // 🔄 backend
import { getAuth } from '../../utils/authStorage';                // 🔑 token + user
import { isValidName, isValidUrl } from '../../utils/validations';
import { formatDate, formatTime } from '../../utils/helpers';

/* ────────── constantes ────────── */
const EVENT_TYPES = ['Cena', 'Almuerzo', 'Taller de Cocina', 'Degustación', 'Brunch', 'Especial'];
const CITIES      = ['San José','Alajuela','Cartago','Heredia','Guanacaste','Puntarenas','Limón'];

/* ────────── componente ────────── */
const CreateExperienceScreen = ({ navigation }) => {
  const theme = useTheme();

  /* estado local */
  const [auth, setAuth] = useState(null);    // { token, user }
  const [formData, setFormData] = useState({
    name:'', description:'', date:new Date(), time:new Date(),
    capacity:'', pricePerPerson:'', duration:'',
    eventType:EVENT_TYPES[0], city:CITIES[0],
    requirements:'', locationUrl:'', menu:'',
  });
  const [images, setImages]   = useState([]);
  const [showDatePicker,setShowDatePicker] = useState(false);
  const [showTimePicker,setShowTimePicker] = useState(false);
  const [loading,setLoading]  = useState(false);
  const [snackbar,setSnackbar]= useState({ visible:false, message:'' });
  const [errors,setErrors]    = useState({});

  /* obtener token al montar */
  useEffect(()=>{ getAuth().then(setAuth); }, []);

  /* validación de formulario */
  const validateForm = () => {
    console.log('✓ validación iniciada a la 2'); 
    const e = {};
    if(!isValidName(formData.name))                            e.name='Nombre mínimo 3 caracteres';
    console.log('✓ validación iniciada a la 4'); 
    if(!formData.description || formData.description.length<10)e.description='Descripción mínima 10 caracteres';
    console.log('✓ validación iniciada a la 5'); 
    if(formData.date < new Date().setHours(0,0,0,0))           e.date='La fecha no puede ser en el pasado';
    console.log('✓ validación iniciada a la 6'); 
    if(!formData.capacity || +formData.capacity<=0)            e.capacity='Capacidad debe ser mayor a 0';
    console.log('✓ validación iniciada a la 7'); 
    if(!formData.pricePerPerson || +formData.pricePerPerson<=0)e.pricePerPerson='Precio debe ser mayor a 0';
    console.log('✓ validación iniciada a la 8'); 
    if(!formData.duration)                                     e.duration='Duración requerida';
    console.log('✓ validación iniciada a la 9'); 
    if(images.length===0)                                      e.images='Al menos una imagen';
    console.log('✓ validación iniciada a la 11'); 
    setErrors(e);
    console.log('errores de validación:', e);  
    return Object.keys(e).length===0;
  };

  /* selección y borrado de imágenes */
  const pickImage = async () => {
    console.log('tap');

  // Límite de 5 imágenes
  if (images.length >= 5) {
    Alert.alert('Límite: 5 imágenes');
    return;
  }

  /* 1️⃣  Verificar permiso existente */
  let { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
  console.log('permiso actual:', status);

  /* 2️⃣  Si no está concedido, solicitarlo */
  if (status !== 'granted') {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    status = res.status;
  }

  /* 3️⃣  Si aún no se concede, abortar */
  if (status !== 'granted') {
    Alert.alert(
      'Permiso requerido',
      'Necesitamos acceso a tu galería para seleccionar imágenes.'
    );
    return;
  }

  /* 4️⃣  Abrir galería con la API nueva */
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,    //  ✅  not “MediaTypeOptions”
    allowsEditing: true,
    aspect: [16, 9],
    quality: 0.8,
  });

  console.log('resultado picker:', res);

  /* 5️⃣  Añadir la imagen si el usuario no canceló */
  if (!res.canceled) {
    setImages([...images, { uri: res.assets[0].uri }]);
  }
};
  /* subir imágenes a backend (Cloudinary o tu storage) */
  const uploadImages = async () => {
     console.log('✓ validación superada 45'); 
    const urls=[];
    for(const img of images){
      const r = await uploadImage(auth.token, img);   // usa token
      console.log('respuesta upload:', r); 
      if(r.error) throw new Error(r.error);

      urls.push(r.url);
    }
    return urls;
  };

  useEffect(() => {
    getAuth().then(setAuth);      // tarda unos ms
  }, []);

  /* envío al servidor */
  const handleSubmit = async () => {
    console.log('submit pressed, auth:', auth);  

     if (!auth) {                       // ← todavía no llegó el token
      Alert.alert('Espera', 'Cargando usuario…');
      return;
    }
    console.log('✓ validación iniciada'); 

    if (!validateForm()) {
      console.log('✗ validación falló:', errors);   // <–– añade esto
      setSnackbar({ visible:true, message:'Corrige los errores' });
      return;
    }
    console.log('✓ validación superada'); 
    setLoading(true);
    console.log('✓ validación superada'); 
    try{
      const imageUrls = await uploadImages();
       console.log('✓ validación superada 2'); 
      const dateTime  = new Date(formData.date);
       console.log('✓ validación superada 3'); 
      dateTime.setHours(formData.time.getHours());
       console.log('✓ validación superada 4'); 
      dateTime.setMinutes(formData.time.getMinutes());
       console.log('✓ validación superada 5'); 
      const payload = {
        nombre       : formData.name,
        descripcion  : formData.description,
        fecha_hora   : dateTime,
        capacidad    : +formData.capacity,
        precio       : +formData.pricePerPerson,
        duration     : formData.duration,
        event_type   : formData.eventType,
        ciudad       : formData.city,
        requirements : formData.requirements,
        location_url : formData.locationUrl,
        menu         : formData.menu,
        images       : imageUrls,
      };

      const res = await createExperience(auth.token, payload);
      console.log('respuesta backend:', res);
      if(res.error) throw new Error(res.error);

      Alert.alert('Éxito','Experiencia creada',[{text:'OK',onPress:()=>navigation.goBack()}]);
    }catch(e){ Alert.alert('Error', e.message); }
    finally{ setLoading(false); }
  };

  /* actualizadores rápidos */
  const setF = (k,v)=>setFormData({...formData,[k]:v});

  /* date/time */
  const onDateChange=(_,d)=>{ setShowDatePicker(false); if(d) setF('date',d); };
  const onTimeChange=(_,t)=>{ setShowTimePicker(false); if(t) setF('time',t); };

  /* ────── UI ────── */
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS==='ios'?'padding':'height'}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* encabezado */}
          <View style={styles.header}>
            <Text variant="headlineSmall" style={styles.title}>Nueva Experiencia</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>Crea una experiencia gastronómica única</Text>
          </View>

          {/* formulario */}
          <View style={styles.form}>
            <FormInput label="Nombre de la experiencia" icon="chef-hat"
              value={formData.name} onChangeText={v=>setF('name',v)} errorMessage={errors.name} />

            <FormInput label="Descripción" icon="text" multiline numberOfLines={4}
              value={formData.description} onChangeText={v=>setF('description',v)} errorMessage={errors.description} />

            <View style={styles.dateTimeContainer}>
              <TouchableOpacity style={[styles.dateTimeButton,{borderColor:theme.colors.outline}]} onPress={()=>setShowDatePicker(true)}>
                <MaterialCommunityIcons name="calendar" size={24} color={theme.colors.primary}/>
                <Text variant="bodyLarge" style={styles.dateTimeText}>{formatDate(formData.date)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dateTimeButton,{borderColor:theme.colors.outline}]} onPress={()=>setShowTimePicker(true)}>
                <MaterialCommunityIcons name="clock" size={24} color={theme.colors.primary}/>
                <Text variant="bodyLarge" style={styles.dateTimeText}>{formatTime(formData.time)}</Text>
              </TouchableOpacity>
            </View>
            {errors.date && <Text style={[styles.errorText,{color:theme.colors.error}]}>{errors.date}</Text>}

            <View style={styles.row}>
              <FormInput label="Capacidad" icon="account-group" keyboardType="numeric" style={styles.halfInput}
                value={formData.capacity} onChangeText={v=>setF('capacity',v)} errorMessage={errors.capacity}/>
              <FormInput label="Precio por persona (₡)" icon="currency-usd" keyboardType="numeric" style={styles.halfInput}
                value={formData.pricePerPerson} onChangeText={v=>setF('pricePerPerson',v)} errorMessage={errors.pricePerPerson}/>
            </View>

            <FormInput label="Duración (ej: 2 horas)" icon="timer"
              value={formData.duration} onChangeText={v=>setF('duration',v)} errorMessage={errors.duration}/>

            <Text variant="titleSmall" style={styles.sectionTitle}>Tipo de Experiencia</Text>
            <View style={styles.chipContainer}>
              {EVENT_TYPES.map(t=>(
                <Chip key={t} style={styles.chip} selected={formData.eventType===t} onPress={()=>setF('eventType',t)}>{t}</Chip>
              ))}
            </View>

            <Text variant="titleSmall" style={styles.sectionTitle}>Ciudad</Text>
            <View style={styles.chipContainer}>
              {CITIES.map(c=>(
                <Chip key={c} style={styles.chip} selected={formData.city===c} onPress={()=>setF('city',c)}>{c}</Chip>
              ))}
            </View>

            <FormInput label="Requisitos (opcional)" icon="information" multiline numberOfLines={2}
              value={formData.requirements} onChangeText={v=>setF('requirements',v)}/>
            <FormInput label="URL de ubicación (opcional)" icon="map-marker" keyboardType="url"
              value={formData.locationUrl} onChangeText={v=>setF('locationUrl',v)} errorMessage={errors.locationUrl}/>
            <FormInput label="Menú (opcional)" icon="food" multiline numberOfLines={3}
              value={formData.menu} onChangeText={v=>setF('menu',v)}/>

            <Divider style={styles.divider}/>
            <Text variant="titleSmall" style={styles.sectionTitle}>Imágenes de la experiencia *</Text>

            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
              <MaterialCommunityIcons name="camera-plus" size={32} color={theme.colors.primary}/>
              <Text variant="bodyMedium" style={styles.imagePickerText}>Agregar imagen ({images.length}/5)</Text>
            </TouchableOpacity>
            {errors.images && <Text style={[styles.errorText,{color:theme.colors.error}]}>{errors.images}</Text>}

            <View style={styles.imageContainer}>
              {images.map((img,i)=>(
                <View key={i} style={styles.imageWrapper}>
                  <Image source={{uri:img.uri}} style={styles.image}/>
                  <TouchableOpacity style={styles.removeImageButton} onPress={()=>removeImage(i)}>
                    <MaterialCommunityIcons name="close" size={20} color="white"/>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton
                label="Crear Experiencia"
                icon="check"
                fullWidth
                onPress={handleSubmit}
                loading={loading || !auth}
                disabled={loading || !auth}   // 🔒 bloquea sin token
              />
          </View>
        </ScrollView>

        {showDatePicker && <DateTimePicker value={formData.date} mode="date" onChange={onDateChange} minimumDate={new Date()}/>}
        {showTimePicker && <DateTimePicker value={formData.time} mode="time" onChange={onTimeChange}/>}

        <Snackbar visible={snackbar.visible} onDismiss={()=>setSnackbar({visible:false,message:''})} duration={3000}>{snackbar.message}</Snackbar>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* estilos */
const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#f5f5f5' },
  scrollView:{ flex:1 },
  header:{ padding:20, backgroundColor:'white' },
  title:{ fontWeight:'bold', marginBottom:4 },
  subtitle:{ opacity:0.7 },
  form:{ padding:20 },
  dateTimeContainer:{ flexDirection:'row', justifyContent:'space-between', marginBottom:16 },
  dateTimeButton:{ flex:0.48, flexDirection:'row', alignItems:'center', padding:16, borderWidth:1, borderRadius:8, backgroundColor:'white' },
  dateTimeText:{ marginLeft:8 },
  row:{ flexDirection:'row', justifyContent:'space-between' },
  halfInput:{ flex:0.48 },
  sectionTitle:{ marginTop:16, marginBottom:8, fontWeight:'bold' },
  chipContainer:{ flexDirection:'row', flexWrap:'wrap', marginBottom:16 },
  chip:{ marginRight:8, marginBottom:8 },
  divider:{ marginVertical:20 },
  imagePickerButton:{ flexDirection:'row', alignItems:'center', justifyContent:'center', padding:20, borderWidth:2, borderStyle:'dashed', borderRadius:8, marginBottom:16 },
  imagePickerText:{ marginLeft:8 },
  imageContainer:{ flexDirection:'row', flexWrap:'wrap' },
  imageWrapper:{ position:'relative', marginRight:8, marginBottom:8 },
  image:{ width:100, height:100, borderRadius:8 },
  removeImageButton:{ position:'absolute', top:-8, right:-8, backgroundColor:'red', borderRadius:12, width:24, height:24, justifyContent:'center', alignItems:'center' },
  buttonContainer:{ padding:20, paddingBottom:40 },
  errorText:{ fontSize:12, marginTop:4, marginBottom:8 },
});

export default CreateExperienceScreen;
