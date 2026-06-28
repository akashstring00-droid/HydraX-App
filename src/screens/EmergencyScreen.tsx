import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, useWindowDimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ShieldAlert, 
  Phone, 
  Send, 
  FileHeart, 
  Plus, 
  Trash2, 
  AlertTriangle,
  X,
  Check,
  User,
  Heart,
  Droplet,
  Cpu
} from 'lucide-react-native';

import { useSettingsStore } from '../store/useSettingsStore';
import { useWaterStore } from '../store/useWaterStore';
import { useVitalsStore } from '../store/useVitalsStore';
import { useBLEStore } from '../store/useBLEStore';
import { useToastStore } from '../store/useToastStore';
import { GlassCard } from '../components/GlassCard';

export const EmergencyScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const darkMode = useSettingsStore((state) => state.darkMode);
  const showToast = useToastStore((state) => state.showToast);

  // Bind settings store emergency contacts
  const { emergencyContacts, addEmergencyContact, removeEmergencyContact } = useSettingsStore();

  // Metrics to compile quick health summary
  const currentIntake = useWaterStore((state) => state.currentIntake);
  const dailyWaterTarget = useWaterStore((state) => state.dailyWaterTarget);
  const currentVitals = useVitalsStore((state) => state.currentVitals);
  const vitalsPrediction = useVitalsStore((state) => state.prediction);
  const { connectedDevice } = useBLEStore();

  // Local state for medical details (auto-saved)
  const [bloodType, setBloodType] = useState('O Positive (O+)');
  const [medicalNotes, setMedicalNotes] = useState('Gastrointestinal sensitivities. Penicillin allergy.');
  const [allergies, setAllergies] = useState('Peanuts, Penicillin');
  const [medications, setMedications] = useState('None');

  // Contact inputs
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [showAddContactForm, setShowAddContactForm] = useState(false);

  // SOS Countdown states
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Load medical notes from LocalStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedBlood = window.localStorage.getItem('hydrax-blood-type');
        const savedNotes = window.localStorage.getItem('hydrax-medical-notes');
        const savedAllergies = window.localStorage.getItem('hydrax-allergies');
        const savedMeds = window.localStorage.getItem('hydrax-medications');
        if (savedBlood) setBloodType(savedBlood);
        if (savedNotes) setMedicalNotes(savedNotes);
        if (savedAllergies) setAllergies(savedAllergies);
        if (savedMeds) setMedications(savedMeds);
      } catch (e) {
        console.error('Failed to load emergency data', e);
      }
    }
  }, []);

  // Save changes helper
  const saveField = (key: string, val: string) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, val);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // SOS pulsation animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const triggerSOS = () => {
    if (sosCountdown !== null) return;
    
    setSosCountdown(5);
    showToast('SOS Beacon triggered! Starting 5-second abort countdown.', 'warning');
    
    countdownIntervalRef.current = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          sendSOSAlert();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelSOS = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setSosCountdown(null);
    showToast('SOS Beacon aborted successfully.', 'info');
  };

  const sendSOSAlert = () => {
    showToast('SOS Transmission Complete! Sent emergency GPS coordinates & bio-metric report.', 'success');
  };

  const handleAddContact = () => {
    if (newContactName.trim() && newContactPhone.trim()) {
      addEmergencyContact(newContactName.trim(), newContactPhone.trim());
      setNewContactName('');
      setNewContactPhone('');
      setShowAddContactForm(false);
      showToast('Emergency contact added.', 'success');
    } else {
      showToast('Please enter both name and phone number.', 'error');
    }
  };

  const handleCallEmergency = (phone: string = '911') => {
    showToast(`Mock Dialing: ${phone}...`, 'success');
  };

  const handleShareSnapshot = () => {
    showToast('Snapshot generated & share link copied!', 'success');
  };

  const textPrimary = darkMode ? '#FFFFFF' : '#0F172A';
  const textSecondary = darkMode ? '#8E9AA6' : '#64748B';
  const borderCol = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#050B18' : '#F8FAFC' }]} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: textPrimary }]}>Emergency Center</Text>
        <Text style={[styles.subtitle, { color: textSecondary }]}>Rapid medical response tools and bio-metric clinical sharing profiles</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.layoutGrid}>
          {/* Left / Top side: SOS Trigger Center */}
          <View style={[styles.leftColumn, { flex: isDesktop ? 3 : 1 }]}>
            {/* Pulsating SOS Trigger Button */}
            <GlassCard style={styles.sosCard} borderColor={borderCol}>
              <View style={styles.sosContainer}>
                {sosCountdown === null ? (
                  <TouchableOpacity 
                    style={styles.sosTouch}
                    onPress={triggerSOS}
                    activeOpacity={0.8}
                  >
                    <Animated.View style={[styles.sosOuterRing, { transform: [{ scale: pulseAnim }] }]} />
                    <View style={styles.sosInnerButton}>
                      <ShieldAlert size={48} color="#FFFFFF" />
                      <Text style={styles.sosLabel}>SOS</Text>
                      <Text style={styles.sosSubText}>HOLD FOR 5s ALERT</Text>
                    </View>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.countdownContainer}>
                    <Text style={styles.countdownNumber}>{sosCountdown}</Text>
                    <Text style={styles.countdownLabel}>TRANSMITTING BEACON...</Text>
                    <TouchableOpacity 
                      style={styles.cancelSosBtn}
                      onPress={cancelSOS}
                      activeOpacity={0.7}
                    >
                      <X size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.cancelSosText}>ABORT NOW</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.emergencyActionsRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: '#FF4D6D' }]}
                  onPress={() => handleCallEmergency('911')}
                >
                  <Phone size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.actionBtnText}>DIAL 911</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: 'rgba(0, 229, 195, 0.1)', borderColor: '#00E5C3', borderWidth: 1 }]}
                  onPress={handleShareSnapshot}
                >
                  <Send size={16} color="#00E5C3" style={{ marginRight: 8 }} />
                  <Text style={[styles.actionBtnText, { color: '#00E5C3' }]}>SHARE SNAPSHOT</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

            {/* Quick Health Summary Dossier */}
            <GlassCard style={styles.summaryCard} borderColor={borderCol}>
              <View style={styles.summaryTitleRow}>
                <FileHeart size={18} color="#00E5C3" style={{ marginRight: 8 }} />
                <Text style={[styles.summaryTitle, { color: textPrimary }]}>Quick Health Summary Dossier</Text>
              </View>

              <View style={styles.metricsGrid}>
                {/* Metric 1 */}
                <View style={[styles.metricBox, { backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderColor: borderCol }]}>
                  <Heart size={16} color="#FF4D6D" style={{ marginBottom: 4 }} />
                  <Text style={styles.metricLabel}>Heart Rate</Text>
                  <Text style={[styles.metricValue, { color: textPrimary }]}>{currentVitals.heartRate} bpm</Text>
                </View>

                {/* Metric 2 */}
                <View style={[styles.metricBox, { backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderColor: borderCol }]}>
                  <ShieldAlert size={16} color="#FFAD33" style={{ marginBottom: 4 }} />
                  <Text style={styles.metricLabel}>HRV Baseline</Text>
                  <Text style={[styles.metricValue, { color: textPrimary }]}>{currentVitals.hrv} ms</Text>
                </View>

                {/* Metric 3 */}
                <View style={[styles.metricBox, { backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderColor: borderCol }]}>
                  <Droplet size={16} color="#00E5C3" style={{ marginBottom: 4 }} />
                  <Text style={styles.metricLabel}>Hydration Index</Text>
                  <Text style={[styles.metricValue, { color: textPrimary }]}>
                    {Math.round((currentIntake / (dailyWaterTarget || 2500)) * 100)}% ({currentIntake}ml)
                  </Text>
                </View>

                {/* Metric 4 */}
                <View style={[styles.metricBox, { backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#F8FAFC', borderColor: borderCol }]}>
                  <Cpu size={16} color="#14B8FF" style={{ marginBottom: 4 }} />
                  <Text style={styles.metricLabel}>Wearable Sync</Text>
                  <Text style={[styles.metricValue, { color: textPrimary }]} numberOfLines={1}>
                    {connectedDevice ? connectedDevice.name : 'Offline'}
                  </Text>
                </View>
              </View>

              {/* Medical Information Fields */}
              <View style={styles.dossierForm}>
                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Blood Type</Text>
                  <TextInput
                    style={[styles.formInput, { color: textPrimary, borderColor: borderCol }]}
                    value={bloodType}
                    onChangeText={(v) => { setBloodType(v); saveField('hydrax-blood-type', v); }}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Allergies</Text>
                  <TextInput
                    style={[styles.formInput, { color: textPrimary, borderColor: borderCol }]}
                    value={allergies}
                    onChangeText={(v) => { setAllergies(v); saveField('hydrax-allergies', v); }}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Active Medications</Text>
                  <TextInput
                    style={[styles.formInput, { color: textPrimary, borderColor: borderCol }]}
                    value={medications}
                    onChangeText={(v) => { setMedications(v); saveField('hydrax-medications', v); }}
                  />
                </View>

                <View style={styles.formRow}>
                  <Text style={styles.formLabel}>Critical Medical Notes</Text>
                  <TextInput
                    style={[styles.formInput, { color: textPrimary, borderColor: borderCol, height: 60 }]}
                    multiline
                    value={medicalNotes}
                    onChangeText={(v) => { setMedicalNotes(v); saveField('hydrax-medical-notes', v); }}
                  />
                </View>
              </View>
            </GlassCard>
          </View>

          {/* Right / Bottom side: Clinical contacts list */}
          <View style={[styles.rightColumn, { flex: isDesktop ? 2 : 1 }]}>
            <GlassCard style={styles.contactsCard} borderColor={borderCol}>
              <View style={styles.contactsHeader}>
                <User size={18} color="#00E5C3" style={{ marginRight: 8 }} />
                <Text style={[styles.contactsTitle, { color: textPrimary }]}>Emergency Contacts</Text>
              </View>

              <View style={styles.contactsList}>
                {emergencyContacts.map((c) => (
                  <View key={c.id} style={[styles.contactItem, { borderColor: borderCol }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.contactName, { color: textPrimary }]}>{c.name}</Text>
                      <Text style={styles.contactPhone}>{c.phone}</Text>
                    </View>
                    
                    <View style={styles.contactActions}>
                      <TouchableOpacity 
                        style={[styles.contactIconBtn, { backgroundColor: 'rgba(0, 229, 195, 0.1)' }]}
                        onPress={() => handleCallEmergency(c.phone)}
                        activeOpacity={0.7}
                      >
                        <Phone size={14} color="#00E5C3" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.contactIconBtn, { backgroundColor: 'rgba(255, 77, 109, 0.1)' }]}
                        onPress={() => removeEmergencyContact(c.id)}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={14} color="#FF4D6D" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Add emergency contact form */}
              {showAddContactForm ? (
                <View style={[styles.addForm, { borderColor: borderCol, backgroundColor: darkMode ? 'rgba(0,0,0,0.1)' : '#F8FAFC' }]}>
                  <Text style={[styles.addFormTitle, { color: textPrimary }]}>Add Clinical Contact</Text>
                  
                  <TextInput
                    style={[styles.addFormInput, { color: textPrimary, borderColor: borderCol }]}
                    placeholder="Contact Name (e.g. Dr. Roberts)"
                    placeholderTextColor={textSecondary}
                    value={newContactName}
                    onChangeText={setNewContactName}
                  />

                  <TextInput
                    style={[styles.addFormInput, { color: textPrimary, borderColor: borderCol }]}
                    placeholder="Phone number"
                    placeholderTextColor={textSecondary}
                    value={newContactPhone}
                    onChangeText={setNewContactPhone}
                  />

                  <View style={styles.addFormActions}>
                    <TouchableOpacity 
                      style={[styles.addFormBtn, { backgroundColor: '#00E5C3' }]}
                      onPress={handleAddContact}
                    >
                      <Text style={styles.addFormBtnText}>Add</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.addFormBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: borderCol }]}
                      onPress={() => setShowAddContactForm(false)}
                    >
                      <Text style={[styles.addFormBtnText, { color: textSecondary }]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.addContactTrigger, { borderColor: borderCol, backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : '#FFFFFF' }]}
                  onPress={() => setShowAddContactForm(true)}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#00E5C3" style={{ marginRight: 8 }} />
                  <Text style={[styles.addContactTriggerText, { color: textPrimary }]}>Add New Contact</Text>
                </TouchableOpacity>
              )}
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  layoutGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 20,
  },
  leftColumn: {
    gap: 20,
  },
  rightColumn: {
    gap: 20,
  },
  sosCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  sosContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  sosTouch: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosOuterRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 77, 109, 0.25)',
  },
  sosInnerButton: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#FF4D6D',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4D6D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  sosLabel: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  sosSubText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  countdownContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FF4D6D',
  },
  countdownLabel: {
    color: '#FFAD33',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 16,
  },
  cancelSosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cancelSosText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emergencyActionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  summaryCard: {
    padding: 20,
    borderRadius: 24,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricBox: {
    flex: 1,
    minWidth: 120,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  metricLabel: {
    fontSize: 9,
    color: '#8E9AA6',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
  },
  dossierForm: {
    gap: 12,
  },
  formRow: {
    gap: 4,
  },
  formLabel: {
    fontSize: 10,
    color: '#8E9AA6',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
    fontSize: 12,
    fontWeight: '600',
  },
  contactsCard: {
    padding: 20,
    borderRadius: 24,
  },
  contactsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactsTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  contactsList: {
    gap: 12,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  contactName: {
    fontSize: 13,
    fontWeight: '800',
  },
  contactPhone: {
    fontSize: 11,
    color: '#8E9AA6',
    fontWeight: '500',
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
  },
  contactIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addContactTrigger: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addContactTriggerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addForm: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  addFormTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  addFormInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
    fontSize: 12,
    fontWeight: '600',
  },
  addFormActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  addFormBtn: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFormBtnText: {
    color: '#050B18',
    fontSize: 11,
    fontWeight: '800',
  },
});
