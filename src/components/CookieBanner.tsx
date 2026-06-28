import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Shield, Check, X, Info } from 'lucide-react-native';

const STORAGE_KEY = 'hydrax-cookies-accepted';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    try {
      const consent = localStorage.getItem(STORAGE_KEY);
      if (!consent) {
        setIsVisible(true);
        // Default to denied until user consents
        updateAnalyticsConsent(false);
      } else if (consent === 'accepted') {
        updateAnalyticsConsent(true);
      } else {
        updateAnalyticsConsent(false);
      }
    } catch (e) {
      console.warn('Cookie consent check failed:', e);
    }
  }, []);

  const updateAnalyticsConsent = (granted: boolean) => {
    if (typeof window === 'undefined') return;
    try {
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: granted ? 'granted' : 'denied'
        });
        console.log(`Google Analytics consent updated: ${granted ? 'granted' : 'denied'}`);
      }
    } catch (e) {
      console.warn('gtag consent update failed:', e);
    }
  };

  const handleAction = (status: 'accepted' | 'essential' | 'declined') => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, status);
      updateAnalyticsConsent(status === 'accepted');
      setIsVisible(false);
    } catch (e) {
      console.error('Failed to store cookie choice:', e);
      setIsVisible(false);
    }
  };

  const openPrivacyModal = () => {
    // Send standard event to open settings and privacy policy modal
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hydrax-open-privacy-modal'));
    }
  };

  if (!isVisible || Platform.OS !== 'web') return null;

  const isCompact = width < 600;

  return (
    <View style={[styles.outerContainer, isCompact ? styles.outerCompact : styles.outerDesktop]}>
      <View style={styles.bannerCard}>
        <View style={styles.header}>
          <Shield size={18} color="#00E5C3" style={{ marginRight: 8 }} />
          <Text style={styles.title}>Cookie Consent & Privacy Protocols</Text>
        </View>

        <Text style={styles.desc}>
          HydraX requests telemetry consent to activate Google Analytics for user session patterns, bioimpedance models calibration, and crash optimization reports. Refer to our{' '}
          <Text style={styles.linkText} onPress={openPrivacyModal}>
            Privacy Policy
          </Text>{' '}
          for medical disclaimers.
        </Text>

        <View style={[styles.btnRow, isCompact && styles.btnRowCompact]}>
          <TouchableOpacity 
            style={styles.btnAccept} 
            onPress={() => handleAction('accepted')}
            activeOpacity={0.8}
          >
            <Check size={12} color="#050B18" style={{ marginRight: 4 }} />
            <Text style={styles.btnAcceptText}>Accept telemetry</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.btnEssential} 
            onPress={() => handleAction('essential')}
            activeOpacity={0.8}
          >
            <Info size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.btnEssentialText}>Essential only</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.btnDecline} 
            onPress={() => handleAction('declined')}
            activeOpacity={0.8}
          >
            <X size={12} color="#8E9AA6" style={{ marginRight: 4 }} />
            <Text style={styles.btnDeclineText}>Decline all</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    zIndex: 99999, // Floating on top of everything
    alignItems: 'center',
  },
  outerDesktop: {
    alignSelf: 'center',
    maxWidth: 700,
    width: '100%',
  },
  outerCompact: {
    bottom: 90, // Position above the mobile bottom tab bar
    left: 12,
    right: 12,
  },
  bannerCard: {
    width: '100%',
    backgroundColor: 'rgba(7, 13, 30, 0.94)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 195, 0.2)',
    padding: 16,
    shadowColor: '#00E5C3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  desc: {
    fontSize: 10,
    color: '#8E9AA6',
    lineHeight: 14,
    marginBottom: 14,
  },
  linkText: {
    color: '#00E5C3',
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  btnRowCompact: {
    flexDirection: 'column',
    width: '100%',
    gap: 6,
  },
  btnAccept: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00E5C3',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: 130,
  },
  btnAcceptText: {
    color: '#050B18',
    fontSize: 10,
    fontWeight: '800',
  },
  btnEssential: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    minWidth: 120,
  },
  btnEssentialText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  btnDecline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(142, 154, 166, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(142, 154, 166, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  btnDeclineText: {
    color: '#8E9AA6',
    fontSize: 10,
    fontWeight: '700',
  },
});
