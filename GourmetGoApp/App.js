import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';

// Import screens
import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ChatbotScreen from './screens/common/ChatbotScreen';

// User screens
import ExploreScreen from './screens/user/ExploreScreen';
import ExperienceDetailScreen from './screens/user/ExperienceDetailScreen';
import BookingScreen from './screens/user/BookingScreen';
import RateExperienceScreen from './screens/user/RateExperienceScreen';
import UserReservationsScreen from './screens/user/UserReservationsScreen';
import UserEditProfileScreen from './screens/user/EditProfileScreen';

// Chef screens
import DashboardScreen from './screens/chef/DashboardScreen';
import CreateExperienceScreen from './screens/chef/CreateExperienceScreen';
import EditExperienceScreen from './screens/chef/EditExperienceScreen';
import DeleteExperienceScreen from './screens/chef/DeleteExperienceScreen';
import AttendeesScreen from './screens/chef/AttendeesScreen';
import ChefEditProfileScreen from './screens/chef/EditProfileScreen';

import { getUserProfile } from './firebase/db';
import { userTheme, chefTheme } from './constants/theme';

const Stack = createStackNavigator();

// Common Stack (for non-authenticated users)
const CommonStack = () => (
  <Stack.Navigator initialRouteName="Landing" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Landing" component={LandingScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="Chatbot" component={ChatbotScreen} />
  </Stack.Navigator>
);

// User Stack (for end users)
const UserStack = () => (
  <Stack.Navigator initialRouteName="Explore" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Explore" component={ExploreScreen} />
    <Stack.Screen name="ExperienceDetail" component={ExperienceDetailScreen} />
    <Stack.Screen name="Booking" component={BookingScreen} />
    <Stack.Screen name="RateExperience" component={RateExperienceScreen} />
    <Stack.Screen name="UserReservations" component={UserReservationsScreen} />
    <Stack.Screen name="EditProfile" component={UserEditProfileScreen} />
    <Stack.Screen name="Chatbot" component={ChatbotScreen} />
  </Stack.Navigator>
);

// Chef Stack (for chefs/restaurants)
const ChefStack = () => (
  <Stack.Navigator initialRouteName="Dashboard" screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Dashboard" component={DashboardScreen} />
    <Stack.Screen name="CreateExperience" component={CreateExperienceScreen} />
    <Stack.Screen name="EditExperience" component={EditExperienceScreen} />
    <Stack.Screen name="DeleteExperience" component={DeleteExperienceScreen} />
    <Stack.Screen name="Attendees" component={AttendeesScreen} />
    <Stack.Screen name="EditProfile" component={ChefEditProfileScreen} />
    <Stack.Screen name="Chatbot" component={ChatbotScreen} />
  </Stack.Navigator>
);

function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTheme, setCurrentTheme] = useState(userTheme);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        // Get user profile to determine role
        try {
          const { data, error } = await getUserProfile(authUser.uid);
          if (!error && data) {
            setUserProfile(data);
            // Set theme based on role
            setCurrentTheme(data.role === 'chef' ? chefTheme : userTheme);
          } else {
            // If profile doesn't exist, user needs to complete registration
            setUserProfile(null);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setCurrentTheme(userTheme);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <PaperProvider theme={currentTheme}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
          <ActivityIndicator animating={true} size="large" color={currentTheme.colors.primary} />
        </View>
      </PaperProvider>
    );
  }

  const getNavigationStack = () => {
    if (!user || !userProfile) {
      return <CommonStack />;
    }
    
    switch (userProfile.role) {
      case 'chef':
        return <ChefStack />;
      case 'user':
        return <UserStack />;
      default:
        return <CommonStack />;
    }
  };

  return (
    <PaperProvider theme={currentTheme}>
      <NavigationContainer>
        {getNavigationStack()}
      </NavigationContainer>
    </PaperProvider>
  );
}

export default App;