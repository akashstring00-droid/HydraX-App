import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SensorStreamSim } from './src/components/SensorStreamSim';
import { useBLEStore } from './src/store/useBLEStore';
import { useSettingsStore } from './src/store/useSettingsStore';

export default function App() {
  const toggleDemoMode = useBLEStore((state) => state.toggleDemoMode);
  const darkMode = useSettingsStore((state) => state.darkMode);

  useEffect(() => {
    // Automatically turn on Demo Mode upon boot so the dashboard comes pre-populated and starts streaming immediately
    const timer = setTimeout(() => {
      toggleDemoMode();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      {/* Background sensor simulation runner */}
      <SensorStreamSim />
      
      {/* Custom responsive sidebar/bottombar navigator shell */}
      <AppNavigator />
      
      <StatusBar style={darkMode ? "light" : "dark"} backgroundColor={darkMode ? "#050B18" : "#F8FAFC"} />
    </SafeAreaProvider>
  );
}
