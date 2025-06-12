// screens/auth/LoginScreen.js
import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, useTheme, Snackbar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import CustomButton from '../../components/CustomButton';
import FormInput    from '../../components/FormInput';
import { isValidEmail } from '../../utils/validations';
import { loginUser }     from '../../utils/api';
import { saveAuth }      from '../../utils/authStorage';

const Tab = createMaterialTopTabNavigator();

/* -------- Tab genérico -------- */
const makeLoginTab = (rol) => ({ navigation }) => {
  const theme = useTheme();
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [snackbarVisible, setSnack]   = useState(false);

  const handleLogin = async () => {
    if (!isValidEmail(email))  { setError('Correo inválido'); setSnack(true); return; }
    if (password.length < 6)   { setError('Contraseña mínima 6 caracteres'); setSnack(true); return; }

    setLoading(true);
    const { token, user, error: loginError } = await loginUser({ email, password, rol });
    setLoading(false);

    if (loginError) {
      setError(loginError); setSnack(true);
      return;
    }

    /* guardar auth en AsyncStorage */
    await saveAuth({ token, user });

    /* redirección por rol */
    switch (user.rol) {
      case 'chef':
        navigation.reset({ index: 0, routes: [{ name: 'ChefDashboard' }] });
        break;
      case 'restaurante':
        navigation.reset({ index: 0, routes: [{ name: 'RestaurantDashboard' }] });
        break;
      default:
        navigation.reset({ index: 0, routes: [{ name: 'UserHome' }] });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.formContainer}>
        <FormInput label="Correo"
                   value={email}
                   onChangeText={setEmail}
                   icon="email"
                   keyboardType="email-address" />

        <FormInput label="Contraseña"
                   value={password}
                   onChangeText={setPassword}
                   icon="lock"
                   secureTextEntry />

        <CustomButton label="Iniciar Sesión"
                      onPress={handleLogin}
                      loading={loading}
                      fullWidth
                      style={styles.loginButton} />
      </View>

      <Snackbar visible={snackbarVisible}
                onDismiss={() => setSnack(false)}
                duration={3000}
                style={{ backgroundColor: theme.colors.error }}>
        {error}
      </Snackbar>
    </ScrollView>
  );
};

/* --- tabs individuales --- */
const UserLoginTab       = makeLoginTab('usuario');
const ChefLoginTab       = makeLoginTab('chef');
const RestaurantLoginTab = makeLoginTab('restaurante');

/* --- pantalla de login con barras --- */
const LoginScreen = ({ navigation }) => {
  const theme = useTheme();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.keyboardContainer}
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor: theme.colors.primary,
            tabBarIndicatorStyle: { backgroundColor: theme.colors.primary },
          }}>
          <Tab.Screen name="User"       component={UserLoginTab}
            options={{ tabBarLabel:'Usuario',     tabBarIcon:({color})=><MaterialCommunityIcons name="account" color={color} size={24}/> }}/>
          <Tab.Screen name="Chef"       component={ChefLoginTab}
            options={{ tabBarLabel:'Chef',        tabBarIcon:({color})=><MaterialCommunityIcons name="chef-hat" color={color} size={24}/> }}/>
          <Tab.Screen name="Restaurant" component={RestaurantLoginTab}
            options={{ tabBarLabel:'Restaurante', tabBarIcon:({color})=><MaterialCommunityIcons name="silverware-fork-knife" color={color} size={24}/> }}/>
        </Tab.Navigator>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#fff' },
  keyboardContainer:{ flex:1 },
  scrollContent:{ flexGrow:1, padding:20 },
  formContainer:{ width:'100%', marginBottom:20 },
  loginButton:{ marginTop:20 },
});
export default LoginScreen;
