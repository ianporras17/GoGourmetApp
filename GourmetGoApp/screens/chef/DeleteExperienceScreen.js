// screens/chef/DeleteExperienceScreen.js
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import CustomButton from '../../components/CustomButton';
import FormInput    from '../../components/FormInput';

import {
  getExperience,
  deleteExperienceApi,
} from '../../utils/api';
import { getAuth } from '../../utils/authStorage';
import { generateVerificationCode, sendEmail } from '../../utils/helpers';
import { isValidEmail } from '../../utils/validations';


const DeleteExperienceScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { experienceId, experienceName } = route.params;

  /* -------- estados -------- */
  const [auth, setAuth] = useState(null);        // { token, user }
  const [experience, setExperience] = useState(null);
  const [step, setStep] = useState(1);           // 1 email, 2 code, 3 confirm
  const [email, setEmail] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  /* -------- on mount -------- */
  useEffect(() => {
    getAuth().then(setAuth);              // token + user
  }, []);

  useEffect(() => {
    if (auth) loadExperience();
  }, [auth]);

  /* -------- cargar experiencia -------- */
  const loadExperience = async () => {
    try {
      const result = await getExperience(experienceId);
      if (result.error) throw new Error(result.error);

      if (result.estado === 'sold_out') {
        Alert.alert('No permitido', 'No se pueden eliminar experiencias agotadas', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
        return;
      }
      setExperience(result);
      setEmail(auth.user.email);
    } catch (err) {
      Alert.alert('Error', err.message);
      navigation.goBack();
    } finally { setLoading(false); }
  };

  /* -------- paso 1: verificar email -------- */
  const handleEmailVerification = async () => {
    if (processing) return;           // evita toques repetidos
    setProcessing(true);              // <- mueve esto al principio
    
    if (!isValidEmail(email))      { setErrors({ email:'Email inválido' });            return; }
    

    try {
      const code = generateVerificationCode();
      setGeneratedCode(code);

      await sendEmail({
        to: email,
        subject: 'Código de verificación - Eliminación de experiencia',
        body: `Tu código es: ${code}`,
      });

      setStep(2);
      Alert.alert('Código enviado', `Se envió un código a ${email}`);
    } catch {
      Alert.alert('Error', 'No se pudo enviar el código');
    } finally { setProcessing(false); }
  };

  /* -------- paso 2: código -------- */
  const handleCodeVerification = () => {
    if (userCode.toUpperCase() !== generatedCode.toUpperCase()) {
      setErrors({ code:'Código incorrecto' });
      return;
    }
    setStep(3);
  };

  /* -------- paso 3: confirmación final -------- */
  const handleFinalConfirmation = async () => {
    setProcessing(true);

    try {
      // 1️⃣  Eliminar la experiencia
      const del = await deleteExperienceApi(auth.token, experienceId);
      if (del.error) throw new Error(del.error);

      // 2️⃣  Alerta de éxito y regreso al dashboard
      Alert.alert(
        'Experiencia eliminada',
        `La experiencia "${experienceName}" ha sido eliminada exitosamente.`,
        [{ text: 'OK', onPress: () => navigation.navigate('ChefDashboard') }],
      );
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setProcessing(false);
    }
  };
  /* -------- helpers -------- */
  const updateField = (k, v) => {
    if (k==='email')   setEmail(v);
    if (k==='userCode')setUserCode(v.toUpperCase());
    if (errors[k]) setErrors({ ...errors, [k]:null });
  };


  /* -------- loading -------- */
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary}/>
          <Text style={styles.loadingText}>Cargando…</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* -------- UI -------- */
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>

        {/* encabezado */}
        <View style={styles.header}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error}/>
          <Text style={[styles.title,{color:theme.colors.text}]}>Eliminar Experiencia</Text>
          <Text style={[styles.subtitle,{color:theme.colors.placeholder}]}>{experienceName}</Text>
        </View>

        <View style={styles.content}>
          {step === 1 && (
            <View>
              <View style={styles.warningBox}>
                <MaterialCommunityIcons name="information" size={20} color={theme.colors.error}/>
                <Text style={[styles.warningText,{color:theme.colors.text}]}>
                  Para eliminar esta experiencia, verifica tu email.
                </Text>
              </View>

              <FormInput label="Confirma tu email" icon="email"
                value={email} onChangeText={(v)=>updateField('email',v)}
                errorMessage={errors.email} keyboardType="email-address"/>

              <CustomButton label={processing?'Enviando…':'Enviar código de verificación'}
                onPress={handleEmailVerification} loading={processing}
                fullWidth icon="send"/>
            </View>
          )}

          {step === 2 && (
            <View>
              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary}/>
                <Text style={[styles.infoText,{color:theme.colors.text}]}>
                  Ingresa el código de 7 caracteres enviado a tu correo.
                </Text>
              </View>

              <FormInput label="Código" icon="key"
                value={userCode} onChangeText={(v)=>updateField('userCode',v)}
                errorMessage={errors.code} maxLength={7} autoCapitalize="characters"/>

              <View style={styles.buttonRow}>
                <CustomButton label="Reenviar código" onPress={handleEmailVerification}
                  type="outline" style={styles.halfButton} loading={processing} disabled={processing}/>
                <CustomButton label="Verificar" onPress={handleCodeVerification}
                  style={styles.halfButton} icon="check"/>
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              <View style={styles.dangerBox}>
                <MaterialCommunityIcons name="alert" size={24} color="white"/>
                <Text style={styles.dangerTitle}>¡ADVERTENCIA!</Text>
                <Text style={styles.dangerText}>
                  Esta acción es IRREVERSIBLE. Al eliminar esta experiencia:
                </Text>
                <Text style={styles.dangerList}>
                  • Se eliminará permanentemente de la plataforma{'\n'}
                  • Se cancelarán las reservaciones existentes{'\n'}
                  • Se notificará a los usuarios afectados
                </Text>
              </View>

              <View style={styles.experienceInfo}>
                <Text style={styles.infoLabel}>Experiencia a eliminar:</Text>
                <Text style={styles.experienceName}>{experienceName}</Text>
                <Text style={styles.experienceDetails}>
                  Capacidad: {experience.capacidad} personas
                </Text>
                <Text style={styles.experienceDetails}>
                  Espacios reservados: {experience.capacidad - experience.cupos_disponibles}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <CustomButton label="Cancelar" onPress={()=>navigation.goBack()}
                  type="outline" style={styles.halfButton}/>
                <CustomButton label={processing?'Eliminando…':'Eliminar definitivamente'}
                  onPress={handleFinalConfirmation} type="error"
                  style={styles.halfButton} loading={processing || !auth}
                  disabled={processing || !auth} icon="delete"/>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* -------- estilos -------- */
const styles = StyleSheet.create({
  container:{ flex:1 },
  scrollView:{ flex:1 },
  loadingContainer:{ flex:1, justifyContent:'center', alignItems:'center' },
  loadingText:{ marginTop:10, fontSize:16 },
  header:{ padding:20, alignItems:'center' },
  title:{ fontSize:24, fontWeight:'bold', marginTop:12, marginBottom:4 },
  subtitle:{ fontSize:16, textAlign:'center' },
  content:{ padding:20 },
  warningBox:{ flexDirection:'row', alignItems:'center', backgroundColor:'#FFF3E0',
               padding:12, borderRadius:8, marginBottom:20 },
  warningText:{ marginLeft:8, flex:1, fontSize:14 },
  infoBox:{ flexDirection:'row', alignItems:'center', backgroundColor:'#E3F2FD',
            padding:12, borderRadius:8, marginBottom:20 },
  infoText:{ marginLeft:8, flex:1, fontSize:14 },
  dangerBox:{ backgroundColor:'#F44336', padding:16, borderRadius:8,
              marginBottom:20, alignItems:'center' },
  dangerTitle:{ color:'white', fontSize:18, fontWeight:'bold', marginVertical:8, textAlign:'center' },
  dangerText:{ color:'white', fontSize:14, marginBottom:8, textAlign:'center' },
  dangerList:{ color:'white', fontSize:14, alignSelf:'stretch' },
  experienceInfo:{ backgroundColor:'#F5F5F5', padding:16, borderRadius:8, marginBottom:20 },
  infoLabel:{ fontSize:14, marginBottom:4 },
  experienceName:{ fontSize:18, fontWeight:'bold', marginBottom:8 },
  experienceDetails:{ fontSize:14, marginBottom:4 },
  buttonRow:{ flexDirection:'row', justifyContent:'space-between', marginTop:16 },
  halfButton:{ flex:0.48 },
});

export default DeleteExperienceScreen;
