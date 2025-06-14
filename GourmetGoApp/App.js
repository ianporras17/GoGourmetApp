import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LandingScreen from './screens/LandingScreen';
import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import ChefDashboard from './screens/chef/DashboardScreen';
import DeleteExperienceScreen from './screens/chef/DeleteExperienceScreen'; 
import CreateExperienceScreen from './screens/chef/CreateExperienceScreen';
import EditExperienceScreen   from './screens/chef/EditExperienceScreen';
import AttendeesScreen        from './screens/chef/AttendeesScreen'; 
import EditProfileScreen        from './screens/chef/EditProfileScreen'; 
import ExploreScreen from './screens/user/ExploreScreen';
import ExperienceDetailScreen from './screens/user/ExperienceDetailScreen';
import UserReservationsScreen   from './screens/user/UserReservationsScreen';
import RateExperienceScreen     from './screens/user/RateExperienceScreen'; 
import BookingScreen            from './screens/user/BookingScreen';
import UserEditProfileScreen    from './screens/user/EditProfileScreen'; 
import ChatbotScreen from './screens/common/ChatbotScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Landing"  component={LandingScreen} />
        <Stack.Screen name="Login"    component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ChefDashboard" component={ChefDashboard} />
        <Stack.Screen name="CreateExperience" component={CreateExperienceScreen} />
        <Stack.Screen name="DeleteExperience"  component={DeleteExperienceScreen}/>
        <Stack.Screen name="EditExperience"    component={EditExperienceScreen}   />
        <Stack.Screen name="Attendees"         component={AttendeesScreen}/> 
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Explore" component={ExploreScreen} />
        <Stack.Screen name="ExperienceDetail" component={ExperienceDetailScreen} />
        <Stack.Screen name="Reservations"      component={UserReservationsScreen} />
        <Stack.Screen name="RateExperience"    component={RateExperienceScreen} />
        <Stack.Screen name="Booking"           component={BookingScreen} />
        <Stack.Screen name="UserEditProfile"   component={UserEditProfileScreen} /> 
        <Stack.Screen name="Chatbot" component={ChatbotScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
