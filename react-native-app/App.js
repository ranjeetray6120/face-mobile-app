import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import context and screens
import { AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PhotographerDashboardScreen from './src/screens/PhotographerDashboardScreen';
import EventSelectionScreen from './src/screens/EventSelectionScreen';
import PhotoCaptureScreen from './src/screens/PhotoCaptureScreen';
import PhotoUploadScreen from './src/screens/PhotoUploadScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import EventManagementScreen from './src/screens/EventManagementScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import PhotographerManagementScreen from './src/screens/PhotographerManagementScreen';
import CreatePhotographerScreen from './src/screens/CreatePhotographerScreen';
import AssignPhotographerScreen from './src/screens/AssignPhotographerScreen';
import EventQrCodeScreen from './src/screens/EventQrCodeScreen';
import EventPhotosScreen from './src/screens/EventPhotosScreen';
import FaceSearchScreen from './src/screens/FaceSearchScreen';
import { API_BASE_URL } from './src/config/api';

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Photographer Tab Navigator
 */
function PhotographerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Events') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Upload') {
            iconName = focused ? 'cloud-upload' : 'cloud-upload-outline';
          }

          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={PhotographerDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Events"
        component={EventSelectionScreen}
        options={{ title: 'Events' }}
      />
      <Tab.Screen
        name="Upload"
        component={PhotoUploadScreen}
        options={{ title: 'Upload' }}
      />
    </Tab.Navigator>
  );
}

/**
 * Admin Tab Navigator
 */
function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Events') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Photographers') {
            iconName = focused ? 'account-multiple' : 'account-multiple-outline';
          }

          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Events"
        component={EventManagementScreen}
        options={{ title: 'Events' }}
      />
      <Tab.Screen
        name="Photographers"
        component={PhotographerManagementScreen}
        options={{ title: 'Photographers' }}
      />
    </Tab.Navigator>
  );
}

/**
 * Root Navigator
 */
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    bootstrapAsync();
  }, []);

  const bootstrapAsync = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const role = await AsyncStorage.getItem('userRole');

      if (token && role) {
        setIsLoggedIn(true);
        setUserRole(role);
      }
    } catch (e) {
      console.error('Failed to restore token', e);
    } finally {
      setIsLoading(false);
    }
  };

  const authContext = {
    signIn: async (email, password) => {
      try {
        // API call to backend
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        console.log('Login Response Status:', response.status);
        const text = await response.text();
        console.log('Login Response Body:', text);

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse JSON:', e);
          throw new Error('Server returned invalid response');
        }

        if (response.ok) {
          await AsyncStorage.setItem('authToken', data.token);
          await AsyncStorage.setItem('userId', data.userId.toString());
          await AsyncStorage.setItem('userRole', data.role);
          await AsyncStorage.setItem('userName', data.name);

          setIsLoggedIn(true);
          setUserRole(data.role);
        } else {
          throw new Error(data.message || data.error || 'Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    signOut: async () => {
      try {
        // Clear all local storage data
        await AsyncStorage.clear();

        // Clear TanStack Query cache
        queryClient.clear();

        setIsLoggedIn(false);
        setUserRole(null);
      } catch (error) {
        console.error('Sign out error:', error);
      }
    },
  };

  if (isLoading) {
    return null; // Or show a splash screen
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authContext}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {!isLoggedIn ? (
                <>
                  <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{
                      animationEnabled: false,
                    }}
                  />
                  <Stack.Screen
                    name="Register"
                    component={RegisterScreen}
                    options={{
                      animationEnabled: false,
                    }}
                  />
                </>
              ) : userRole === 'PHOTOGRAPHER' ? (
                <>
                  <Stack.Screen
                    name="PhotographerApp"
                    component={PhotographerNavigator}
                    options={{ animationEnabled: false }}
                  />
                  <Stack.Screen
                    name="PhotoCapture"
                    component={PhotoCaptureScreen}
                    options={{
                      title: 'Capture Photos',
                      headerShown: true,
                    }}
                  />
                </>
              ) : userRole === 'ADMIN' ? (
                <>
                  <Stack.Screen
                    name="AdminApp"
                    component={AdminNavigator}
                    options={{ animationEnabled: false }}
                  />
                  <Stack.Screen
                    name="CreateEvent"
                    component={CreateEventScreen}
                    options={{
                      title: 'Create Event',
                      headerShown: true,
                    }}
                  />
                  <Stack.Screen
                    name="EventQrCode"
                    component={EventQrCodeScreen}
                    options={{
                      title: 'Event QR Code',
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="CreatePhotographer"
                    component={CreatePhotographerScreen}
                    options={{
                      title: 'Register Photographer',
                      headerShown: true,
                    }}
                  />
                  <Stack.Screen
                    name="AssignPhotographer"
                    component={AssignPhotographerScreen}
                    options={{
                      title: 'Assign To Event',
                      headerShown: true,
                    }}
                  />
                  <Stack.Screen
                    name="EventPhotos"
                    component={EventPhotosScreen}
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="PhotoCapture"
                    component={PhotoCaptureScreen}
                    options={{
                      title: 'Capture Photos',
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="FaceSearch"
                    component={FaceSearchScreen}
                    options={{
                      headerShown: false,
                    }}
                  />
                </>
              ) : null}
            </Stack.Navigator>
          </NavigationContainer>
        </AuthContext.Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
