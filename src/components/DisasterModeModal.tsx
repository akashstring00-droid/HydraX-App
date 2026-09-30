import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { X, ShieldAlert, Sun, Wind, Droplet, Umbrella, CloudLightning, Activity, Check } from 'lucide-react-native';
import { DisasterModeType } from '../types';
import { disasterProfiles } from '../data/mockData';

interface DisasterModeModalProps {
  visible: boolean;
  onClose: () => void;
  activeDisaster: DisasterModeType;
  onSelectDisaster: (type: DisasterModeType) => void;
}

const disasterList: { type: DisasterModeType; label: string; icon: any; color: string }[] = [
  { type: 'NORMAL', label: 'Normal Mode', icon: Check, color: '#10B981' },
  { type: 'HEAT_WAVE', label: 'Heat Wave', icon: Sun, color: '#EF4444' },
  { type: 'AIR_POLLUTION', label: 'Air Pollution Smog', icon: Wind, color: '#F59E0B' },
  { type: 'FLOOD', label: 'Flood Emergency', icon: Droplet, color: '#0EA5E9' },
  { type: 'CYCLONE', label: 'Cyclone Storm', icon: Umbrella, color: '#8B5CF6' },
  { type: 'EXTREME_WEATHER', label: 'Extreme Weather', icon: CloudLightning, color: '#E11D48' },
  { type: 'DISEASE_OUTBREAK', label: 'Disease Outbreak', icon: Activity, color: '#06B6D4' },
];

export const DisasterModeModal: React.FC<DisasterModeModalProps> = ({
  visible,
  onClose,
  activeDisaster,
  onSelectDisaster,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <ShieldAlert color="#EF4444" size={22} />
              <View>
                <Text style={styles.title}>DISASTER RESPONSE MODE</Text>
                <Text style={styles.subtitle}>Re-prioritize Edge AI for environmental crises</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color="#94A3B8" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
            {disasterList.map((item) => {
              const isSelected = activeDisaster === item.type;
              const IconComp = item.icon;
              const profile = disasterProfiles[item.type];

              return (
                <TouchableOpacity
                  key={item.type}
                  style={[styles.itemCard, isSelected && { borderColor: item.color, backgroundColor: '#FFFFFF', shadowColor: item.color, shadowOpacity: 0.15, elevation: 3 }]}
                  onPress={() => {
                    onSelectDisaster(item.type);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${item.color}15` }]}>
                    <IconComp color={item.color} size={20} />
                  </View>

                  <View style={styles.itemTextCol}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemLabel}>{item.label}</Text>
                      {isSelected && (
                        <View style={[styles.activeTag, { backgroundColor: item.color }]}>
                          <Text style={styles.activeTagText}>ACTIVE</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.itemDesc} numberOfLines={2}>
                      {profile ? profile.environmentalNotice : 'Standard physiological baseline tracking.'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  closeBtn: {
    padding: 4,
  },
  scrollList: {
    marginTop: 14,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTextCol: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  activeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  itemDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 15,
  },
});
