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
  Database,
  Info,
  FileText,
  Mail,
  MessageSquare,
  Star,
  X,
  Lock
} from 'lucide-react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
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
    removeEmergencyContact,
    setActiveTab
  } = useSettingsStore();

  const { logout } = useAuthStore();

  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(true);

  const showToast = useToastStore((state) => state.showToast);

  const [activeModal, setActiveModal] = useState<'about' | 'privacy' | 'terms' | 'contact' | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(0);
  const [feedbackType, setFeedbackType] = useState<string>('bug');
  const [feedbackText, setFeedbackText] = useState<string>('');

  React.useEffect(() => {
    const handleOpenPrivacy = () => {
      setActiveModal('privacy');
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('hydrax-open-privacy-modal', handleOpenPrivacy);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hydrax-open-privacy-modal', handleOpenPrivacy);
      }
    };
  }, []);

  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim() || feedbackRating === 0) {
      showToast("Please select a star rating and enter feedback.", "error");
      return;
    }

    try {
      const feedbackEntry = {
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        timestamp: new Date().toISOString(),
        rating: feedbackRating,
        type: feedbackType,
        text: feedbackText.trim()
      };

      const existingFeedbacksStr = localStorage.getItem('hydrax-admin-feedbacks');
      const existingFeedbacks = existingFeedbacksStr ? JSON.parse(existingFeedbacksStr) : [];
      existingFeedbacks.unshift(feedbackEntry);
      
      localStorage.setItem('hydrax-admin-feedbacks', JSON.stringify(existingFeedbacks));
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hydrax-new-feedback-submitted'));
      }

      showToast("Feedback submitted successfully!", "success");
      setFeedbackRating(0);
      setFeedbackText('');
      setFeedbackType('bug');
    } catch (err) {
      console.error(err);
      showToast("Failed to record feedback.", "error");
    }
  };

  const renderModal = () => {
    if (!activeModal) return null;

    let title = '';
    let content: React.ReactNode = null;

    if (activeModal === 'about') {
      title = 'About HydraX OS';
      content = (
        <ScrollView style={styles.modalScroll}>
          <Text style={[styles.modalHeading, { color: textPrimary }]}>Bio-Intelligence Kernel</Text>
          <Text style={[styles.modalBody, { color: textSecondary }]}>
            HydraX is a production-grade bio-intelligence health operating system built to address the critical gaps in real-time metabolic and hydration logging. Harnessing micro-impedance sensor modeling and sweat chemistry algorithms, HydraX delivers continuous vitals diagnostics (HRV, HR, dehydration margins) to help athletes, clinical subjects, and high-performance individuals optimize recovery.
          </Text>
          
          <Text style={[styles.modalHeading, { color: textPrimary, marginTop: 16 }]}>Project Genesis</Text>
          <Text style={[styles.modalBody, { color: textSecondary }]}>
            Born out of medical-grade research on hydration bio-impedance patterns, HydraX integrates seamlessly with consumer wearables via proprietary Bluetooth Low Energy (BLE) protocols. Our mission is to democratize metabolic monitoring and build a reactive framework for proactive wellness.
          </Text>

          <Text style={[styles.modalHeading, { color: textPrimary, marginTop: 16 }]}>System Integrity</Text>
          <Text style={[styles.modalBody, { color: textSecondary }]}>
            Version: 1.0.0 (Release Candidate){"\n"}
            Kernel Hash: 0x8F94D2CBE090A1{"n"}
            Architecture: React Native + Expo Metro Static (ARM64/x64 compiler targets)
          </Text>
        </ScrollView>
      );
    } else if (activeModal === 'privacy') {
      title = 'Privacy Policy & HIPAA';
      content = (
        <ScrollView style={styles.modalScroll}>
          <Text style={[styles.modalHeading, { color: textPrimary }]}>Data Privacy Notice</Text>
          <Text style={[styles.modalBody, { color: textSecondary }]}>
            Last updated: June 21, 2026.{"\n"}
            Your privacy is of critical importance to the HydraX Dev Team. We do not sell or lease user telemetry to marketing agencies. All biometric signals (including Heart Rate, Heart Rate Variability, and daily water consumption metrics) are encrypted both in transit and at rest.
          </Text>

          <View style={[styles.modalAlertBox, { backgroundColor: 'rgba(0, 255, 178, 0.05)', borderColor: 'rgba(0, 255, 178, 0.2)' }]}>
            <Text style={[styles.modalAlertText, { color: '#00FFB2' }]}>
              HIPAA & MEDICAL PRIVACY COMPLIANCE
            </Text>
            <Text style={[styles.modalAlertDesc, { color: textSecondary }]}>
              HydraX complies with HIPAA guidelines for handling Protected Health Information (PHI) when connected to clinical client accounts. Telemetry is fully isolated and local storage replicates locally until explicitly synced via end-to-end encrypted databases.
            </Text>
          </View>

          <Text style={[styles.modalHeading, { color: textPrimary, marginTop: 16 }]}>1. Information We Collect</Text>
          <Text style={[styles.modalBody, { color: textSecondary }]}>
            • Biometric Telemetry: Wearable sensor streams (heart rate, skin temp).{"\n"}
            • Profile Configuration: Age, gender, weight, height, and water targets.{"\n"}
            • Usage Logs: Hydration logs, event feedback, and software error logs.
          </Text>

          <Text style={[styles.modalHeading, { color: textPrimary, marginTop: 16 }]}>2. Telemetry Isolation</Text>
          <Text style={[styles.modalBody, { color: textSecondary }]}>
            You can wipe all local storage data at any time via the "Wipe Cache" button in settings. Once triggered, the local profile dossier, logged hydration history, and event streams are deleted permanently.
          </Text>
        </ScrollView>
      );
    } else if (activeModal === 'terms') {
      title = 'Terms & Conditions';
      content = (
        <ScrollView style={styles.modalScroll}>
          <Text style={[styles.modalHeading, { color: textPrimary }]}>Medical Disclaimer</Text>
          
          <View style={[styles.modalAlertBox, { backgroundColor: 'rgba(255, 173, 51, 0.05)', borderColor: 'rgba(255, 173, 51, 0.2)' }]}>
            <Text style={[styles.modalAlertText, { color: '#FFAD33' }]}>
              CRITICAL MEDICAL NOTICE & DISCLAIMER
            </Text>
            <Text style={[styles.modalAlertDesc, { color: textSecondary }]}>
              THE HYDRAX APPLICATION AND ITS AI COACH ARE WELLNESS AND PERFORMANCE TRACKING UTILITIES. THEY ARE NOT INTENDED FOR DIAGNOSTIC, CLINICAL, OR THERAPEUTIC USE. HYDRAX DOES NOT PROVIDE MEDICAL ADVICE. ALWAYS CONSULT A CERTIFIED HEALTHCARE PROFESSIONAL BEFORE COMMENCING HYDRATION DIETARY ALTERATIONS OR EXERTION PROTOCOLS. NEVER DISREGARD PROFESSIONAL CLINICAL DIAGNOSES IN FAVOR OF HYDRAX BIO-TELEMETRY.
            </Text>
          </View>

          <Text style={[styles.modalHeading, { color: textPrimary, marginTop: 16 }]}>1. Scope of Service</Text>
          <Text style={[styles.modalBody, { color: textSecondary }]}>
            HydraX is licensed for personal, non-commercial use on the domain hydrax.co.in. AI Coach feedback is synthesized by algorithmic agents and is provided strictly for educational hydration support.
          </Text>

          <Text style={[styles.modalHeading, { color: textPrimary, marginTop: 16 }]}>2. Liability Boundaries</Text>
          <Text style={[styles.modalBody, { color: textSecondary }]}>
            Under no circumstances shall the HydraX Dev Team or affiliates be liable for adverse physical events, health complications, or medical costs arising from use or reliance on the telemetry provided herein.
          </Text>
        </ScrollView>
      );
    } else if (activeModal === 'contact') {
      title = 'Contact Support Nodes';
      content = (
        <ScrollView style={styles.modalScroll}>
          <Text style={[styles.modalHeading, { color: textPrimary }]}>Enterprise Channels</Text>
          <Text style={[styles.modalBody, { color: textSecondary }]}>
            For corporate licenses, health-wearable integration protocols, or customer support queries, reach out through our primary nodes:
          </Text>

          <View style={styles.contactNode}>
            <Text style={[styles.contactLabel, { color: textPrimary }]}>Support Node Email:</Text>
            <Text style={styles.contactVal}>support@hydrax.co.in</Text>
          </View>

          <View style={styles.contactNode}>
            <Text style={[styles.contactLabel, { color: textPrimary }]}>Domain Node:</Text>
            <Text style={styles.contactVal}>https://hydrax.co.in</Text>
          </View>

          <View style={styles.contactNode}>
            <Text style={[styles.contactLabel, { color: textPrimary }]}>Development Base Office:</Text>
            <Text style={styles.contactVal}>
              Hydrax Cybernetics Lab, Plot 42, Tech Park, Sector 5, Bangalore, India
            </Text>
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: darkMode ? '#070D1E' : '#FFFFFF', borderColor: borderCol }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: textPrimary }]}>{title}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setActiveModal(null)}>
              <Text style={{ color: textSecondary, fontSize: 16, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalDivider} />
          {content}
        </View>
      </View>
    );
  };

  const handleAddContact = () => {
    if (newContactName.trim() && newContactPhone.trim()) {
      addEmergencyContact(newContactName.trim(), newContactPhone.trim());
      setNewContactName('');
      setNewContactPhone('');
      showToast("Clinical contact registered!", "success");
    } else {
      showToast("Please fill in contact name and phone number.", "error");
    }
  };

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      const confirmWipe = window.confirm("Are you sure you want to wipe all local biometric data, logs, and profile preferences? This action cannot be undone.");
      if (confirmWipe) {
        window.localStorage.clear();
        showToast("Local storage cleared. Rebooting system...", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
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
                  onValueChange={(val) => {
                    setDarkMode(val);
                    showToast(val ? "Dark theme activated." : "Light theme activated.", "success");
                  }}
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
                      onPress={() => {
                        setUnits(unit as any);
                        showToast(`Units set to ${unit.toUpperCase()}`, "success");
                      }}
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
                      onPress={() => {
                        setLanguage(lang.id as any);
                        showToast(`Language set to ${lang.label}`, "success");
                      }}
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

            {/* Quick Access Links for Mobile */}
            {!isDesktop && (
              <GlassCard style={styles.card} borderColor={borderCol}>
                <Text style={styles.sectionLabel}>Premium Health OS Shortcuts</Text>
                
                <TouchableOpacity 
                  style={styles.settingRow} 
                  onPress={() => setActiveTab('timeline')}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <Globe size={16} color="#00E5C3" />
                    <Text style={[styles.settingLabel, { color: textPrimary }]}>Health Timeline</Text>
                  </View>
                  <ChevronRight size={16} color={textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.settingRow} 
                  onPress={() => setActiveTab('exportCenter')}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <Database size={16} color="#14B8FF" />
                    <Text style={[styles.settingLabel, { color: textPrimary }]}>Export Center</Text>
                  </View>
                  <ChevronRight size={16} color={textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.settingRow, { borderBottomWidth: 0, paddingBottom: 0 }]} 
                  onPress={() => setActiveTab('emergencyMode')}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <ShieldAlert size={16} color="#FF4D6D" />
                    <Text style={[styles.settingLabel, { color: textPrimary }]}>Emergency Mode (SOS)</Text>
                  </View>
                  <ChevronRight size={16} color={textSecondary} />
                </TouchableOpacity>
              </GlassCard>
            )}

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
                  onValueChange={(val) => {
                    setSyncEnabled(val);
                    showToast(val ? "Background sync active!" : "Background sync paused.", "info");
                  }}
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

          {/* COLUMN 2: Emergency contacts & Launch Portal */}
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
                        onPress={() => {
                          removeEmergencyContact(c.id);
                          showToast("Clinical contact removed.", "info");
                        }}
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

            {/* Launch Portal Card */}
            <GlassCard style={styles.card} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>Launch Info & Legal Portal</Text>
              
              <TouchableOpacity style={styles.portalRow} onPress={() => setActiveModal('about')} activeOpacity={0.7}>
                <View style={styles.rowLeft}>
                  <Info size={14} color="#00E5C3" />
                  <Text style={[styles.portalLabel, { color: textPrimary }]}>About HydraX OS</Text>
                </View>
                <ChevronRight size={14} color={textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.portalRow} onPress={() => setActiveModal('privacy')} activeOpacity={0.7}>
                <View style={styles.rowLeft}>
                  <Lock size={14} color="#00FFB2" />
                  <Text style={[styles.portalLabel, { color: textPrimary }]}>Privacy Policy & HIPAA Notice</Text>
                </View>
                <ChevronRight size={14} color={textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.portalRow} onPress={() => setActiveModal('terms')} activeOpacity={0.7}>
                <View style={styles.rowLeft}>
                  <FileText size={14} color="#FFAD33" />
                  <Text style={[styles.portalLabel, { color: textPrimary }]}>Terms & Conditions</Text>
                </View>
                <ChevronRight size={14} color={textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.portalRow, { borderBottomWidth: 0, paddingBottom: 0 }]} onPress={() => setActiveModal('contact')} activeOpacity={0.7}>
                <View style={styles.rowLeft}>
                  <Mail size={14} color="#14B8FF" />
                  <Text style={[styles.portalLabel, { color: textPrimary }]}>Contact Support Nodes</Text>
                </View>
                <ChevronRight size={14} color={textSecondary} />
              </TouchableOpacity>
            </GlassCard>

            {/* Feedback Form Card */}
            <GlassCard style={styles.card} borderColor={borderCol}>
              <Text style={styles.sectionLabel}>System Feedback Hub</Text>
              <Text style={[styles.feedbackSubtitle, { color: textSecondary }]}>
                Report issues or recommend algorithmic calibrations directly to the administration dossier.
              </Text>

              {/* Stars Rating */}
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setFeedbackRating(star)}
                    activeOpacity={0.7}
                    style={styles.starBtn}
                  >
                    <Star
                      size={20}
                      color={star <= feedbackRating ? '#FFD700' : (darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')}
                      fill={star <= feedbackRating ? '#FFD700' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Feedback Category Dropdown / Selector */}
              <View style={styles.feedbackTypeContainer}>
                {[
                  { id: 'bug', label: 'Bug Report' },
                  { id: 'suggestion', label: 'Suggestion' },
                  { id: 'ux', label: 'UX/Design' },
                  { id: 'other', label: 'General' }
                ].map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    onPress={() => setFeedbackType(type.id)}
                    style={[
                      styles.feedbackTypeBtn,
                      {
                        backgroundColor: feedbackType === type.id ? '#00E5C3' : 'rgba(255,255,255,0.02)',
                        borderColor: feedbackType === type.id ? '#00E5C3' : borderCol
                      }
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.feedbackTypeBtnText,
                        { color: feedbackType === type.id ? '#050B18' : textPrimary }
                      ]}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Message Content */}
              <TextInput
                value={feedbackText}
                onChangeText={setFeedbackText}
                placeholder="Describe your biometric or system feedback..."
                placeholderTextColor={textSecondary}
                multiline
                numberOfLines={3}
                style={[
                  styles.feedbackInput,
                  {
                    color: textPrimary,
                    backgroundColor: inputBg,
                    borderColor: borderCol,
                  }
                ]}
              />

              <TouchableOpacity
                onPress={handleFeedbackSubmit}
                style={styles.feedbackSubmitBtn}
                activeOpacity={0.7}
              >
                <MessageSquare size={14} color="#050B18" style={{ marginRight: 6 }} />
                <Text style={styles.feedbackSubmitBtnText}>Submit Feedback</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>

        </View>

      </ScrollView>
      {renderModal()}
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
  // Portal & Modals Styles
  portalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  portalLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 12,
  },
  feedbackSubtitle: {
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 13,
    marginBottom: 12,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  starBtn: {
    padding: 4,
  },
  feedbackTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  feedbackTypeBtn: {
    flex: 1,
    minWidth: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  feedbackTypeBtnText: {
    fontSize: 9,
    fontWeight: '700',
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    fontSize: 11,
    fontWeight: '600',
    textAlignVertical: 'top',
    height: 70,
    marginBottom: 14,
  },
  feedbackSubmitBtn: {
    backgroundColor: '#00E5C3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  feedbackSubmitBtnText: {
    color: '#050B18',
    fontSize: 11,
    fontWeight: '800',
  },
  // Modal Overlays
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 11, 24, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 550,
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#00E5C3',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 14,
  },
  modalScroll: {
    flex: 1,
  },
  modalHeading: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  modalAlertBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  modalAlertText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalAlertDesc: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '600',
  },
  contactNode: {
    marginBottom: 10,
  },
  contactLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  contactVal: {
    color: '#00E5C3',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
