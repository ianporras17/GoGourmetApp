import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Surface, useTheme, Snackbar, Divider, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import CustomButton from '../../components/CustomButton';
import FormInput from '../../components/FormInput';
import { isValidEmail } from '../../utils/validations';
import { loginUser } from '../../firebase/auth';

const Tab = createMaterialTopTabNavigator();

// Componente para el login de usuarios finales
const UserLoginTab = ({ navigation }) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  
  const handleLogin = async () => {
    if (!isValidEmail(email)) {
      setError('Ingresa un correo electrónico válido');
      setSnackbarVisible(true);
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setSnackbarVisible(true);
      return;
    }
    
    setLoading(true);
    
    try {
      const { user, error: loginError } = await loginUser(email, password, 'usuario');
      
      if (loginError) {
        setError(loginError);
        setSnackbarVisible(true);
      } else {
        // Navegación al Home del usuario
        // navigation.replace('UserHome');
        console.log('Usuario logueado:', user);
      }
    } catch (err) {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };
  
  const goToForgotPassword = () => {
    // navigation.navigate('ForgotPassword');
  };
  
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.formContainer}>
        <FormInput
          label="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          placeholder="ejemplo@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          validate={isValidEmail}
          errorMessage="Ingresa un correo electrónico válido"
          icon="email"
          disabled={loading}
        />
        
        <FormInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña"
          secureTextEntry
          validate={(val) => val && val.length >= 6}
          errorMessage="La contraseña debe tener al menos 6 caracteres"
          icon="lock"
          disabled={loading}
        />
        
        <CustomButton
          label="¿Olvidaste tu contraseña?"
          type="text"
          onPress={goToForgotPassword}
          style={styles.forgotPasswordButton}
          disabled={loading}
        />
        
        <CustomButton
          label="Iniciar Sesión"
          type="primary"
          icon="login"
          iconType="material-community"
          onPress={handleLogin}
          loading={loading}
          fullWidth
          style={styles.loginButton}
        />
      </View>
      
      <View style={styles.signupSection}>
        <Text>¿No tienes una cuenta?</Text>
        <CustomButton
          label="Regístrate aquí"
          type="text"
          onPress={() => navigation.navigate('Register')}
          style={styles.signupButton}
          disabled={loading}
        />
      </View>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: theme.colors.error }}
      >
        {error}
      </Snackbar>
    </ScrollView>
  );
};

// Componente para el login de chefs
const ChefLoginTab = ({ navigation }) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  
  const handleLogin = async () => {
    if (!isValidEmail(email)) {
      setError('Ingresa un correo electrónico válido');
      setSnackbarVisible(true);
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setSnackbarVisible(true);
      return;
    }
    
    setLoading(true);
    
    try {
      const { user, error: loginError } = await loginUser(email, password, 'chef');
      
      if (loginError) {
        setError(loginError);
        setSnackbarVisible(true);
      } else {
        // Navegación al Home del chef
        // navigation.replace('ChefHome');
        console.log('Chef logueado:', user);
      }
    } catch (err) {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };
  
  const goToForgotPassword = () => {
    // navigation.navigate('ForgotPassword');
  };
  
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.formContainer}>
        <FormInput
          label="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          placeholder="ejemplo@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          validate={isValidEmail}
          errorMessage="Ingresa un correo electrónico válido"
          icon="email"
          disabled={loading}
        />
        
        <FormInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña"
          secureTextEntry
          validate={(val) => val && val.length >= 6}
          errorMessage="La contraseña debe tener al menos 6 caracteres"
          icon="lock"
          disabled={loading}
        />
        
        <CustomButton
          label="¿Olvidaste tu contraseña?"
          type="text"
          onPress={goToForgotPassword}
          style={styles.forgotPasswordButton}
          disabled={loading}
        />
        
        <CustomButton
          label="Iniciar Sesión"
          type="primary"
          icon="login"
          iconType="material-community"
          onPress={handleLogin}
          loading={loading}
          fullWidth
          style={styles.loginButton}
        />
      </View>
      
      <View style={styles.signupSection}>
        <Text>¿No tienes una cuenta?</Text>
        <CustomButton
          label="Regístrate aquí"
          type="text"
          onPress={() => navigation.navigate('Register')}
          style={styles.signupButton}
          disabled={loading}
        />
      </View>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: theme.colors.error }}
      >
        {error}
      </Snackbar>
    </ScrollView>
  );
};

// Componente para el login de restaurantes
const RestaurantLoginTab = ({ navigation }) => {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  
  const handleLogin = async () => {
    if (!isValidEmail(email)) {
      setError('Ingresa un correo electrónico válido');
      setSnackbarVisible(true);
      return;
    }
    
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setSnackbarVisible(true);
      return;
    }
    
    setLoading(true);
    
    try {
      const { user, error: loginError } = await loginUser(email, password, 'restaurante');
      
      if (loginError) {
        setError(loginError);
        setSnackbarVisible(true);
      } else {
        // Navegación al Home del restaurante
        // navigation.replace('RestaurantHome');
        console.log('Restaurante logueado:', user);
      }
    } catch (err) {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };
  
  const goToForgotPassword = () => {
    // navigation.navigate('ForgotPassword');
  };
  
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.formContainer}>
        <FormInput
          label="Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          placeholder="ejemplo@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          validate={isValidEmail}
          errorMessage="Ingresa un correo electrónico válido"
          icon="email"
          disabled={loading}
        />
        
        <FormInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Contraseña"
          secureTextEntry
          validate={(val) => val && val.length >= 6}
          errorMessage="La contraseña debe tener al menos 6 caracteres"
          icon="lock"
          disabled={loading}
        />
        
        <CustomButton
          label="¿Olvidaste tu contraseña?"
          type="text"
          onPress={goToForgotPassword}
          style={styles.forgotPasswordButton}
          disabled={loading}
        />
        
        <CustomButton
          label="Iniciar Sesión"
          type="primary"
          icon="login"
          iconType="material-community"
          onPress={handleLogin}
          loading={loading}
          fullWidth
          style={styles.loginButton}
        />
      </View>
      
      <View style={styles.signupSection}>
        <Text>¿No tienes una cuenta?</Text>
        <CustomButton
          label="Regístrate aquí"
          type="text"
          onPress={() => navigation.navigate('Register')}
          style={styles.signupButton}
          disabled={loading}
        />
      </View>
      
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={{ backgroundColor: theme.colors.error }}
      >
        {error}
      </Snackbar>
    </ScrollView>
  );
};

// Pantalla principal de login con tabs
const LoginScreen = ({ navigation }) => {
  const theme = useTheme();
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <CustomButton
          icon="arrow-left"
          type="text"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          contentStyle={{ height: 40 }}
        />
        <Text style={styles.headerTitle}>Iniciar Sesión</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: 'gray',
            tabBarIndicatorStyle: { backgroundColor: theme.colors.primary },
            tabBarLabelStyle: { fontWeight: 'bold', textTransform: 'none' },
          }}
        >
          <Tab.Screen 
            name="UserLogin" 
            component={UserLoginTab} 
            options={{ 
              tabBarLabel: 'Usuario',
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons name="account" color={color} size={24} />
              ),
            }}
          />
          <Tab.Screen 
            name="ChefLogin" 
            component={ChefLoginTab} 
            options={{ 
              tabBarLabel: 'Chef',
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons name="chef-hat" color={color} size={24} />
              ),
            }}
          />
          <Tab.Screen 
            name="RestaurantLogin" 
            component={RestaurantLoginTab} 
            options={{ 
              tabBarLabel: 'Restaurante',
              tabBarIcon: ({ color }) => (
                <MaterialCommunityIcons name="silverware-fork-knife" color={color} size={24} />
              ),
            }}
          />
        </Tab.Navigator>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    marginRight: 10,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  formContainer: {
    width: '100%',
    marginBottom: 20,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginVertical: 5,
  },
  loginButton: {
    marginTop: 20,
  },
  signupSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupButton: {
    marginLeft: 5,
  },
});

export default LoginScreen; 