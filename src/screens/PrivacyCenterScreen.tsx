import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { ShieldCheck, Lock, HardDrive, ArrowLeft, CheckCircle2, UserX, Database } from 'lucide-react-native';
import { StorageService } from '../services/StorageService';
import { PrivacySettings } from '../types';
import { defaultPrivacySettings } from '../data/mockData';

interface PrivacyCenterScreenProps {
  onBack: () => void;
}

export const PrivacyCenterScreen: React.FC<PrivacyCenterScreenProps> = ({ onBack }) => {
  const [settings, setSettings] = useState<PrivacySettings>(defaultPrivacySettings);

  useEffect(() => {
    StorageService.getPrivacySettings().then(setSettings);
  }, []);

  const handleToggle = (key: keyof PrivacySettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    StorageService.savePrivacySettings(updated);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft color="#F8FAFC" size={20} />
        </TouchableOpacity>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>PRIVACY & SECURITY CENTER</Text>
          <Text style={styles.headerSub}>Zero-Trust Local Processing Guarantee</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Core Guarantee Card */}
        <View style={styles.guaranteeCard}>
          <View style={styles.guaranteeTitleRow}>
            <ShieldCheck color="#10B981" size={24} />
            <Text style={styles.guaranteeTitle}>DATA PRIVACY GUARANTEE</Text>
          </View>
          <Text style={styles.guaranteeQuote}>
            "Your health data stays on your device unless you explicitly choose to share it."
          </Text>

          <View style={styles.checklistContainer}>
            <View style={styles.checkItem}>
              <CheckCircle2 color="#34D399" size={16} />
              <Text style={styles.checkText}>Health analysis performed 100% locally on-device</Text>
            </View>
            <View style={styles.checkItem}>
              <CheckCircle2 color="#34D399" size={16} />
              <Text style={styles.checkText}>No continuous cloud telemetry upload</Text>
            </View>
            <View style={styles.checkItem}>
              <CheckCircle2 color="#34D399" size={16} />
              <Text style={styles.checkText}>Granular user permission control for sharing</Text>
            </View>
            <View style={styles.checkItem}>
              <CheckCircle2 color="#34D399" size={16} />
              <Text style={styles.checkText}>Emergency location transmission strictly conditional</Text>
            </View>
          </View>
        </View>

        {/* Permission Controls */}
        <Text style={styles.sectionTitle}>DATA SHARING PERMISSIONS</Text>

        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLabelCol}>
              <Text style={styles.settingTitle}>Share Health Telemetry</Text>
              <Text style={styles.settingSub}>Allow anonymized metrics upload to research database</Text>
            </View>
            <Switch
              value={settings.shareHealthData}
              onValueChange={() => handleToggle('shareHealthData')}
              trackColor={{ false: '#334155', true: '#0EA5E9' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelCol}>
              <Text style={styles.settingTitle}>Share Location</Text>
              <Text style={styles.settingSub}>Provide continuous GPS location to health services</Text>
            </View>
            <Switch
              value={settings.shareLocation}
              onValueChange={() => handleToggle('shareLocation')}
              trackColor={{ false: '#334155', true: '#0EA5E9' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelCol}>
              <Text style={styles.settingTitle}>Emergency Contact Access</Text>
              <Text style={styles.settingSub}>Allow SMS dispatch to primary contact on fall/SOS</Text>
            </View>
            <Switch
              value={settings.emergencyContactAccess}
              onValueChange={() => handleToggle('emergencyContactAccess')}
              trackColor={{ false: '#334155', true: '#0EA5E9' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelCol}>
              <Text style={styles.settingTitle}>Cloud Backup</Text>
              <Text style={styles.settingSub}>Sync health logs to encrypted cloud server</Text>
            </View>
            <Switch
              value={settings.cloudBackup}
              onValueChange={() => handleToggle('cloudBackup')}
              trackColor={{ false: '#334155', true: '#0EA5E9' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Data Management Actions */}
        <View style={styles.card}>
          <Text style={styles.cardSectionHeader}>ON-DEVICE DATA MANAGEMENT</Text>

          <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
            <Database color="#38BDF8" size={18} />
            <Text style={styles.actionText}>Export Encrypted Local Health Logs (JSON)</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
            <UserX color="#EF4444" size={18} />
            <Text style={[styles.actionText, { color: '#EF4444' }]}>Clear All Local Baseline Data</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.5)',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  guaranteeCard: {
    backgroundColor: '#131C35',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  guaranteeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guaranteeTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#34D399',
    letterSpacing: 0.8,
  },
  guaranteeQuote: {
    fontSize: 13,
    color: '#F8FAFC',
    fontStyle: 'italic',
    marginTop: 8,
    fontWeight: '600',
    lineHeight: 18,
  },
  checklistContainer: {
    marginTop: 14,
    gap: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#131C35',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#233055',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingLabelCol: {
    flex: 1,
    paddingRight: 10,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  settingSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 12,
  },
  cardSectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
  },
});
