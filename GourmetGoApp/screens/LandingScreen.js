import React from 'react';
import { StyleSheet, View, Image, StatusBar, ImageBackground } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import CustomButton from '../components/CustomButton';

const LandingScreen = ({ navigation }) => {
  const theme = useTheme();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      
      <View style={styles.logoContainer}>
        {/* Aquí irá el logo de la app */}
        <View style={[styles.logoPlaceholder, { backgroundColor: theme.colors.primary }]}>
          <MaterialCommunityIcons name="food-fork-drink" size={60} color="white" />
        </View>
        <Text style={styles.appName}>GourmetGo</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.welcomeTitle}>¡Bienvenido a GourmetGo!</Text>
        <Text style={styles.welcomeText}>
          Descubre experiencias gastronómicas únicas creadas por chefs y restaurantes.
          Reserva tu lugar y disfruta de momentos inolvidables.
        </Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <CustomButton
          label="Iniciar Sesión"
          type="primary"
          icon="login"
          iconType="material-community"
          fullWidth
          onPress={() => navigation.navigate('Login')}
        />
        
        <CustomButton
          label="Registrarse"
          type="secondary"
          icon="account-plus"
          iconType="material-community"
          fullWidth
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 30,
    marginBottom: 40,
  },
});

export default LandingScreen; 