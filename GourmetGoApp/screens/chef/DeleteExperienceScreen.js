import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, useTheme, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import CustomButton from '../../components/CustomButton';
import FormInput from '../../components/FormInput';
import { getExperienceById, deleteExperience, getExperienceReservations } from '../../firebase/db';
import { getCurrentUser } from '../../firebase/auth';
import { generateVerificationCode, sendEmail } from '../../utils/helpers';
import { isValidEmail } from '../../utils/validations';

const DeleteExperienceScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const { experienceId, experienceName } = route.params;
  const currentUser = getCurrentUser();
  
  const [experience, setExperience] = useState(null);
  const [step, setStep] = useState(1); // 1: verificar email, 2: código, 3: confirmación
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadExperience();
  }, []);

  const loadExperience = async () => {
    try {
      const result = await getExperienceById(experienceId);
      if (result.error) {
        Alert.alert('Error', result.error);
        navigation.goBack();
        return;
      }
      
      const exp = result.data;
      
      // Verificar que no esté agotado
      if (exp.status === 'sold_out') {
        Alert.alert(
          'No permitido',
          'No se pueden eliminar experiencias agotadas',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      setExperience(exp);
      setEmail(currentUser?.email || '');
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la experiencia');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async () => {
    if (!isValidEmail(email)) {
      setErrors({ email: 'Email inválido' });
      return;
    }
    
    if (email !== currentUser?.email) {
      setErrors({ email: 'El email debe coincidir con tu cuenta' });
      return;
    }
    
    setProcessing(true);
    
    try {
      // Generar código de verificación
      const code = generateVerificationCode();
      setGeneratedCode(code);
      
      // Simular envío de email
      await sendEmail({
        to: email,
        subject: 'Código de verificación - Eliminación de experiencia',
        body: `Tu código de verificación es: ${code}\n\nEste código es para eliminar la experiencia: ${experienceName}`
      });
      
      setStep(2);
      Alert.alert('Código enviado', `Se ha enviado un código de verificación a ${email}`);
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar el código de verificación');
    } finally {
      setProcessing(false);
    }
  };

  const handleCodeVerification = () => {
    if (userCode.toUpperCase() !== generatedCode.toUpperCase()) {
      setErrors({ code: 'Código incorrecto' });
      return;
    }
    
    setStep(3);
  };

  const handleFinalConfirmation = async () => {
    setProcessing(true);
    
    try {
      // Verificar si hay reservaciones
      const reservationsResult = await getExperienceReservations(experienceId);
      const reservations = reservationsResult.data || [];
      
      // Eliminar experiencia
      const result = await deleteExperience(experienceId);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Notificar a usuarios con reservaciones (simulado)
      if (reservations.length > 0) {
        for (const reservation of reservations) {
          await sendEmail({
            to: reservation.userEmail,
            subject: 'Experiencia cancelada',
            body: `Lamentamos informarte que la experiencia "${experienceName}" ha sido cancelada. Te contactaremos pronto para el reembolso.`
          });
        }
      }
      
      Alert.alert(
        'Experiencia eliminada',
        `La experiencia "${experienceName}" ha sido eliminada exitosamente.${reservations.length > 0 ? ` Se ha notificado a ${reservations.length} usuario(s) con reservaciones.` : ''}`,
        [{ text: 'OK', onPress: () => navigation.navigate('Dashboard') }]
      );
      
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setProcessing(false);
    }
  };

  const updateField = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'userCode') setUserCode(value);
    
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Eliminar Experiencia</Text>
          <Text style={[styles.subtitle, { color: theme.colors.placeholder }]}>{experienceName}</Text>
        </View>

        <View style={styles.content}>
          {step === 1 && (
            <View>
              <View style={styles.warningBox}>
                <MaterialCommunityIcons name="information" size={20} color={theme.colors.error} />
                <Text style={[styles.warningText, { color: theme.colors.text }]}>
                  Para eliminar esta experiencia, necesitas verificar tu identidad por seguridad.
                </Text>
              </View>

              <FormInput
                label="Confirma tu email"
                value={email}
                onChangeText={(value) => updateField('email', value)}
                placeholder="tu@email.com"
                keyboardType="email-address"
                errorMessage={errors.email}
                icon="email"
              />

              <CustomButton
                label={processing ? 'Enviando código...' : 'Enviar código de verificación'}
                onPress={handleEmailVerification}
                loading={processing}
                disabled={processing}
                fullWidth
                icon="send"
              />
            </View>
          )}

          {step === 2 && (
            <View>
              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary} />
                <Text style={[styles.infoText, { color: theme.colors.text }]}>
                  Se ha enviado un código de verificación a tu email. Ingresa el código de 7 caracteres (4 números + 3 letras).
                </Text>
              </View>

              <FormInput
                label="Código de verificación"
                value={userCode}
                onChangeText={(value) => updateField('userCode', value.toUpperCase())}
                placeholder="1234ABC"
                maxLength={7}
                autoCapitalize="characters"
                errorMessage={errors.code}
                icon="key"
              />

              <View style={styles.buttonRow}>
                <CustomButton
                  label="Reenviar código"
                  onPress={handleEmailVerification}
                  type="outline"
                  style={styles.halfButton}
                  loading={processing}
                  disabled={processing}
                />
                <CustomButton
                  label="Verificar"
                  onPress={handleCodeVerification}
                  style={styles.halfButton}
                  icon="check"
                />
              </View>
            </View>
          )}

          {step === 3 && (
            <View>
              <View style={styles.dangerBox}>
                <MaterialCommunityIcons name="alert" size={24} color="white" />
                <Text style={styles.dangerTitle}>¡ADVERTENCIA!</Text>
                <Text style={styles.dangerText}>
                  Esta acción es IRREVERSIBLE. Al eliminar esta experiencia:
                </Text>
                <Text style={styles.dangerList}>
                  • Se eliminará permanentemente de la plataforma
                  • Se cancelarán todas las reservaciones existentes
                  • Se notificará automáticamente a los usuarios afectados
                  • No podrás recuperar esta información
                </Text>
              </View>

              <View style={styles.experienceInfo}>
                <Text style={[styles.infoLabel, { color: theme.colors.text }]}>Experiencia a eliminar:</Text>
                <Text style={[styles.experienceName, { color: theme.colors.text }]}>{experienceName}</Text>
                <Text style={[styles.experienceDetails, { color: theme.colors.placeholder }]}>
                  Capacidad: {experience?.capacity} personas
                </Text>
                <Text style={[styles.experienceDetails, { color: theme.colors.placeholder }]}>
                  Espacios reservados: {experience?.capacity - experience?.availableSpots}
                </Text>
              </View>

              <View style={styles.buttonRow}>
                <CustomButton
                  label="Cancelar"
                  onPress={() => navigation.goBack()}
                  type="outline"
                  style={styles.halfButton}
                />
                <CustomButton
                  label={processing ? 'Eliminando...' : 'Eliminar definitivamente'}
                  onPress={handleFinalConfirmation}
                  type="error"
                  style={styles.halfButton}
                  loading={processing}
                  disabled={processing}
                  icon="delete"
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  dangerBox: {
    backgroundColor: '#F44336',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  dangerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  dangerText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  dangerList: {
    color: 'white',
    fontSize: 14,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  experienceInfo: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  experienceName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  experienceDetails: {
    fontSize: 14,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  halfButton: {
    flex: 0.48,
  },
});

export default DeleteExperienceScreen;