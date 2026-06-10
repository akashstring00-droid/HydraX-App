import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Image, Alert, useWindowDimensions, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/useAuthStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useVitalsStore } from '../store/useVitalsStore';
import { useWaterStore } from '../store/useWaterStore';
import { useDiarrheaStore } from '../store/useDiarrheaStore';
import { GlassCard } from '../components/GlassCard';
import { useTranslation } from '../store/i18n';
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
  FileText,
  Camera,
  RefreshCw,
  Globe,
  Lock
} from 'lucide-react-native';

export const ProfileScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { t } = useTranslation();

  const { user, updateProfile, logout } = useAuthStore();
  const { units, language, emergencyContacts, setUnits, setLanguage, addEmergencyContact, removeEmergencyContact } = useSettingsStore();
  const { currentVitals } = useVitalsStore();
  const { currentIntake, dailyWaterTarget } = useWaterStore();
  const { recoveryScore } = useDiarrheaStore();

  const darkMode = useSettingsStore((state) => state.darkMode);
  const styles = getStyles(darkMode);

  // Form states
  const [name, setName] = useState<string>(user?.displayName || '');
  const [age, setAge] = useState<string>(user?.age ? String(user.age) : '28');
  const [weight, setWeight] = useState<string>(user?.weight ? String(user.weight) : '74');
  const [height, setHeight] = useState<string>(user?.height ? String(user.height) : '178');
  const [gender, setGender] = useState<string>(user?.gender || 'Male');
  const [dob, setDob] = useState<string>(user?.dob || '1998-05-15');
  const [bloodGroup, setBloodGroup] = useState<string>(user?.bloodGroup || 'O+');
  const [medicalNotes, setMedicalNotes] = useState<string>(user?.medicalNotes || '');
  const [emergencyName, setEmergencyName] = useState<string>(user?.emergencyContactName || '');
  const [emergencyPhone, setEmergencyPhone] = useState<string>(user?.emergencyContactPhone || '');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Geolocation states
  const [geoState, setGeoState] = useState<{
    loading: boolean;
    error: string | null;
    city: string;
    state: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  }>({
    loading: false,
    error: null,
    city: '',
    state: '',
    country: '',
    latitude: null,
    longitude: null,
  });

  const fileInputRef = useRef<any>(null);

  // Geocoding helper using OSM Nominatim (Free, no keys needed)
  const fetchLocationName = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'Hydrax-App-Web',
          },
        }
      );
      const data = await response.json();
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.village || data.address.suburb || '';
        const state = data.address.state || '';
        const country = data.address.country || '';
        return { city, state, country };
      }
    } catch (error) {
      console.error('Nominatim Geocoding Error', error);
    }
    return null;
  };

  const detectLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoState((prev) => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    setGeoState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = await fetchLocationName(latitude, longitude);
        if (address) {
          setGeoState({
            loading: false,
            error: null,
            city: address.city,
            state: address.state,
            country: address.country,
            latitude,
            longitude,
          });
        } else {
          setGeoState({
            loading: false,
            error: null,
            city: 'Coordinates Detected',
            state: `${latitude.toFixed(3)}°N`,
            country: `${longitude.toFixed(3)}°E`,
            latitude,
            longitude,
          });
        }
      },
      (error) => {
        setGeoState({
          loading: false,
          error: t('locationDisabled'),
          city: '',
          state: '',
          country: '',
          latitude: null,
          longitude: null,
        });
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Run geolocation check once on load
  useEffect(() => {
    detectLocation();
  }, []);

  const handleUpdateProfile = async () => {
    const ageNum = parseInt(age, 10);
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (isNaN(ageNum) || isNaN(weightNum) || isNaN(heightNum)) {
      Alert.alert('Invalid Input', 'Please enter valid values for age, weight, and height.');
      return;
    }

    await updateProfile({
      displayName: name,
      age: ageNum,
      weight: weightNum,
      height: heightNum,
      gender,
      dob,
      bloodGroup,
      medicalNotes,
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone
    });

    setIsEditing(false);
    Alert.alert('Profile Saved', 'Your bio-intelligence dossier has been updated.');
  };

  // Profile Photo Upload handling
  const triggerPhotoUpload = () => {
    if (Platform.OS === 'web' && fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      Alert.alert('Select Photo', 'Upload photo supported in web browser.');
    }
  };

  const handlePhotoChange = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select an image smaller than 2 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const base64 = e.target.result;
        await updateProfile({ avatar: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = async () => {
    await updateProfile({ avatar: '' });
  };

  // Profile Completion calculator
  const getProfileCompletion = () => {
    let fields = [
      user?.avatar,
      user?.displayName,
      user?.dob,
      user?.gender,
      user?.height,
      user?.weight,
      user?.bloodGroup,
      user?.emergencyContactName,
      user?.emergencyContactPhone,
      user?.medicalNotes
    ];
    let filled = fields.filter(f => f !== undefined && f !== null && f !== '').length;
    return Math.round((filled / fields.length) * 100);
  };

  const completionPct = getProfileCompletion();

  // Wipe Local Storage
  const handleWipeLocalStorage = () => {
    Alert.alert(
      'Reset All Data?',
      'This will erase all logs, history, and custom settings stored in this browser session. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset Data', 
          style: 'destructive',
          onPress: () => {
            if (typeof window !== 'undefined') {
              window.localStorage.clear();
              window.location.reload();
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Hidden file input for web avatar uploads */}
      {Platform.OS === 'web' && (
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*" 
          onChange={handlePhotoChange} 
        />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Title */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.bannerSubtitle}>{t('profileSetup')}</Text>
          <Text style={styles.bannerTitle}>Biometric Dossier</Text>
        </View>

        {/* Two-Column responsive Grid */}
        <View style={styles.layoutGrid}>
          
          {/* COLUMN 1: Profile Display & Health Targets */}
          <View style={[styles.gridColumn, { flex: isDesktop ? 5 : undefined }]}>
            
            {/* Profile Card with Completion percentage & Geolocation */}
            <GlassCard style={styles.profileSummaryCard} borderColor={darkMode ? 'rgba(0, 229, 195, 0.1)' : 'rgba(0, 229, 195, 0.15)'}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarWrapper}>
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: darkMode ? '#111A36' : '#E2E8F0' }]}>
                      <User size={50} color={darkMode ? '#8E9AA6' : '#64748B'} />
                    </View>
                  )}
                  
                  {/* Photo Edit Trigger overlay */}
                  <TouchableOpacity style={styles.cameraIconBtn} onPress={triggerPhotoUpload}>
                    <Camera size={14} color="#050B18" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                {/* Photo removal trigger */}
                {user?.avatar ? (
                  <TouchableOpacity style={styles.removePhotoBtn} onPress={handleRemovePhoto}>
                    <Text style={styles.removePhotoBtnText}>{t('removePhoto')}</Text>
                  </TouchableOpacity>
                ) : null}

                <Text style={[styles.profileName, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>
                  {user?.displayName || 'Akash Sharma'}
                </Text>
                <Text style={styles.profileEmail}>
                  <Mail size={12} color="#8E9AA6" style={{ marginRight: 4 }} />
                  {user?.email || 'akash@hydrax.io'}
                </Text>

                {/* Geolocation Live Badge */}
                <View style={[styles.locationBadge, { backgroundColor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]}>
                  <MapPin size={12} color="#00E5C3" style={{ marginRight: 4 }} />
                  {geoState.loading ? (
                    <Text style={styles.locationText}>Locating...</Text>
                  ) : geoState.error ? (
                    <Text style={[styles.locationText, { color: '#FF4D6D' }]}>{geoState.error}</Text>
                  ) : (
                    <Text style={[styles.locationText, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>
                      {`${geoState.city}${geoState.city ? ', ' : ''}${geoState.state}${geoState.state ? ', ' : ''}${geoState.country}`}
                    </Text>
                  )}
                  <TouchableOpacity onPress={detectLocation} style={{ marginLeft: 6 }}>
                    <RefreshCw size={10} color={darkMode ? '#8E9AA6' : '#64748B'} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Profile Completion Score Progress Bar */}
              <View style={styles.completionContainer}>
                <View style={styles.completionHeader}>
                  <Text style={[styles.completionLabel, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{t('profileCompletion')}</Text>
                  <Text style={styles.completionVal}>{completionPct}%</Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)' }]}>
                  <View style={[styles.progressBarFill, { width: `${completionPct}%` }]} />
                </View>
              </View>
            </GlassCard>

            {/* Physiological Statistics Card */}
            <GlassCard style={styles.statsCard}>
              <Text style={[styles.sectionTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Physiological baselines</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Hydration Pct</Text>
                  <Text style={[styles.statValue, { color: '#00E5C3' }]}>
                    {Math.round(Math.min(100, (currentIntake / dailyWaterTarget) * 100))}%
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Heart Rate</Text>
                  <Text style={[styles.statValue, { color: '#FF4D6D' }]}>{currentVitals.heartRate} <Text style={styles.statUnit}>bpm</Text></Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Gut Health</Text>
                  <Text style={[styles.statValue, { color: '#7C3AED' }]}>{recoveryScore}%</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Skin Temperature</Text>
                  <Text style={[styles.statValue, { color: '#14B8FF' }]}>{currentVitals.skinTemp}°C</Text>
                </View>
              </View>
            </GlassCard>

          </View>
          
          {/* COLUMN 2: Editable Biography & System Preferences */}
          <View style={[styles.gridColumn, { flex: isDesktop ? 7 : undefined }]}>
            
            {/* Bio-Intelligence editable form */}
            <GlassCard style={styles.detailsCard}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.sectionTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>{t('editProfile')}</Text>
                <TouchableOpacity 
                  style={[styles.editBtn, { backgroundColor: isEditing ? '#00E5C3' : 'rgba(255,255,255,0.03)' }]} 
                  onPress={isEditing ? handleUpdateProfile : () => setIsEditing(true)}
                >
                  {isEditing ? (
                    <>
                      <Check size={14} color="#050B18" style={{ marginRight: 4 }} />
                      <Text style={[styles.editBtnText, { color: '#050B18' }]}>{t('saveProfile')}</Text>
                    </>
                  ) : (
                    <>
                      <Edit3 size={14} color={darkMode ? '#FFFFFF' : '#0F172A'} style={{ marginRight: 4 }} />
                      <Text style={[styles.editBtnText, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Edit Form</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Grid fields */}
              <View style={styles.formGrid}>
                
                {/* Field: Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>{t('name')}</Text>
                  <TextInput 
                    style={[styles.textInput, { color: darkMode ? '#FFFFFF' : '#0F172A', backgroundColor: darkMode ? '#070D1E' : '#F8FAFC' }]}
                    value={name}
                    onChangeText={setName}
                    editable={isEditing}
                    placeholder="Enter Name"
                    placeholderTextColor="#64748B"
                  />
                </View>

                {/* Field: Gender */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>{t('gender')}</Text>
                  <TextInput 
                    style={[styles.textInput, { color: darkMode ? '#FFFFFF' : '#0F172A', backgroundColor: darkMode ? '#070D1E' : '#F8FAFC' }]}
                    value={gender}
                    onChangeText={setGender}
                    editable={isEditing}
                    placeholder="e.g. Male, Female, Other"
                    placeholderTextColor="#64748B"
                  />
                </View>

                {/* Field: DOB */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>{t('dob')}</Text>
                  <TextInput 
                    style={[styles.textInput, { color: darkMode ? '#FFFFFF' : '#0F172A', backgroundColor: darkMode ? '#070D1E' : '#F8FAFC' }]}
                    value={dob}
                    onChangeText={setDob}
                    editable={isEditing}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#64748B"
                  />
                </View>

                {/* Field: Height */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>{t('height')} (cm)</Text>
                  <TextInput 
                    style={[styles.textInput, { color: darkMode ? '#FFFFFF' : '#0F172A', backgroundColor: darkMode ? '#070D1E' : '#F8FAFC' }]}
                    value={height}
                    onChangeText={setHeight}
                    editable={isEditing}
                    keyboardType="numeric"
                    placeholder="Height in cm"
                    placeholderTextColor="#64748B"
                  />
                </View>

                {/* Field: Weight */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>{t('weight')} (kg)</Text>
                  <TextInput 
                    style={[styles.textInput, { color: darkMode ? '#FFFFFF' : '#0F172A', backgroundColor: darkMode ? '#070D1E' : '#F8FAFC' }]}
                    value={weight}
                    onChangeText={setWeight}
                    editable={isEditing}
                    keyboardType="numeric"
                    placeholder="Weight in kg"
                    placeholderTextColor="#64748B"
                  />
                </View>

                {/* Field: Blood Group */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>{t('bloodGroup')}</Text>
                  <TextInput 
                    style={[styles.textInput, { color: darkMode ? '#FFFFFF' : '#0F172A', backgroundColor: darkMode ? '#070D1E' : '#F8FAFC' }]}
                    value={bloodGroup}
                    onChangeText={setBloodGroup}
                    editable={isEditing}
                    placeholder="e.g. O+, A-"
                    placeholderTextColor="#64748B"
                  />
                </View>
              </View>

              {/* Form group: Emergency Contacts */}
              <View style={[styles.formGroup, { marginTop: 12 }]}>
                <Text style={styles.inputLabel}>{t('emergencyContact')} Name</Text>
                <TextInput 
                  style={[styles.textInput, { color: darkMode ? '#FFFFFF' : '#0F172A', backgroundColor: darkMode ? '#070D1E' : '#F8FAFC' }]}
                  value={emergencyName}
                  onChangeText={setEmergencyName}
                  editable={isEditing}
                  placeholder="Contact Name"
                  placeholderTextColor="#64748B"
                />
              </View>

              <View style={[styles.formGroup, { marginTop: 12 }]}>
                <Text style={styles.inputLabel}>{t('emergencyContact')} Phone</Text>
                <TextInput 
                  style={[styles.textInput, { color: darkMode ? '#FFFFFF' : '#0F172A', backgroundColor: darkMode ? '#070D1E' : '#F8FAFC' }]}
                  value={emergencyPhone}
                  onChangeText={setEmergencyPhone}
                  editable={isEditing}
                  placeholder="Emergency Phone Number"
                  placeholderTextColor="#64748B"
                />
              </View>

              {/* Form group: Medical Notes */}
              <View style={[styles.formGroup, { marginTop: 12 }]}>
                <Text style={styles.inputLabel}>{t('medicalNotes')}</Text>
                <TextInput 
                  style={[styles.textInput, { color: darkMode ? '#FFFFFF' : '#0F172A', backgroundColor: darkMode ? '#070D1E' : '#F8FAFC', height: 80, textAlignVertical: 'top' }]}
                  value={medicalNotes}
                  onChangeText={setMedicalNotes}
                  editable={isEditing}
                  multiline={true}
                  placeholder="Known allergies, health conditions, or diagnostic summaries..."
                  placeholderTextColor="#64748B"
                />
              </View>
            </GlassCard>

            {/* Preference settings (Language / Units) */}
            <GlassCard style={styles.preferencesCard}>
              <Text style={[styles.sectionTitle, { color: darkMode ? '#FFFFFF' : '#0F172A', marginBottom: 16 }]}>Preferences & System Controls</Text>
              
              {/* Unit Selection toggler */}
              <View style={styles.prefItem}>
                <View style={styles.prefLeft}>
                  <Settings size={18} color="#00E5C3" style={{ marginRight: 10 }} />
                  <View>
                    <Text style={[styles.prefTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>Measurement Units</Text>
                    <Text style={styles.prefDesc}>Configure height & weight formats</Text>
                  </View>
                </View>
                <View style={styles.unitsTogRow}>
                  <TouchableOpacity 
                    style={[styles.unitTogBtn, units === 'metric' && styles.unitTogBtnActive]}
                    onPress={() => setUnits('metric')}
                  >
                    <Text style={[styles.unitTogText, units === 'metric' && styles.unitTogTextActive]}>Metric</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.unitTogBtn, units === 'imperial' && styles.unitTogBtnActive]}
                    onPress={() => setUnits('imperial')}
                  >
                    <Text style={[styles.unitTogText, units === 'imperial' && styles.unitTogTextActive]}>Imperial</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Multi-language selector dropdown */}
              <View style={styles.prefItem}>
                <View style={styles.prefLeft}>
                  <Globe size={18} color="#14B8FF" style={{ marginRight: 10 }} />
                  <View>
                    <Text style={[styles.prefTitle, { color: darkMode ? '#FFFFFF' : '#0F172A' }]}>App Language</Text>
                    <Text style={styles.prefDesc}>Configure app-wide translations</Text>
                  </View>
                </View>
                <View style={styles.unitsTogRow}>
                  <TouchableOpacity 
                    style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
                    onPress={() => setLanguage('en')}
                  >
                    <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.langBtn, language === 'es' && styles.langBtnActive]}
                    onPress={() => setLanguage('es')}
                  >
                    <Text style={[styles.langText, language === 'es' && styles.langTextActive]}>ES</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.langBtn, language === 'ja' && styles.langBtnActive]}
                    onPress={() => setLanguage('ja')}
                  >
                    <Text style={[styles.langText, language === 'ja' && styles.langTextActive]}>JA</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Security Actions */}
              <View style={styles.securityRow}>
                <TouchableOpacity 
                  style={[styles.wipeBtn, { borderColor: darkMode ? 'rgba(255,77,109,0.2)' : 'rgba(255,77,109,0.3)' }]}
                  onPress={handleWipeLocalStorage}
                >
                  <Lock size={14} color="#FF4D6D" style={{ marginRight: 6 }} />
                  <Text style={styles.wipeBtnText}>Reset Local Storage</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.logoutBtn} 
                  onPress={logout}
                >
                  <LogOut size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.logoutBtnText}>{t('logout')}</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>

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
    padding: 24,
    paddingBottom: 60,
  },
  bannerSubtitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00E5C3',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: darkMode ? '#FFFFFF' : '#0F172A',
    letterSpacing: -1,
  },
  layoutGrid: {
    flexDirection: Platform.OS === 'web' && Dimensions.get('window').width >= 768 ? 'row' : 'column',
    gap: 24,
  },
  gridColumn: {
    gap: 24,
  },
  profileSummaryCard: {
    padding: 24,
    alignItems: 'center',
    borderRadius: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    width: '100%',
  },
  avatarWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'visible',
    marginBottom: 16,
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#00E5C3',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  removePhotoBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 77, 109, 0.08)',
    marginBottom: 12,
  },
  removePhotoBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FF4D6D',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  profileEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 13,
    color: '#8E9AA6',
    fontWeight: '500',
    marginBottom: 16,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '90%',
  },
  locationText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)',
    width: '100%',
    marginVertical: 20,
  },
  completionContainer: {
    width: '100%',
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completionVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#00E5C3',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00E5C3',
    borderRadius: 3,
  },
  statsCard: {
    padding: 20,
    borderRadius: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    backgroundColor: darkMode ? 'rgba(255,255,255,0.01)' : 'rgba(0,0,0,0.01)',
    borderWidth: 1,
    borderColor: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E9AA6',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 12,
    color: '#8E9AA6',
  },
  detailsCard: {
    padding: 24,
    borderRadius: 24,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  formGroup: {
    width: Platform.OS === 'web' && Dimensions.get('window').width >= 768 ? '47%' : '100%',
    minWidth: 200,
    flexGrow: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E9AA6',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  textInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    fontSize: 13,
    fontWeight: '600',
  },
  preferencesCard: {
    padding: 24,
    borderRadius: 24,
  },
  prefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  prefLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  prefDesc: {
    fontSize: 11,
    color: '#8E9AA6',
    fontWeight: '500',
  },
  unitsTogRow: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  unitTogBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  unitTogBtnActive: {
    backgroundColor: '#00E5C3',
  },
  unitTogText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E9AA6',
  },
  unitTogTextActive: {
    color: '#050B18',
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
  },
  langBtnActive: {
    backgroundColor: '#14B8FF',
  },
  langText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8E9AA6',
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
    gap: 12,
  },
  wipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  wipeBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF4D6D',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF4D6D',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#FF4D6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  logoutBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
});
