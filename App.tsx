import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SensorStreamSim } from './src/components/SensorStreamSim';
import { useBLEStore } from './src/store/useBLEStore';
import { useSettingsStore } from './src/store/useSettingsStore';
import { useWaterStore } from './src/store/useWaterStore';
import { useVitalsStore } from './src/store/useVitalsStore';
import { useDiarrheaStore } from './src/store/useDiarrheaStore';
import { useAuthStore } from './src/store/useAuthStore';
import { scheduleReminders } from './src/lib/notifications';

// Launch Upgrades
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { CookieBanner } from './src/components/CookieBanner';
import { errorTracker } from './src/lib/errorTracker';

export default function App() {
  const toggleDemoMode = useBLEStore((state) => state.toggleDemoMode);
  const darkMode = useSettingsStore((state) => state.darkMode);

  useEffect(() => {
    // Initialize global error tracking logs on web
    errorTracker.initGlobalInterceptors();

    // Load water, vitals, and journal logs if already authenticated
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      useWaterStore.getState().loadWaterLogs();
      useVitalsStore.getState().loadVitalsHistory();
      useDiarrheaStore.getState().loadJournalLogs();
    }

    // Automatically turn on Demo Mode upon boot so the dashboard comes pre-populated and starts streaming immediately
    const timer = setTimeout(() => {
      toggleDemoMode();
    }, 100);

    // Initialize notification scheduler
    const { remindersEnabled, reminderInterval } = useWaterStore.getState();
    scheduleReminders(remindersEnabled, reminderInterval);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        {/* Background sensor simulation runner */}
        <SensorStreamSim />
        
        {/* Custom responsive sidebar/bottombar navigator shell */}
        <AppNavigator />
        
        {/* Web Cookie Consent Banner */}
        <CookieBanner />
        
        <StatusBar style={darkMode ? "light" : "dark"} backgroundColor={darkMode ? "#050B18" : "#F8FAFC"} />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

