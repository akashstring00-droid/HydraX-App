import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { themeStore } from '../theme/ThemeStore';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  maxWidth = 440,
}) => {
  const { width, height } = useWindowDimensions();
  const isDesktop = width > 500;
  const [themeMode, setThemeMode] = useState(themeStore.getMode());

  useEffect(() => {
    return themeStore.subscribe((m) => setThemeMode(m));
  }, []);

  const isDark = themeMode === 'dark';

  return (
    <View style={[styles.outerWrapper, isDark && styles.outerWrapperDark]}>
      <View 
        style={[
          styles.innerContainer, 
          isDark && styles.innerContainerDark,
          isDesktop && { maxWidth, height: Math.min(height - 40, 920), ...styles.desktopFrame, ...(isDark ? styles.desktopFrameDark : {}) }
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F1F5F9', // Subtle warm gray backdrop on desktop
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerWrapperDark: {
    backgroundColor: '#070D1A',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F8FAFC',
  },
  innerContainerDark: {
    backgroundColor: '#070D1A',
  },
  desktopFrame: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    marginVertical: 20,
  },
  desktopFrameDark: {
    borderColor: '#1E293B',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
  },
});

