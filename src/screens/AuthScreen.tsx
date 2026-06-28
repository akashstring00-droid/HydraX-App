import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Sparkles, LogIn, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { GlassCard } from '../components/GlassCard';

export const AuthScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const darkMode = useSettingsStore((state) => state.darkMode);
  const showToast = useToastStore((state) => state.showToast);

  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { login, signup, googleLogin, resetPassword, isLoading, error, clearError } = useAuthStore();

  const handleAuthAction = async () => {
    // Basic validations
    if (!email.trim()) {
      showToast('Please enter your email address.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    if (activeTab === 'reset') {
      showToast('Sending password reset email...', 'info');
      try {
        await resetPassword(email.trim());
        showToast('Password reset email sent! Check your inbox.', 'success');
        setActiveTab('login');
      } catch (err: any) {
        showToast(err.message || 'Failed to send reset email.', 'error');
      }
      return;
    }

    if (!password.trim()) {
      showToast('Please enter your password.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }

    if (activeTab === 'signup') {
      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
      }
      showToast('Creating premium health OS profile...', 'info');
      await signup(email.trim(), password);
    } else {
      showToast('Synchronizing credentials...', 'info');
      await login(email.trim(), password);
    }
  };

  const handleGoogleLogin = async () => {
    showToast('Redirecting to Google secure OAuth...', 'info');
    await googleLogin();
  };

  const textPrimary = darkMode ? '#FFFFFF' : '#0F172A';
  const textSecondary = darkMode ? '#8E9AA6' : '#64748B';
  const borderCol = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';
  const inputBg = darkMode ? 'rgba(255,255,255,0.02)' : '#FFFFFF';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#050B18' : '#F8FAFC' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Upper Brand / Logo header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Sparkles size={24} color="#00E5C3" />
          </View>
          <Text style={[styles.brandTitle, { color: textPrimary }]}>HYDRAX</Text>
          <Text style={styles.brandSubtitle}>INTELLIGENT HEALTH OPERATING SYSTEM</Text>
        </View>

        {/* Central Auth Glass Card */}
        <GlassCard style={[styles.authCard, { width: isDesktop ? 440 : '100%', borderColor: borderCol }]} borderColor={borderCol}>
          
          {/* Tabs switch */}
          {activeTab !== 'reset' ? (
            <View style={styles.tabRow}>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'login' && styles.tabBtnActive]}
                onPress={() => { setActiveTab('login'); clearError(); }}
              >
                <Text style={[styles.tabBtnText, { color: activeTab === 'login' ? '#050B18' : textSecondary }]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'signup' && styles.tabBtnActive]}
                onPress={() => { setActiveTab('signup'); clearError(); }}
              >
                <Text style={[styles.tabBtnText, { color: activeTab === 'signup' ? '#050B18' : textSecondary }]}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ marginBottom: 16, alignItems: 'center' }}>
              <Text style={{ color: textPrimary, fontSize: 14, fontWeight: '900' }}>Reset Password</Text>
              <Text style={{ color: textSecondary, fontSize: 10, textAlign: 'center', marginTop: 4 }}>
                Enter your email address and we will dispatch a recovery credentials link.
              </Text>
            </View>
          )}

          {/* Form input fields */}
          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
                <Mail size={16} color={textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.textInput, { color: textPrimary }]}
                  placeholder="e.g. athlete.john@gmail.com"
                  placeholderTextColor={textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Field (Only for login and signup) */}
            {activeTab !== 'reset' && (
              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.inputLabel}>Password</Text>
                  {activeTab === 'login' && (
                    <TouchableOpacity onPress={() => { setActiveTab('reset'); clearError(); }}>
                      <Text style={{ color: '#00E5C3', fontSize: 10, fontWeight: '800' }}>Forgot?</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
                  <Lock size={16} color={textSecondary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.textInput, { color: textPrimary }]}
                    placeholder="••••••••"
                    placeholderTextColor={textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            {/* Confirm Password Field (Only for Signup) */}
            {activeTab === 'signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
                  <Lock size={16} color={textSecondary} style={{ marginRight: 10 }} />
                  <TextInput
                    style={[styles.textInput, { color: textPrimary }]}
                    placeholder="••••••••"
                    placeholderTextColor={textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: isLoading ? 'rgba(0, 229, 195, 0.4)' : '#00E5C3' }]}
              onPress={handleAuthAction}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#050B18" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    {activeTab === 'login' ? 'Access Dashboard' : activeTab === 'signup' ? 'Create Profile' : 'Send Recovery Link'}
                  </Text>
                  <ArrowRight size={16} color="#050B18" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            {activeTab === 'reset' && (
              <TouchableOpacity 
                style={{ alignSelf: 'center', marginTop: 4 }} 
                onPress={() => { setActiveTab('login'); clearError(); }}
              >
                <Text style={{ color: '#00E5C3', fontSize: 11, fontWeight: '800' }}>Return to Login</Text>
              </TouchableOpacity>
            )}

            {activeTab !== 'reset' && (
              <>
                <View style={styles.orDividerRow}>
                  <View style={[styles.dividerLine, { backgroundColor: borderCol }]} />
                  <Text style={styles.orText}>OR</Text>
                  <View style={[styles.dividerLine, { backgroundColor: borderCol }]} />
                </View>

                {/* Google OAuth Button */}
                <TouchableOpacity
                  style={[styles.googleBtn, { borderColor: borderCol, backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#FFFFFF' }]}
                  onPress={handleGoogleLogin}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  {/* Google G Logo mockup */}
                  <View style={styles.googleIconBg}>
                    <Text style={styles.googleG}>G</Text>
                  </View>
                  <Text style={[styles.googleBtnText, { color: textPrimary }]}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </GlassCard>

        {/* Security clinical credentials notice */}
        <View style={styles.footerNoteRow}>
          <ShieldCheck size={14} color="#00E5C3" style={{ marginRight: 6 }} />
          <Text style={styles.footerNoteText}>
            HIPAA Compliant. Secure Biometrics Encryption Standard.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 195, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 195, 0.25)',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 3,
  },
  brandSubtitle: {
    color: '#00E5C3',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: 'center',
  },
  authCard: {
    borderRadius: 24,
    padding: 24,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: '#00E5C3',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  formContainer: {
    gap: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 77, 109, 0.08)',
    borderColor: 'rgba(255, 77, 109, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#FF4D6D',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E9AA6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  submitBtn: {
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#00E5C3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#050B18',
    fontSize: 14,
    fontWeight: '900',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    color: '#8E9AA6',
    fontSize: 10,
    fontWeight: '800',
    marginHorizontal: 12,
  },
  googleBtn: {
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EA4335',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  googleG: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  googleBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  footerNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  footerNoteText: {
    color: '#8E9AA6',
    fontSize: 9,
    fontWeight: '600',
  },
});
