import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Shield, Mail, Lock, User, Eye, EyeOff, Key, LogIn, UserPlus, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { authStore } from '../auth/AuthStore';
import { themeStore } from '../theme/ThemeStore';

export const AuthScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [themeMode, setThemeMode] = useState(themeStore.getMode());

  useEffect(() => {
    return themeStore.subscribe((m) => setThemeMode(m));
  }, []);

  const isDark = themeMode === 'dark';

  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setRegPassword(pwd);
    setShowPassword(true);
    setSuccessMsg('Auto-generated strong password! Keep note of it.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleLogin = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await authStore.login(loginEmail, loginPassword);
      if (!res.success) {
        setErrorMsg(res.message || 'Login failed.');
      }
    } catch (e) {
      setErrorMsg('An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await authStore.register(regName, regEmail, regPassword);
      if (!res.success) {
        setErrorMsg(res.message || 'Registration failed.');
      }
    } catch (e) {
      setErrorMsg('An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoQuickLogin = async () => {
    setLoginEmail('akash@hydrax.ai');
    setLoginPassword('password123');
    setLoading(true);
    await authStore.login('akash@hydrax.ai', 'password123');
    setLoading(false);
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.flex1}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Logo & Header */}
          <View style={styles.headerBox}>
            <View style={styles.logoBadge}>
              <Shield color="#0D9488" size={28} />
            </View>
            <Text style={[styles.title, isDark && styles.titleDark]}>HydraX Health AI</Text>
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>Personal Physiological Risk & Telemetry Companion</Text>
          </View>

          {/* Login / Register Tab Switcher */}
          <View style={[styles.tabContainer, isDark && styles.tabContainerDark]}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'login' && (isDark ? styles.tabBtnActiveDark : styles.tabBtnActive)]}
              onPress={() => {
                setActiveTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              activeOpacity={0.8}
            >
              <LogIn color={activeTab === 'login' ? (isDark ? '#38BDF8' : '#0D9488') : '#94A3B8'} size={15} />
              <Text style={[styles.tabText, isDark && styles.tabTextDark, activeTab === 'login' && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'register' && (isDark ? styles.tabBtnActiveDark : styles.tabBtnActive)]}
              onPress={() => {
                setActiveTab('register');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              activeOpacity={0.8}
            >
              <UserPlus color={activeTab === 'register' ? (isDark ? '#38BDF8' : '#0D9488') : '#94A3B8'} size={15} />
              <Text style={[styles.tabText, isDark && styles.tabTextDark, activeTab === 'register' && styles.tabTextActive]}>
                New Registration
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Card */}
          <View style={[styles.card, isDark && styles.cardDark]}>
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>⚠ {errorMsg}</Text>
              </View>
            ) : null}

            {successMsg ? (
              <View style={styles.successBanner}>
                <CheckCircle2 color="#059669" size={14} />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {activeTab === 'login' ? (
              /* LOGIN FORM */
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>EMAIL ADDRESS</Text>
                <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
                  <Mail color={isDark ? '#94A3B8' : '#64748B'} size={16} />
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="name@example.com"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    value={loginEmail}
                    onChangeText={setLoginEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>PASSWORD</Text>
                <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
                  <Lock color={isDark ? '#94A3B8' : '#64748B'} size={16} />
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="Enter your password"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff color="#94A3B8" size={16} /> : <Eye color="#94A3B8" size={16} />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <LogIn color="#FFFFFF" size={16} />
                      <Text style={styles.submitBtnText}>Sign In to HydraX</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Quick Demo Button */}
                <TouchableOpacity 
                  style={[styles.demoBtn, isDark && styles.demoBtnDark]} 
                  onPress={handleDemoQuickLogin}
                  activeOpacity={0.7}
                >
                  <Sparkles color="#F59E0B" size={14} />
                  <Text style={[styles.demoBtnText, isDark && styles.demoBtnTextDark]}>
                    Quick Demo Sign In (Akash)
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* REGISTER FORM */
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>FULL NAME</Text>
                <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
                  <User color={isDark ? '#94A3B8' : '#64748B'} size={16} />
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="e.g. Akash Kumar"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    value={regName}
                    onChangeText={setRegName}
                  />
                </View>

                <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>EMAIL ADDRESS</Text>
                <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
                  <Mail color={isDark ? '#94A3B8' : '#64748B'} size={16} />
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="you@example.com"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    value={regEmail}
                    onChangeText={setRegEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.pwdHeaderRow}>
                  <Text style={[styles.inputLabel, isDark && styles.inputLabelDark]}>CREATE PASSWORD</Text>
                  <TouchableOpacity onPress={generateSecurePassword} style={styles.genPwdBtn}>
                    <Key color="#0D9488" size={12} />
                    <Text style={styles.genPwdText}>Auto Generate Password</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputWrapper, isDark && styles.inputWrapperDark]}>
                  <Lock color={isDark ? '#94A3B8' : '#64748B'} size={16} />
                  <TextInput
                    style={[styles.input, isDark && styles.inputDark]}
                    placeholder="At least 6 characters"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    value={regPassword}
                    onChangeText={setRegPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff color="#94A3B8" size={16} /> : <Eye color="#94A3B8" size={16} />}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <UserPlus color="#FFFFFF" size={16} />
                      <Text style={styles.submitBtnText}>Create Account & Sign In</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Text style={[styles.privacyNote, isDark && styles.privacyNoteDark]}>
            🔒 All user account credentials & telemetry logs are processed locally on-device. Zero cloud transmission.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  containerDark: {
    backgroundColor: '#070D1A',
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 148, 136, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.25)',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  titleDark: {
    color: '#F8FAFC',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    textAlign: 'center',
  },
  subtitleDark: {
    color: '#94A3B8',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  tabContainerDark: {
    backgroundColor: '#1E293B',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnActiveDark: {
    backgroundColor: '#0F172A',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextDark: {
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#0F172A',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardDark: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  errorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  successText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  formGroup: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  inputLabelDark: {
    color: '#94A3B8',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
  },
  inputWrapperDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  inputDark: {
    color: '#F8FAFC',
  },
  pwdHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  genPwdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  genPwdText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  demoBtnDark: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  demoBtnTextDark: {
    color: '#F59E0B',
  },
  privacyNote: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 14,
  },
  privacyNoteDark: {
    color: '#64748B',
  },
});
