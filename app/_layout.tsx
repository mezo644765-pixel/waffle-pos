import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { NetworkProvider } from '@/context/NetworkContext';
import { PricesProvider } from '@/context/PricesContext';
import { OrdersProvider } from '@/context/OrdersContext';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <AuthProvider>
      <NetworkProvider>
        <PricesProvider>
          <OrdersProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(user)" />
              <Stack.Screen name="(admin)" />
            </Stack>
          </OrdersProvider>
        </PricesProvider>
      </NetworkProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardProvider>
          <RootLayoutNav />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
