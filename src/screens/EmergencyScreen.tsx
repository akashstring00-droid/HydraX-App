import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { PhoneCall, MapPin, UserCheck, AlertOctagon } from 'lucide-react-native';
import { defaultUserProfile } from '../data/mockData';
import { EmergencyContact } from '../types';

export const EmergencyScreen: React.FC = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>(defaultUserProfile.emergencyContacts);
  const [locationSharing, setLocationSharing] = useState<boolean>(true);
  const [sosActive, setSosActive] = useState<boolean>(false);

  const handleSOSTrigger = () => {
    setSosActive(true);
  };

  const handleCancelSOS = () => {
    setSosActive(false);
  };

  const handleCallContact = (contact: EmergencyContact) => {
    Alert.alert(
      'Simulated Emergency Call',
      `Calling ${contact.name} (${contact.phone})...\n\n* Hackathon Demo Mode: Telephony Intent Simulated.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Emergency Assistance</Text>
        <Text style={styles.headerSub}>
          HydraX can help you contact your trusted people when needed.
        </Text>
      </View>

      <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          {/* Main Hero SOS Circular Area */}
          <View style={styles.sosHeroSection}>
            <Text style={styles.sosPrompt}>Press and hold for 3 seconds</Text>

            <TouchableOpacity
              style={[styles.sosOuterRing, sosActive && styles.sosActiveRing]}
              onPress={sosActive ? handleCancelSOS : handleSOSTrigger}
              activeOpacity={0.85}
            >
              <View style={styles.sosInnerCircle}>
                <AlertOctagon color="#FFFFFF" size={38} />
                <Text style={styles.sosBtnText}>{sosActive ? 'CANCEL' : 'SOS'}</Text>
              </View>
            </TouchableOpacity>

            {/* Status Pills */}
            <View style={styles.statusPillsRow}>
              <View style={styles.statusPill}>
                <View style={styles.greenDot} />
                <Text style={styles.statusPillText}>Fall Detection Active</Text>
              </View>

              <View style={styles.statusPill}>
                <View style={styles.greenDot} />
                <Text style={styles.statusPillText}>Emergency Location Ready</Text>
              </View>

              <View style={styles.statusPill}>
                <View style={styles.greenDot} />
                <Text style={styles.statusPillText}>Caregiver Connected</Text>
              </View>
            </View>

            {sosActive && (
              <View style={styles.activeNotice}>
                <Text style={styles.activeTitle}>🚨 SOS ALERT DISPATCHED</Text>
                <Text style={styles.activeSub}>
                  Location (28.6139° N, 77.2090° E) broadcasted to trusted caregivers.
                </Text>
              </View>
            )}
          </View>

          {/* Trusted Contacts Section */}
          <Text style={styles.sectionHeader}>TRUSTED CONTACTS</Text>

          <View style={styles.contactsCard}>
            {contacts.map((contact) => (
              <View key={contact.id} style={styles.contactItem}>
                <View style={styles.contactIconBox}>
                  <UserCheck color="#059669" size={16} />
                </View>

                <View style={styles.contactInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    {contact.isPrimary && (
                      <View style={styles.primaryTag}>
                        <Text style={styles.primaryText}>PRIMARY</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.contactRelation}>{contact.relation}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.callBtn}
                  onPress={() => handleCallContact(contact)}
                  activeOpacity={0.8}
                >
                  <PhoneCall color="#FFFFFF" size={14} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Location Sharing Toggle */}
          <View style={styles.locationCard}>
            <View style={styles.locationRow}>
              <MapPin color="#0D9488" size={16} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>Emergency Location Sharing</Text>
                <Text style={styles.locationSub}>Encrypted GPS coordinates attached to emergency dispatch</Text>
              </View>

              <TouchableOpacity 
                style={[styles.toggleSwitch, locationSharing && styles.toggleSwitchActive]}
                onPress={() => setLocationSharing(!locationSharing)}
                activeOpacity={0.8}
              >
                <View style={[styles.toggleKnob, locationSharing && styles.toggleKnobActive]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 25 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  scrollBody: {
    flex: 1,
  },
  contentPadding: {
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 12,
  },
  sosHeroSection: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  sosPrompt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  sosOuterRing: {
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  sosActiveRing: {
    backgroundColor: '#DC2626',
  },
  sosInnerCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  statusPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  greenDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  activeNotice: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  activeTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#DC2626',
  },
  activeSub: {
    fontSize: 10,
    color: '#0F172A',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  contactsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  contactIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  primaryTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  primaryText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#059669',
  },
  contactRelation: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  callBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  locationSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  toggleSwitch: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E2E8F0',
    padding: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#0D9488',
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobActive: {
    transform: [{ translateX: 18 }],
  },
});
