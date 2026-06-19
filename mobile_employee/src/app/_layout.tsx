import { DarkTheme, DefaultTheme, ThemeProvider, Stack, router } from 'expo-router';
import { useColorScheme, View, Text, TouchableOpacity, AppState } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { Shield, LogOut } from 'lucide-react-native';
import '../global.css';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const appState = useRef(AppState.currentState);
  
  useEffect(() => {
    // 1. Trigger on fresh app launches
    checkBiometrics();

    // 2. Trigger every single time the app is opened from the background
    /*
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        checkBiometrics();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
    */
  }, []);

  const checkBiometrics = async () => {
    try {
      const bioState = await SecureStore.getItemAsync('biometricsEnabled');
      if (bioState === 'true') {
        setIsLocked(true);
        // Add a tiny delay to ensure the UI renders the lock screen before native prompt blocks thread
        setTimeout(() => handleAuthenticate(), 300);
      }
    } catch (e) {
      console.log('Error checking biometrics', e);
    }
  };

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to unlock VehicleeCare',
        cancelLabel: 'Cancel',
      });
      if (result.success) {
        setIsLocked(false);
      }
    } catch (error) {
      console.log('Authentication error', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEmergencyLogout = async () => {
    await SecureStore.deleteItemAsync('employeeToken');
    await SecureStore.deleteItemAsync('employeeUser');
    await SecureStore.deleteItemAsync('biometricsEnabled');
    setIsLocked(false);
    router.replace('/auth/login');
  };
  
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      {isLocked && (
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#f8fafc', zIndex: 99999, elevation: 99999, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#052558', borderWidth: 4, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
            <Shield size={34} color="#ffffff" strokeWidth={2.5} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#011023', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>App Locked</Text>
          <Text style={{ fontSize: 13.5, color: '#64748b', textAlign: 'center', marginBottom: 40, paddingHorizontal: 20, lineHeight: 22, fontWeight: '500' }}>Please authenticate using your device's biometrics to access your employee portal securely.</Text>
          
          <TouchableOpacity 
            onPress={handleAuthenticate}
            disabled={isAuthenticating}
            style={{ backgroundColor: '#011023', width: '100%', paddingVertical: 16, borderRadius: 18, alignItems: 'center', marginBottom: 15, opacity: isAuthenticating ? 0.7 : 1 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>{isAuthenticating ? 'Authenticating...' : 'Unlock with Biometrics'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleEmergencyLogout}
            style={{ width: '100%', paddingVertical: 16, borderRadius: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
          >
            <LogOut size={16} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={{ color: '#ef4444', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>Logout & Disconnect</Text>
          </TouchableOpacity>
        </View>
      )}
    </ThemeProvider>
  );
} 