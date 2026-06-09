import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useVitalsStore } from '../store/useVitalsStore';
import { useWaterStore } from '../store/useWaterStore';
import { useDiarrheaStore } from '../store/useDiarrheaStore';
import { GlassCard } from '../components/GlassCard';
import { 
  User, 
  Settings, 
  Phone, 
  Plus, 
  Trash2, 
  Check, 
  Edit3,
  LogOut,
  Mail,
  MapPin,
  Heart,
  Droplet,
  Brain,
  Activity,
  FileText
} from 'lucide-react-native';

export const ProfileScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const { user, updateProfile, logout } = useAuthStore();
  const { units, emergencyContacts, setUnits, addEmergencyContact, removeEmergencyContact } = useSettingsStore();
  const { currentVitals } = useVitalsStore();
  const { currentIntake, dailyWaterTarget } = useWaterStore();
  const { recoveryScore } = useDiarrheaStore();

  const darkMode = useSettingsStore((state) => state.darkMode);
  const styles = getStyles(darkMode);

  // Profile fields state
  const [age, setAge] = useState<string>(user?.age ? String(user.age) : '28');
  const [weight, setWeight] = useState<string>(user?.weight ? String(user.weight) : '74');
  const [gender, setGender] = useState<string>(user?.gender || 'Male');
  const [activityLevel, setActivityLevel] = useState<'low' | 'medium' | 'high'>(user?.activityLevel || 'high');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // New emergency contact fields
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');

  const handleUpdateProfile = async () => {
    const ageNum = parseInt(age, 10);
    const weightNum = parseFloat(weight);

    if (isNaN(ageNum) || isNaN(weightNum)) {
      Alert.alert('Invalid Input', 'Please enter valid values for age and weight.');
      return;
    }

    await updateProfile({
      age: ageNum,
      weight: weightNum,
      gender,
      activityLevel
    });

    setIsEditing(false);
    Alert.alert('Profile Saved', 'Your body metrics have been updated.');
  };

  const handleAddContact = () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Required Fields', 'Please fill in both contact name and phone number.');
      return;
    }
    addEmergencyContact(contactName, contactPhone);
    setContactName('');
    setContactPhone('');
    Alert.alert('Contact Added', 'Primary emergency contact has been logged.');
  };

  // Biometric Target Progress calculations
  const hydrationPct = Math.round(Math.min(100, (currentIntake / dailyWaterTarget) * 100));
  const hrvPct = Math.round(Math.min(100, (currentVitals.hrv / 120) * 100));
  const gutPct = recoveryScore;
  const sleepPct = 88; // Static baseline target

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Dossier Header Section */}
        <View style={styles.dossierHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.dossierName}>{user?.displayName?.toUpperCase() || 'AKASH SHARMA'}</Text>
            <Text style={styles.dossierTitle}>BIO-INTELLIGENCE SPECIALIST</Text>
          </View>
          
          <View style={styles.headerRight}>
            <View style={styles.contactItem}>
              <MapPin size={10} color={darkMode ? '#8E9AA6' : '#64748B'} />
              <Text style={styles.contactText}>New York, USA, 10001</Text>
            </View>
            <View style={styles.contactItem}>
              <Mail size={10} color={darkMode ? '#8E9AA6' : '#64748B'} />
              <Text style={styles.contactText}>{user?.email || 'akash@hydrax.io'}</Text>
            </View>
            <View style={styles.contactItem}>
              <Phone size={10} color={darkMode ? '#8E9AA6' : '#64748B'} />
              <Text style={styles.contactText}>+1 (555) 382-9901</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Responsive Two-Column Layout */}
        <View style={isDesktop ? styles.desktopColumns : styles.mobileColumns}>
          
          {/* LEFT SIDEBAR COLUMN */}
          <View style={isDesktop ? styles.leftColumnDesktop : styles.columnFullMobile}>
            
            {/* Avatar card */}
            <View style={styles.avatarCard}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop' }}
                style={styles.avatarImage as any}
              />
              <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
                <LogOut size={12} color="#FF4D6D" />
                <Text style={styles.logoutText}>TERMINATE SESSION</Text>
              </TouchableOpacity>
            </View>

            {/* About Me Section */}
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>ABOUT ME</Text>
              <Text style={styles.sidebarSectionText}>
                Active health-tech operator calibrated for real-time biosensor analysis. Specialized in tracking metabolic hydration coefficients, cardiovascular heart-rate variability indicators, and gastrointestinal recovery indexes.
              </Text>
            </View>

            {/* System Units Setup */}
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>SYSTEM PREFERENCES</Text>
              <View style={styles.unitsToggleWrapper}>
                {(['metric', 'imperial'] as const).map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    onPress={() => setUnits(unit)}
                    style={[
                      styles.unitBtn,
                      units === unit && styles.unitBtnActive
                    ]}
                  >
                    <Text style={[
                      styles.unitBtnText,
                      units === unit && styles.unitBtnTextActive
                    ]}>
                      {unit.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Emergency Contacts Setup */}
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>CLINICAL REFERENCE</Text>
              
              <View style={styles.contactInputForm}>
                <TextInput
                  value={contactName}
                  onChangeText={setContactName}
                  placeholder="Doctor Name (e.g. Dr. Patel)"
                  placeholderTextColor={darkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.35)'}
                  style={styles.formInput}
                />
                <TextInput
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  placeholder="Direct Phone (e.g. +15550199)"
                  placeholderTextColor={darkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.35)'}
                  keyboardType="phone-pad"
                  style={styles.formInput}
                />
                <TouchableOpacity
                  onPress={handleAddContact}
                  style={styles.addContactBtn}
                >
                  <Plus size={12} color="#050B18" strokeWidth={3} />
                  <Text style={styles.addContactBtnText}>ADD CONTACT</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.contactsList}>
                {emergencyContacts.map((contact) => (
                  <View key={contact.id} style={styles.contactCard}>
                    <View style={styles.contactInfo}>
                      <Text style={styles.contactCardName}>{contact.name}</Text>
                      <Text style={styles.contactCardPhone}>{contact.phone}</Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => removeEmergencyContact(contact.id)}
                      style={styles.deleteContactBtn}
                    >
                      <Trash2 size={10} color="#FF4D6D" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

          </View>

          {/* RIGHT CONTENT COLUMN */}
          <View style={isDesktop ? styles.rightColumnDesktop : styles.columnFullMobile}>
            
            {/* Timeline: Physiological Baseline */}
            <View style={styles.contentSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>PHYSIOLOGICAL BASELINE</Text>
                <TouchableOpacity 
                  onPress={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
                  style={styles.editBtn}
                >
                  {isEditing ? (
                    <Check size={14} color="#00E5C3" />
                  ) : (
                    <Edit3 size={14} color={darkMode ? '#FFFFFF' : '#0F172A'} />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.timelineContainer}>
                
                {/* Timeline Node 1: Age */}
                <View style={styles.timelineItem}>
                  <View style={styles.timelineIndicator}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineLine} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>AGE CALIBRATION</Text>
                    {isEditing ? (
                      <TextInput
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                        style={styles.timelineInput}
                      />
                    ) : (
                      <Text style={styles.timelineValue}>{age} Years</Text>
                    )}
                  </View>
                </View>

                {/* Timeline Node 2: Weight */}
                <View style={styles.timelineItem}>
                  <View style={styles.timelineIndicator}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineLine} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>BODY SCALE MASS</Text>
                    {isEditing ? (
                      <TextInput
                        value={weight}
                        onChangeText={setWeight}
                        keyboardType="numeric"
                        style={styles.timelineInput}
                      />
                    ) : (
                      <Text style={styles.timelineValue}>{weight} Kg</Text>
                    )}
                  </View>
                </View>

                {/* Timeline Node 3: Gender */}
                <View style={styles.timelineItem}>
                  <View style={styles.timelineIndicator}>
                    <View style={styles.timelineDot} />
                    <View style={styles.timelineLine} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>PHYSIOLOGICAL GENDER</Text>
                    {isEditing ? (
                      <TextInput
                        value={gender}
                        onChangeText={setGender}
                        style={styles.timelineInput}
                      />
                    ) : (
                      <Text style={styles.timelineValue}>{gender}</Text>
                    )}
                  </View>
                </View>

                {/* Timeline Node 4: Activity Level */}
                <View style={styles.timelineItem}>
                  <View style={styles.timelineIndicator}>
                    <View style={styles.timelineDot} />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineLabel}>METABOLIC WORKLOAD RATE</Text>
                    {isEditing ? (
                      <View style={styles.activityToggles}>
                        {(['low', 'medium', 'high'] as const).map((level) => (
                          <TouchableOpacity
                            key={level}
                            onPress={() => setActivityLevel(level)}
                            style={[
                              styles.activityBtn,
                              activityLevel === level && styles.activityBtnActive
                            ]}
                          >
                            <Text style={[
                              styles.activityBtnText,
                              activityLevel === level && styles.activityBtnTextActive
                            ]}>
                              {level.toUpperCase()}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : (
                      <Text style={[styles.timelineValue, { color: '#00E5C3' }]}>
                        {activityLevel.toUpperCase()}
                      </Text>
                    )}
                  </View>
                </View>

              </View>
            </View>

            {/* Skills-Style Progress Bars: Biometric Targets & Calibration */}
            <View style={styles.contentSection}>
              <Text style={styles.sectionTitle}>BIOMETRIC PERFORMANCE CALIBRATION</Text>
              
              <View style={styles.progressContainer}>
                
                {/* Progress 1: Gut Index */}
                <View style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <View style={styles.progressLabelRow}>
                      <Brain size={12} color="#00E5C3" style={{ marginRight: 6 }} />
                      <Text style={styles.progressName}>GUT INDEX RECOVERY</Text>
                    </View>
                    <Text style={styles.progressValueText}>{gutPct}%</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${gutPct}%`, backgroundColor: '#00E5C3' }]} />
                  </View>
                </View>

                {/* Progress 2: Hydration intake */}
                <View style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <View style={styles.progressLabelRow}>
                      <Droplet size={12} color="#14B8FF" style={{ marginRight: 6 }} />
                      <Text style={styles.progressName}>HYDRATION COEFFICIENT</Text>
                    </View>
                    <Text style={styles.progressValueText}>{hydrationPct}%</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${hydrationPct}%`, backgroundColor: '#14B8FF' }]} />
                  </View>
                </View>

                {/* Progress 3: HRV Heart Rate Variability */}
                <View style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <View style={styles.progressLabelRow}>
                      <Heart size={12} color="#FF4D6D" style={{ marginRight: 6 }} />
                      <Text style={styles.progressName}>CARDIOVASCULAR VARIABILITY</Text>
                    </View>
                    <Text style={styles.progressValueText}>{hrvPct}%</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${hrvPct}%`, backgroundColor: '#FF4D6D' }]} />
                  </View>
                </View>

                {/* Progress 4: Sleep Target */}
                <View style={styles.progressItem}>
                  <View style={styles.progressHeader}>
                    <View style={styles.progressLabelRow}>
                      <Activity size={12} color="#7C3AED" style={{ marginRight: 6 }} />
                      <Text style={styles.progressName}>SLEEP EFFICIENT PROFILE</Text>
                    </View>
                    <Text style={styles.progressValueText}>{sleepPct}%</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${sleepPct}%`, backgroundColor: '#7C3AED' }]} />
                  </View>
                </View>

              </View>
            </View>

          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (darkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkMode ? '#050B18' : '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 60,
  },
  
  // Header Style
  dossierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 20,
    marginTop: 8,
  },
  headerLeft: {
    flex: 1,
    minWidth: 280,
    justifyContent: 'center',
    marginBottom: 12,
  },
  dossierName: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dossierTitle: {
    color: '#00E5C3',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 4,
  },
  headerRight: {
    minWidth: 200,
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactText: {
    color: darkMode ? 'rgba(255, 255, 255, 0.6)' : '#475569',
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  
  divider: {
    height: 1,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    marginBottom: 24,
  },

  // Responsive Layout columns
  desktopColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mobileColumns: {
    flexDirection: 'column',
  },
  
  // Left Sidebar column styling
  leftColumnDesktop: {
    width: '32%',
    borderRightWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
    paddingRight: 24,
  },
  columnFullMobile: {
    width: '100%',
    marginBottom: 24,
  },
  
  // Right Column Styling
  rightColumnDesktop: {
    width: '64%',
    paddingLeft: 12,
  },

  // Left Column components
  avatarCard: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.06)',
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2.5,
    borderColor: '#00E5C3',
    marginBottom: 14,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 109, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 109, 0.18)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  logoutText: {
    color: '#FF4D6D',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  sidebarSection: {
    marginBottom: 24,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.06)',
  },
  sidebarSectionTitle: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    borderBottomWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    paddingBottom: 6,
    marginBottom: 10,
  },
  sidebarSectionText: {
    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : '#334155',
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },
  
  // Settings Units Toggle
  unitsToggleWrapper: {
    flexDirection: 'row',
    backgroundColor: darkMode ? 'rgba(5, 11, 24, 0.6)' : '#F1F5F9',
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.04)',
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  unitBtnActive: {
    backgroundColor: '#00E5C3',
  },
  unitBtnText: {
    color: darkMode ? '#8E9AA6' : '#64748B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  unitBtnTextActive: {
    color: '#050B18',
  },
  
  // Contact inputs
  contactInputForm: {
    marginBottom: 10,
  },
  formInput: {
    backgroundColor: darkMode ? 'rgba(5, 11, 24, 0.6)' : '#FFFFFF',
    color: darkMode ? '#FFFFFF' : '#0F172A',
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 8,
  },
  addContactBtn: {
    backgroundColor: '#00E5C3',
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addContactBtnText: {
    color: '#050B18',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: 6,
  },
  contactsList: {
    marginTop: 8,
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.06)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
  },
  contactInfo: {
    flex: 1,
  },
  contactCardName: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 9,
    fontWeight: '800',
  },
  contactCardPhone: {
    color: darkMode ? 'rgba(255, 255, 255, 0.45)' : '#64748B',
    fontSize: 8,
    marginTop: 1,
  },
  deleteContactBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 77, 109, 0.05)',
    borderRadius: 8,
  },

  // Right Column Content Sections
  contentSection: {
    marginBottom: 24,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.06)',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    paddingBottom: 10,
    marginBottom: 18,
  },
  sectionTitle: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  editBtn: {
    padding: 6,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  },
  
  // Timeline Styling
  timelineContainer: {
    paddingLeft: 6,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 16,
    width: 12,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E5C3',
    borderWidth: 1.5,
    borderColor: darkMode ? '#050B18' : '#FFFFFF',
    marginTop: 5,
    shadowColor: '#00E5C3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    marginTop: 4,
    minHeight: 28,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 14,
  },
  timelineLabel: {
    color: darkMode ? 'rgba(255, 255, 255, 0.45)' : '#64748B',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },
  timelineValue: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  timelineInput: {
    backgroundColor: darkMode ? 'rgba(5, 11, 24, 0.6)' : '#FFFFFF',
    color: darkMode ? '#FFFFFF' : '#0F172A',
    borderWidth: 1,
    borderColor: '#00E5C3',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    maxWidth: 160,
  },
  activityToggles: {
    flexDirection: 'row',
    marginTop: 6,
  },
  activityBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderRadius: 8,
    marginRight: 6,
  },
  activityBtnActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  activityBtnText: {
    color: darkMode ? '#8E9AA6' : '#64748B',
    fontSize: 8,
    fontWeight: '900',
  },
  activityBtnTextActive: {
    color: '#FFFFFF',
  },

  // Progress Bars Styling
  progressContainer: {
    marginTop: 8,
  },
  progressItem: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressName: {
    color: darkMode ? 'rgba(255, 255, 255, 0.75)' : '#475569',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  progressValueText: {
    color: darkMode ? '#FFFFFF' : '#0F172A',
    fontSize: 10,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
});
