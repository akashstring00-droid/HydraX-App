import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Activity, Droplet, ArrowRight, ShieldCheck, Dumbbell, Sparkles } from 'lucide-react-native';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useWaterStore } from '../store/useWaterStore';
import { GlassCard } from '../components/GlassCard';

export const OnboardingScreen: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const darkMode = useSettingsStore((state) => state.darkMode);
  const showToast = useToastStore((state) => state.showToast);

  const { updateProfile, isLoading, error, user } = useAuthStore();

  const [name, setName] = useState(user?.displayName || '');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [dailyGoal, setDailyGoal] = useState('');
  const [isCustomGoal, setIsCustomGoal] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Automatically detect user's current city and country
  useEffect(() => {
    const detectLocation = async () => {
      setIsDetectingLocation(true);
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        if (data && data.city && data.country_name) {
          setCity(data.city);
          setCountry(data.country_name);
          showToast(`Detected Location: ${data.city}, ${data.country_name}`, 'success');
        }
      } catch (err) {
        console.warn('IP Geolocation lookup failed:', err);
      } finally {
        setIsDetectingLocation(false);
      }
    };
    detectLocation();
  }, []);

  // Automatically compute and suggest daily water target when weight/activity updates
  useEffect(() => {
    if (!isCustomGoal && weight) {
      const wNum = parseFloat(weight);
      if (!isNaN(wNum) && wNum > 0) {
        // Base hydration target formula: weight * 35 ml
        let baseGoal = wNum * 35;
        // Adjust based on activity level: Low = 0ml, Medium = 500ml, High = 1000ml
        if (activityLevel === 'medium') {
          baseGoal += 500;
        } else if (activityLevel === 'high') {
          baseGoal += 1000;
        }
        setDailyGoal(Math.round(baseGoal).toString());
      }
    }
  }, [weight, activityLevel, isCustomGoal]);

  const handleOnboardingSubmit = async () => {
    // Validations
    if (!name.trim()) {
      showToast('Please enter your name.', 'error');
      return;
    }
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum <= 0 || ageNum > 120) {
      showToast('Please enter a valid age.', 'error');
      return;
    }
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 10 || weightNum > 300) {
      showToast('Please enter a valid weight in kg.', 'error');
      return;
    }
    const heightNum = parseFloat(height);
    if (isNaN(heightNum) || heightNum <= 50 || heightNum > 250) {
      showToast('Please enter a valid height in cm.', 'error');
      return;
    }
    const goalNum = parseInt(dailyGoal, 10);
    if (isNaN(goalNum) || goalNum <= 500 || goalNum > 10000) {
      showToast('Please enter a realistic water goal (500ml - 10000ml).', 'error');
      return;
    }
    if (!emergencyName.trim() || !emergencyPhone.trim()) {
      showToast('Please register an emergency contact.', 'error');
      return;
    }

    showToast('Calibrating metabolic metrics...', 'info');

    // Sync profile to store & database
    await updateProfile({
      displayName: name.trim(),
      age: ageNum,
      gender,
      weight: weightNum,
      height: heightNum,
      activityLevel,
      bloodGroup,
      emergencyContactName: emergencyName.trim(),
      emergencyContactPhone: emergencyPhone.trim(),
      city,
      country,
      isProfileSetup: true,
    });

    // Update daily water goal in water store
    useWaterStore.getState().setDailyTarget(goalNum);

    showToast('Biometric profile setup complete!', 'success');
  };

  const textPrimary = darkMode ? '#FFFFFF' : '#0F172A';
  const textSecondary = darkMode ? '#8E9AA6' : '#64748B';
  const borderCol = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#E2E8F0';
  const inputBg = darkMode ? 'rgba(255,255,255,0.02)' : '#FFFFFF';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#050B18' : '#F8FAFC' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Brand / Logo header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoBadge}>
            <Sparkles size={24} color="#00E5C3" />
          </View>
          <Text style={[styles.brandTitle, { color: textPrimary }]}>METABOLIC ONBOARDING</Text>
          <Text style={styles.brandSubtitle}>CALIBRATING YOUR BIO-INTELLIGENCE PROTOCOLS</Text>
        </View>

        {/* Central Form Card */}
        <GlassCard style={[styles.formCard, { width: isDesktop ? 500 : '100%', borderColor: borderCol }]} borderColor={borderCol}>
          
          <Text style={[styles.formInstructions, { color: textSecondary }]}>
            To configure HydraX's hydration tracking, AI coaching, and vital indicators, please establish your base bio-metrics.
          </Text>

          <View style={styles.formContainer}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Display Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
                <User size={16} color={textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.textInput, { color: textPrimary }]}
                  placeholder="e.g. Akash Sharma"
                  placeholderTextColor={textSecondary}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            {/* Age & Gender side-by-side */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>Age (years)</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
                  <TextInput
                    style={[styles.textInput, { color: textPrimary }]}
                    placeholder="28"
                    placeholderTextColor={textSecondary}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1.5 }]}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.genderToggleRow}>
                  {(['Male', 'Female', 'Other'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderBtn,
                        gender === g && styles.genderBtnActive,
                        { borderColor: borderCol }
                      ]}
                      onPress={() => setGender(g)}
                    >
                      <Text style={[
                        styles.genderBtnText,
                        { color: gender === g ? '#050B18' : textSecondary }
                      ]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Height & Weight side-by-side */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
                  <TextInput
                    style={[styles.textInput, { color: textPrimary }]}
                    placeholder="178"
                    placeholderTextColor={textSecondary}
                    value={height}
                    onChangeText={setHeight}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
                  <TextInput
                    style={[styles.textInput, { color: textPrimary }]}
                    placeholder="74"
                    placeholderTextColor={textSecondary}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Blood Group Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Blood Group</Text>
              <View style={styles.bloodGroupRow}>
                {['A+', 'B+', 'AB+', 'O+', 'A-', 'B-', 'AB-', 'O-'].map((bg) => (
                  <TouchableOpacity
                    key={bg}
                    style={[
                      styles.bloodBtn,
                      bloodGroup === bg && styles.bloodBtnActive,
                      { borderColor: borderCol }
                    ]}
                    onPress={() => setBloodGroup(bg)}
                  >
                    <Text style={[
                      styles.bloodBtnText,
                      { color: bloodGroup === bg ? '#050B18' : textSecondary }
                    ]}>{bg}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Geolocation Fields */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>City {isDetectingLocation && '(detecting...)'}</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
                  <TextInput
                    style={[styles.textInput, { color: textPrimary }]}
                    placeholder="e.g. Bangalore"
                    placeholderTextColor={textSecondary}
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Country</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
                  <TextInput
                    style={[styles.textInput, { color: textPrimary }]}
                    placeholder="e.g. India"
                    placeholderTextColor={textSecondary}
                    value={country}
                    onChangeText={setCountry}
                  />
                </View>
              </View>
            </View>

            {/* Emergency Contact */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.inputLabel}>Emergency Contact Name</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
                  <TextInput
                    style={[styles.textInput, { color: textPrimary }]}
                    placeholder="e.g. Mom"
                    placeholderTextColor={textSecondary}
                    value={emergencyName}
                    onChangeText={setEmergencyName}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Emergency Contact Phone</Text>
                <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
                  <TextInput
                    style={[styles.textInput, { color: textPrimary }]}
                    placeholder="e.g. +919988776655"
                    placeholderTextColor={textSecondary}
                    value={emergencyPhone}
                    onChangeText={setEmergencyPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            {/* Activity Level Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Activity Level</Text>
              <View style={styles.activityContainer}>
                {(['low', 'medium', 'high'] as const).map((level) => {
                  const levelLabels = { low: 'Low (Sedentary)', medium: 'Active (Daily walk)', high: 'Athletic (Heavy training)' };
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.activityBtn,
                        activityLevel === level && styles.activityBtnActive,
                        { borderColor: borderCol, backgroundColor: activityLevel === level ? 'rgba(0, 229, 195, 0.1)' : inputBg }
                      ]}
                      onPress={() => setActivityLevel(level)}
                    >
                      <Dumbbell size={14} color={activityLevel === level ? '#00E5C3' : textSecondary} style={{ marginRight: 8 }} />
                      <Text style={[
                        styles.activityBtnText,
                        { color: activityLevel === level ? '#00E5C3' : textPrimary }
                      ]}>{levelLabels[level]}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Daily Hydration Goal with calculation output */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.inputLabel}>Daily Fluid Goal (ml)</Text>
                <TouchableOpacity onPress={() => setIsCustomGoal(!isCustomGoal)}>
                  <Text style={styles.customGoalToggle}>
                    {isCustomGoal ? 'Reset to suggested' : 'Customize goal'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrapper, { backgroundColor: inputBg, borderColor: borderCol }]}>
                <Droplet size={16} color="#00E5C3" style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.textInput, { color: textPrimary }]}
                  placeholder="2500"
                  placeholderTextColor={textSecondary}
                  value={dailyGoal}
                  onChangeText={(val) => {
                    setDailyGoal(val);
                    setIsCustomGoal(true);
                  }}
                  keyboardType="numeric"
                  editable={isCustomGoal || !weight}
                />
              </View>
              {!isCustomGoal && weight && (
                <Text style={styles.suggestedNote}>
                  Suggested based on weight and activity level coefficients.
                </Text>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: isLoading ? 'rgba(0, 229, 195, 0.4)' : '#00E5C3' }]}
              onPress={handleOnboardingSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#050B18" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Initialize Dashboard</Text>
                  <ArrowRight size={16} color="#050B18" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

          </View>
        </GlassCard>

        {/* Security clinical credentials notice */}
        <View style={styles.footerNoteRow}>
          <ShieldCheck size={14} color="#00E5C3" style={{ marginRight: 6 }} />
          <Text style={styles.footerNoteText}>
            These metrics customize metabolic algorithms and default warnings.
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
    marginBottom: 24,
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
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  brandSubtitle: {
    color: '#00E5C3',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 6,
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
  },
  formInstructions: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 20,
    textAlign: 'center',
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
  customGoalToggle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00E5C3',
  },
  suggestedNote: {
    fontSize: 10,
    color: '#8E9AA6',
    fontStyle: 'italic',
    marginTop: 2,
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
  rowInputs: {
    flexDirection: 'row',
  },
  genderToggleRow: {
    flexDirection: 'row',
    height: 44,
    gap: 6,
  },
  genderBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: '#00E5C3',
    borderColor: '#00E5C3',
  },
  genderBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  activityContainer: {
    gap: 8,
  },
  activityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
  },
  activityBtnActive: {
    borderColor: '#00E5C3',
  },
  activityBtnText: {
    fontSize: 12,
    fontWeight: '700',
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
  footerNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
  },
  footerNoteText: {
    color: '#8E9AA6',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
  },
  bloodGroupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  bloodBtn: {
    flex: 1,
    minWidth: 50,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  bloodBtnActive: {
    backgroundColor: '#00E5C3',
    borderColor: '#00E5C3',
  },
  bloodBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
