import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions, TextInput, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Settings, 
  Sun, 
  Moon, 
  Globe, 
  Cpu, 
  Trash2, 
  Plus, 
  Trash,
  UserCheck,
  ShieldAlert,
  ChevronRight,
  Database
} from 'lucide-react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { GlassCard } from '../components/GlassCard';

export const SettingsScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // Settings Store
  const { 
    darkMode, 
    setDarkMode, 
    units, 
    setUnits, 
    language, 
    setLanguage,
    emergencyContacts,
    addEmergencyContact,
    removeEmergencyContact
  } = useSettingsStore();

  const { logout } = useAuthStore();

  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(true);

  const handleAddContact = () => {
    if (newContactName.trim() && newContactPhone.trim()) {
      addEmergencyContact(newContactName.trim(), newContactPhone.trim());
      setNewContactName('');
      setNewContactPhone('');
    }
  };

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      alert("Local Storage and biometric logs cleared successfully. Reloading...");
      window.location.reload();
    }
  };

  const textPrimary = darkMode ? '#FFFFFF' : '#0F172A';
  const textSecondary = darkMode ? '#8E9AA6' : '#64748B';
  const inputBg = darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
  const borderCol = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#050B18' : '#F8FAFC' }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Title */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textPrimary }]}>System Settings</Text>
          <Text style={styles.subtitle}>Calibrate wearable protocols and user preferences</Text>
        </View>

        <View style={isDesktop ? styles.desktopGrid : styles.mobileGrid}>
          
          {/* COLUMN 1: Profile & Preferences */}
          <View style={styles.leftCol}>
            {/* General Preferences */}
            <GlassCard style={styles.card} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Display & System Settings</Text>
              
              {/* Theme Toggle */}
              <View style={styles.settingRow}>
                <View style={styles.rowLeft}>
                  {darkMode ? <Moon size={16} color="#00E5C3" /> : <Sun size={16} color="#FFAD33" />}
                  <Text style={[styles.settingLabel, { color: textPrimary }]}>Dark UI Theme</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{ false: '#767577', true: '#00E5C3' }}
                  thumbColor={darkMode ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>

              {/* Units Selection */}
              <View style={styles.settingRow}>
                <View style={styles.rowLeft}>
                  <Database size={16} color="#14B8FF" />
                  <Text style={[styles.settingLabel, { color: textPrimary }]}>Measurement Units</Text>
                </View>
                <View style={styles.toggleBtnGroup}>
                  {['metric', 'imperial'].map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      onPress={() => setUnits(unit as any)}
                      style={[
                        styles.toggleBtn,
                        {
                          backgroundColor: units === unit ? '#14B8FF' : 'rgba(255,255,255,0.02)',
                          borderColor: borderCol
                        }
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.toggleBtnText, { color: units === unit ? '#050B18' : textPrimary }]}>
                        {unit.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Language Selection */}
              <View style={[styles.settingRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <View style={styles.rowLeft}>
                  <Globe size={16} color="#7C3AED" />
                  <Text style={[styles.settingLabel, { color: textPrimary }]}>Display Language</Text>
                </View>
                <View style={styles.toggleBtnGroup}>
                  {[
                    { id: 'en', label: 'EN' },
                    { id: 'es', label: 'ES' },
                    { id: 'ja', label: 'JA' }
                  ].map((lang) => (
                    <TouchableOpacity
                      key={lang.id}
                      onPress={() => setLanguage(lang.id as any)}
                      style={[
                        styles.toggleBtn,
                        {
                          backgroundColor: language === lang.id ? '#7C3AED' : 'rgba(255,255,255,0.02)',
                          borderColor: borderCol
                        }
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.toggleBtnText, { color: language === lang.id ? '#FFFFFF' : textPrimary }]}>
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </GlassCard>

            {/* Wearable Connectivity & Sync */}
            <GlassCard style={styles.card} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Wearable Telemetry Protocols</Text>
              
              <View style={styles.settingRow}>
                <View style={styles.rowLeft}>
                  <Cpu size={16} color="#00E5C3" />
                  <Text style={[styles.settingLabel, { color: textPrimary }]}>Background Auto-Sync</Text>
                </View>
                <Switch
                  value={syncEnabled}
                  onValueChange={setSyncEnabled}
                  trackColor={{ false: '#767577', true: '#00E5C3' }}
                  thumbColor={syncEnabled ? '#FFFFFF' : '#f4f3f4'}
                />
              </View>

              <View style={[styles.infoBox, { backgroundColor: darkMode ? 'rgba(0, 229, 195, 0.05)' : '#F1F5F9' }]}>
                <Text style={[styles.infoText, { color: textSecondary }]}>
                  Smart band pushes biosensor data (HR, HRV, sweat bioimpedance) to local client stores every 30 seconds.
                </Text>
              </View>
            </GlassCard>

            {/* Danger Zone */}
            <GlassCard style={[styles.card, { borderColor: 'rgba(255, 77, 109, 0.25)' }]} borderColor="rgba(255, 77, 109, 0.2)">
              <Text style={[styles.sectionLabel, { color: '#FF4D6D' }]}>Danger Zone</Text>
              
              <View style={[styles.settingRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <View style={styles.rowLeft}>
                  <Trash2 size={16} color="#FF4D6D" />
                  <View>
                    <Text style={[styles.settingLabel, { color: textPrimary }]}>Reset Application Data</Text>
                    <Text style={styles.subtext}>Irreversibly delete profile dossier & logged history</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleClearCache}
                  style={styles.dangerBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dangerBtnText}>Wipe Cache</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>

          {/* COLUMN 2: Emergency contacts */}
          <View style={styles.rightCol}>
            <GlassCard style={styles.card} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Emergency Clinical Contacts</Text>
              
              {/* List Contacts */}
              <View style={styles.contactsList}>
                {emergencyContacts.length === 0 ? (
                  <Text style={[styles.emptyText, { color: textSecondary }]}>No emergency contacts registered</Text>
                ) : (
                  emergencyContacts.map((c) => (
                    <View key={c.id} style={[styles.contactRow, { borderColor: borderCol, backgroundColor: inputBg }]}>
                      <View>
                        <Text style={[styles.contactName, { color: textPrimary }]}>{c.name}</Text>
                        <Text style={styles.contactPhone}>{c.phone}</Text>
                      </View>
                      <TouchableOpacity 
                        onPress={() => removeEmergencyContact(c.id)}
                        style={styles.removeBtn}
                      >
                        <Trash size={14} color="#FF4D6D" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              {/* Add contact form */}
              <View style={[styles.addForm, { borderTopColor: borderCol }]}>
                <Text style={styles.formTitle}>REGISTER CLINICAL EMERGENCY CONTACT</Text>
                <View style={styles.formRow}>
                  <TextInput
                    value={newContactName}
                    onChangeText={setNewContactName}
                    placeholder="Contact Name..."
                    placeholderTextColor={textSecondary}
                    style={[styles.formInput, { color: textPrimary, backgroundColor: inputBg, borderColor: borderCol }]}
                  />
                  <TextInput
                    value={newContactPhone}
                    onChangeText={setNewContactPhone}
                    placeholder="Phone number..."
                    placeholderTextColor={textSecondary}
                    style={[styles.formInput, { color: textPrimary, backgroundColor: inputBg, borderColor: borderCol, marginLeft: 8 }]}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleAddContact}
                  style={styles.addBtn}
                  activeOpacity={0.7}
                >
                  <Plus size={14} color="#050B18" style={{ marginRight: 6 }} />
                  <Text style={styles.addBtnText}>Add Contact</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    color: '#8E9AA6',
    fontSize: 12,
    marginTop: 2,
  },
  desktopGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mobileGrid: {
    flexDirection: 'column',
  },
  leftCol: {
    flex: 1,
    marginRight: Platform.OS === 'web' ? 24 : 0,
  },
  rightCol: {
    flex: 1,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
  },
  sectionLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 12,
  },
  subtext: {
    fontSize: 8,
    color: '#8E9AA6',
    fontWeight: '500',
    marginTop: 2,
    marginLeft: 12,
  },
  toggleBtnGroup: {
    flexDirection: 'row',
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 6,
  },
  toggleBtnText: {
    fontSize: 9,
    fontWeight: '800',
  },
  infoBox: {
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
  },
  infoText: {
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 14,
  },
  dangerBtn: {
    backgroundColor: 'rgba(255, 77, 109, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dangerBtnText: {
    color: '#FF4D6D',
    fontSize: 9,
    fontWeight: '800',
  },
  contactsList: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 20,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    marginBottom: 8,
  },
  contactName: {
    fontSize: 11,
    fontWeight: '700',
  },
  contactPhone: {
    color: '#8E9AA6',
    fontSize: 9,
    marginTop: 2,
  },
  removeBtn: {
    padding: 6,
  },
  addForm: {
    borderTopWidth: 1,
    paddingTop: 16,
  },
  formTitle: {
    color: '#00E5C3',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  formInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 11,
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: '#00E5C3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#050B18',
    fontSize: 11,
    fontWeight: '800',
  },
});
