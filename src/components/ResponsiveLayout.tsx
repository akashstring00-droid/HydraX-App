import React from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';

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

  return (
    <View style={styles.outerWrapper}>
      <View 
        style={[
          styles.innerContainer, 
          isDesktop && { maxWidth, height: Math.min(height - 40, 920), ...styles.desktopFrame }
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
  innerContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F8FAFC',
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
});
